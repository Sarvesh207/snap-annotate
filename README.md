# Snap & Annotate

Capture high-quality photos with your device camera, check their quality, and annotate them with bounding boxes. Built with React and TypeScript, mobile-first, and works with touch, mouse and pen.

**Live demo:** https://snap-annotate-tau.vercel.app
**Technical notes:** [docs/TECHNICAL_NOTES.md](docs/TECHNICAL_NOTES.md)

> The camera only works on a secure origin (HTTPS or `localhost`). The live demo is served over HTTPS.

---

## Features

**Camera & capture**
- Live preview from the rear camera by default, with a front/rear switch. The choice is remembered across retakes.
- Captures at the highest practical resolution. It uses `ImageCapture.takePhoto()` (the camera's still-photo pipeline) where available and falls back to a full-resolution video frame.
- Capture → review → retake flow, with a shutter flash, haptic feedback and a "Capturing…" status.
- **Torch toggle.** It is enabled only when the active camera reports torch support. The UI shows the torch state the hardware reports back, not the state that was requested.
- Clear, typed error states: insecure origin, unsupported browser, permission denied, no camera, camera in use, camera disconnected. Retry is offered where it can help.

**Image quality indicator**
- Shows resolution, file size, brightness and sharpness, each graded good / warn / poor.
- An overall badge shows the worst grade, and each failing check has a tip (e.g. *"Too dark: turn on the torch or move to better light"*).
- All thresholds live in one file ([`thresholds.ts`](src/features/quality/thresholds.ts)).

**Annotation**
- Draw rectangular boxes by dragging. Select, move, resize (8 handles), label and delete them.
- Boxes are stored in **normalised image coordinates (0–1)**, so they stay aligned at any screen size, on rotation, or when the window is resized.
- Annotation list for viewing and managing boxes: select, rename, delete, clear all. It's a bottom panel in portrait and a sidebar in landscape.
- Export to JSON in the original image's pixel coordinates.
- Desktop keyboard shortcuts: <kbd>Delete</kbd>/<kbd>Backspace</kbd> removes the selected box, <kbd>Esc</kbd> deselects.

**UI/UX**
- Responsive on phones, tablets and desktops, with dedicated landscape layouts for every screen.
- Touch-first: large hit areas, `100dvh` height, safe-area insets for notches, no accidental page scroll while drawing.
- Accessibility basics: labelled controls, `aria-pressed` on the torch, live regions for status updates, visible focus rings, and a reduced-motion-aware flash.

---

## Getting started

**Requirements:** Node.js 20.19+ (or 22.12+), npm.

```bash
npm install
npm run dev        # https://localhost:5173 (also exposed on your LAN)
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server over **HTTPS** (self-signed) and exposed on the local network |
| `npm run build` | Type-checks (`tsc -b`) and builds to `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | ESLint (TypeScript + React Hooks rules) |

### Testing on a phone
Browsers only allow camera access on secure origins. The dev server therefore uses `@vitejs/plugin-basic-ssl` and `server.host: true`:

1. Put the phone on the same Wi-Fi as your computer and run `npm run dev`.
2. Open the **Network** URL that Vite prints (e.g. `https://192.168.1.5:5173`).
3. Accept the self-signed certificate warning, then allow camera access.

If the page doesn't load, allow Node.js through your firewall on private networks.

### Deployment
The app is deployed on Vercel, which serves it over HTTPS (required for the camera). Vercel detects Vite automatically (build command `npm run build`, output folder `dist`). Every push to `main` triggers a redeploy.

---

## Architecture

```
src/
├── App.tsx                    # Screen state machine: camera → review → annotate
├── main.tsx                   # Root + ErrorBoundary
├── components/                # App-wide UI: ErrorBoundary, ui/Button
├── hooks/                     # React adapters for browser APIs
│   ├── useCamera.ts           #   getUserMedia lifecycle, max resolution, errors, switching
│   ├── useTorch.ts            #   torch capability + actual state
│   ├── useQualityReport.ts    #   async quality analysis for a photo
│   └── useElementSize.ts      #   ResizeObserver-based size
├── features/
│   ├── camera/                # Preview, capture strategy, review screen, error mapping
│   ├── quality/               # Thresholds, pure metrics + grading, QualityPanel
│   └── annotate/              # Konva canvas, list, reducer, geometry, JSON export
├── lib/                       # Small generic helpers (cn, formatting)
└── types/                     # Shared types + DOM typings missing from TS (torch, ImageCapture)
```

**Principles**
- **Feature folders.** Each requirement area (camera, quality, annotate) is self-contained.
- **Three layers.** Hooks wrap browser APIs, plain `.ts` modules hold the logic as pure functions, and components only render.
- **Explicit state.** The app flow is a discriminated union (`{ step: 'camera' } | { step: 'review', photo } | { step: 'annotate', photo }`), so impossible states can't be represented. The camera hook exposes `starting | ready | error` the same way.
- **No global state library.** Annotation edits go through one `useReducer` (`add`, `select`, `setRect`, `rename`, `delete`, `clear`), which keeps changes predictable and easy to trace.
- **Resource hygiene.** Camera tracks are stopped on unmount, including during StrictMode double-mounts and fast camera switches. Photo object URLs are revoked when a photo is discarded.
- **Performance.** The annotation editor (Konva) is lazy-loaded, so the camera screen loads about 77 KB gzipped instead of about 180 KB. Pixel analysis runs on a 512 px downscaled copy.

## Key decisions & libraries

| Choice | Why |
|---|---|
| **React 19 + TypeScript + Vite** | Fast dev loop and strict typing for browser APIs that are not well typed |
| **Tailwind CSS v4** | Fast, consistent responsive styling; orientation variants (`landscape:`) for the camera layouts |
| **react-konva** (annotation canvas) | Mature hit-testing, dragging and a `Transformer` with touch-friendly resize handles. The app keeps its own data model (normalised rects in a reducer); Konva is only the interaction and rendering layer |
| **No camera library** | `getUserMedia`, `ImageCapture` and track constraints are used directly. That gives full control over resolution negotiation, torch state and error mapping |
| **lucide-react** | Lightweight, consistent icons |
| **Custom quality metrics** | Brightness (mean luma) and sharpness (variance of the Laplacian) are a few lines of pure code, with no heavy CV dependency |

Details on each strategy are in [docs/TECHNICAL_NOTES.md](docs/TECHNICAL_NOTES.md).

---

## Browser support

The app uses feature detection throughout and never sniffs user agents. Expected behaviour:

| Browser | Capture method | Torch |
|---|---|---|
| Chrome / Edge on Android | `ImageCapture.takePhoto()` (full photo resolution) | ✅ on cameras with a flash |
| Safari on iOS | Video frame (stream resolution) | Disabled (not exposed by the browser) |
| Chrome / Edge desktop | `ImageCapture` or video frame | Disabled (webcams have no torch) |
| Firefox | Video frame | Disabled |

**Tested on:** _add devices, e.g. "Pixel 7 / Chrome 1xx, Windows 11 / Chrome 1xx"_

---

## Known limitations

- **iOS Safari and Firefox** don't support `ImageCapture`, so photos are capped at the video stream resolution (often 1080p–4K rather than the full sensor). iOS Safari also doesn't expose torch control.
- **Multi-lens phones:** the browser picks the default rear lens. There is no lens picker, and some phones report the torch only on their main lens.
- **Torch quirks:** some Android devices report torch support only after the stream starts (the app re-checks for up to 2.5 s), and `takePhoto()` can briefly turn the torch off on some devices.
- **Quality checks are heuristics.** The sharpness score depends on scene texture: a sharp photo of a plain wall can score as "blurry". Thresholds are documented and tunable.
- **Annotations are in memory only.** They are lost on "New photo" or a page reload (JSON export is available). Each session handles one photo.
- **Editor:** no pinch-zoom/pan for very small objects, no undo, rectangles only (no rotation or polygons), and boxes must be drawn with a pointer (no keyboard drawing).
- Destructive confirmations use the native `window.confirm` dialog.

## Trade-offs (one-week scope)

- **Core requirements first.** Camera, quality, annotation and responsive UI were built fully before any extras. Persistence, multi-photo sessions, zoom and undo were deliberately left out.
- **Konva over a hand-rolled SVG editor.** It means less custom interaction code and robust touch handles, at the cost of about 100 KB gzipped. That cost is mitigated by lazy-loading the editor.
- **Heuristic quality checks over ML-based assessment.** They are instant, run offline and are explainable, at the cost of some scene-dependent false warnings.
- **Testing:** verified manually on real devices (see the checklist in the technical notes). The logic is kept in pure modules (`geometry`, `annotationReducer`, `metrics`, `grade`, `cameraErrors`) so it is straightforward to unit-test. Automated tests are not included in this submission.
