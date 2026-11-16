# Technical Notes

How the three core parts work and why: **image capture**, **quality assessment**, and **annotation**.

---

## 1. Image capture strategy

### Getting the highest practical resolution
Resolution is negotiated in two steps ([`useCamera.ts`](../src/hooks/useCamera.ts)):

1. **Open with soft constraints:** `facingMode: { ideal }` plus `width/height: { ideal: 4096 }`. `ideal` values never fail; the browser picks the closest mode the camera supports. If a device still rejects them (`OverconstrainedError`), the hook retries with `{ video: true }`.
2. **Upgrade:** read `track.getCapabilities().width.max / height.max` and call `applyConstraints` with those values. If the upgrade fails, the stream already obtained is kept.

### Taking the photo
[`captureImage.ts`](../src/features/camera/captureImage.ts) uses two paths, and the result records which one ran (`method`). The review screen shows it.

| Path | When | Why |
|---|---|---|
| `ImageCapture.takePhoto()` with `imageWidth/Height` set to the reported max | Browser supports it (Chrome/Edge, mainly Android) | Uses the camera's **still-photo pipeline**, which is often higher resolution than the video stream |
| Canvas fallback: draw the current frame at `videoWidth × videoHeight`, encode as JPEG at 0.92 quality | No `ImageCapture`, or `takePhoto` throws or **times out (8 s)** | Works everywhere; the timeout guards against devices where `takePhoto` hangs |

The real pixel size is read back with `createImageBitmap(blob)`, which applies EXIF orientation, so later steps use the true dimensions.

### Lifecycle & errors
- The camera state is a discriminated union: `starting | ready(stream, track) | error(kind)`.
- The effect uses a `cancelled` flag and stops every track in cleanup. This avoids a leaked camera (and a camera LED left on) during StrictMode double-mounts, fast camera switches, and unmounts while `getUserMedia` is still pending.
- The track's `ended` event is reported as *"camera disconnected"*.
- [`cameraErrors.ts`](../src/features/camera/cameraErrors.ts) maps `DOMException` names, including legacy Chrome names, to typed failures with user-facing text:

| Failure | Detected by | Message | Retry |
|---|---|---|---|
| insecure | `!window.isSecureContext` / `SecurityError` | Needs HTTPS | Hidden |
| unsupported | no `navigator.mediaDevices.getUserMedia` | Browser can't access a camera | Hidden |
| permission-denied | `NotAllowedError` | How to re-enable in site settings | ✅ |
| not-found | `NotFoundError`, `OverconstrainedError` | No camera found | ✅ |
| in-use | `NotReadableError`, `AbortError` | Close other apps using the camera | ✅ |
| disconnected | track `ended` | Camera stopped unexpectedly | ✅ |

### Torch
[`useTorch.ts`](../src/hooks/useTorch.ts):
- **Support** comes from `track.getCapabilities().torch === true`, recomputed on every render. Some Android devices only report it after the stream starts, so the hook re-checks at 0.3 s, 1 s and 2.5 s.
- **Toggling** uses `applyConstraints({ advanced: [{ torch }] })`. After every attempt the UI shows **`track.getSettings().torch`**, the state the hardware reports, not the state that was requested. A failed toggle shows an error and leaves the button showing the previous state.
- **The state belongs to a specific track.** A camera switch or retake produces a new track, so the torch reads as off with no reset logic needed. Stopping the stream turns the hardware torch off.
- **Unsupported cameras** (front cameras, webcams, iOS) get a disabled button labelled *"Torch not available on this camera"*.

---

## 2. Quality assessment

[`analyzeImage.ts`](../src/features/quality/analyzeImage.ts) builds a report of four checks. Each is graded **good / warn / poor**, and the overall grade is the worst of the four.

| Check | Measure | Poor | Warn | Rationale |
|---|---|---|---|---|
| Resolution | width × height in MP | < 2 MP | < 5 MP | Below 2 MP, detail is lost when zooming to annotate; phones typically give 8–12 MP |
| File size | JPEG bytes | < 100 KB | < 300 KB | At ~0.92 quality, a very small file means a tiny or featureless image |
| Brightness | mean luma (0–255) | < 30 or > 230 | < 60 or > 200 | Catches under- and over-exposure |
| Sharpness | variance of the Laplacian | < 40 | < 100 | Blur suppresses edges, which lowers the second-derivative variance |

**How it is computed**
- The photo is decoded and drawn onto a **512 px-wide** canvas, then converted to grayscale with BT.601 luma weights (`0.299R + 0.587G + 0.114B`).
- Analysing a fixed size keeps it fast (a fraction of the pixels of a 12 MP image) and makes the sharpness score comparable across camera resolutions.
- **Brightness** is the mean luma.
- **Sharpness** applies the 4-neighbour Laplacian (`up + down + left + right − 4·centre`) to every interior pixel and takes the variance. This is a standard, cheap focus measure.

**Code structure:** [`metrics.ts`](../src/features/quality/metrics.ts) (pixel math) and [`grade.ts`](../src/features/quality/grade.ts) (value → grade + tip) are pure functions. [`thresholds.ts`](../src/features/quality/thresholds.ts) holds every number. The only DOM work is decoding the image in `analyzeImage.ts`.

**Feedback:** the panel shows the overall badge, each measured value with a colour dot (plus a screen-reader text for the grade), and an actionable tip for every failing check. If pixel analysis fails, the resolution and file-size checks are still shown.

**Limitations:** these are heuristics. Low-texture scenes (a plain wall, sky) can read as blurry, and artistic low-key or high-key shots can trigger brightness warnings. The thresholds were chosen to flag clearly unusable shots, not to judge aesthetics.

---

## 3. Annotation approach

### Data model
```ts
interface Annotation { id: string; label: string; color: string; x: number; y: number; w: number; h: number }
// x, y, w, h are fractions (0–1) of the image's width and height
```
Storing **normalised coordinates** is the key decision. A box is independent of the size the image is displayed at, so alignment can't drift: rendering is just `x × displayedWidth` and so on ([`geometry.ts`](../src/features/annotate/geometry.ts) `toPixels` / `toNormalized`).

All edits go through [`annotationReducer.ts`](../src/features/annotate/annotationReducer.ts). Default labels and colours come from a running counter, so "Box 3" stays "Box 3" after "Box 2" is deleted.

### Alignment across sizes
[`AnnotationCanvas.tsx`](../src/features/annotate/AnnotationCanvas.tsx):
1. `useElementSize` (ResizeObserver) measures the available area. This covers window resizes, phone rotation and layout changes.
2. The image is fitted with *contain* logic: `scale = min(areaW / imgW, areaH / imgH)`.
3. A wrapper of exactly `imgW·scale × imgH·scale` px holds the `<img>` and, on top of it, a Konva `Stage` of the same size.
4. Because the image and the stage share one box, pixel `(x·W, y·H)` on the stage is always the same point on the image.
5. Export converts back to **original image pixels**, so the JSON is accurate regardless of the screen it was made on.

### Interaction (react-konva)
| Operation | Implementation |
|---|---|
| **Draw** | Pointer down on empty stage → dashed draft rect → on release, created if ≥ 12 px in both dimensions (so a tap isn't a box). Clamped to the image |
| **Select** | Pointer down on a box, or its row in the list. Empty-area tap or <kbd>Esc</kbd> deselects. The selected box is rendered last (on top) |
| **Move** | Konva `draggable` with a `dragBoundFunc` that keeps the box inside the image. Each move dispatches `setRect` |
| **Resize** | Konva `Transformer` attached to the selected node: 8 anchors, rotation and flipping disabled, `boundBoxFunc` enforcing the image bounds and the 12 px minimum. Anchors get a 24 px invisible hit stroke for touch. Konva resizes via `scale`; on each `transform` event the scale is folded back into `width/height` and reset to 1, so stroke widths never stretch |
| **Label** | Inline inputs in the list (16 px text to avoid iOS focus-zoom). Labels render on the canvas with `listening={false}` so they never block dragging |
| **Delete** | Per-row button, "Clear all" (with confirmation), or <kbd>Delete</kbd>/<kbd>Backspace</kbd> |

**Touch specifics**
- Pointer events unify mouse, touch and pen.
- `touch-action: none` on the canvas prevents scroll and zoom while drawing.
- A second finger is ignored mid-gesture, and a cancelled pointer discards the draft.

**Why Konva rather than a custom SVG editor:** Konva provides proven hit-testing, dragging and transform handles that work well on touch devices. The app's own data model and alignment logic stay independent of the rendering library, which could be swapped without touching the reducer, list or export.

---

## Manual test checklist

| Area | Scenario | Expected |
|---|---|---|
| Permissions | Deny the camera, then allow it and tap Retry | Friendly message; recovers after retry |
| Insecure | Open over `http://<LAN IP>` | "Camera needs a secure connection", no retry button |
| Capture | Capture on Android Chrome | Review shows `ImageCapture` and full photo resolution |
| Capture | Capture on iOS Safari | Review shows "video frame"; photo is correct |
| Retake | Switch to front camera → capture → retake | Front camera re-opens |
| Torch | Toggle on the rear camera; switch to front | Button turns yellow and the light comes on; disabled and off on the front camera |
| Quality | Cover the lens / shake while capturing | Brightness / sharpness flagged with tips |
| Annotate | Draw, move, resize, rename, delete, clear | All operations work with touch and mouse |
| Alignment | Rotate the phone / resize the window with boxes drawn | Boxes stay on the same objects |
| Export | Export JSON | Pixel coordinates match the photo's dimensions |
| Layout | Portrait and landscape on phone, tablet, desktop | No clipped controls; list is a bottom panel (portrait) or sidebar (landscape) |
