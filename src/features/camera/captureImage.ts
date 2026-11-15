import type { CapturedPhoto } from '../../types/photo';

const JPEG_QUALITY = 0.92;
const TAKE_PHOTO_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('Timed out')), ms);
    promise.then(
      (value) => {
        clearTimeout(id);
        resolve(value);
      },
      (err) => {
        clearTimeout(id);
        reject(err);
      },
    );
  });
}

/**
 * Preferred path: ImageCapture.takePhoto() uses the camera's still-photo pipeline,
 * which is often a higher resolution than the video stream (mainly Chrome on Android).
 */
async function captureWithImageCapture(track: MediaStreamTrack): Promise<CapturedPhoto> {
  const imageCapture = new ImageCapture(track);

  let settings: PhotoSettings | undefined;
  try {
    const caps = await imageCapture.getPhotoCapabilities();
    settings = { imageWidth: caps.imageWidth?.max, imageHeight: caps.imageHeight?.max };
  } catch {
    settings = undefined; // let the browser pick its default
  }

  const blob = await withTimeout(imageCapture.takePhoto(settings), TAKE_PHOTO_TIMEOUT_MS);

  // Read real pixel size from the blob (also applies EXIF orientation).
  const bitmap = await createImageBitmap(blob);
  const { width, height } = bitmap;
  bitmap.close();

  return { blob, url: URL.createObjectURL(blob), width, height, method: 'image-capture' };
}

/** Fallback path: draw the current video frame at its native resolution. */
async function captureFromVideo(video: HTMLVideoElement): Promise<CapturedPhoto> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) throw new Error('Video is not ready');

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(video, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas encoding failed'))),
      'image/jpeg',
      JPEG_QUALITY,
    ),
  );

  return { blob, url: URL.createObjectURL(blob), width, height, method: 'video-frame' };
}

/** Captures the highest-quality still available, falling back gracefully. */
export async function captureImage(
  track: MediaStreamTrack,
  video: HTMLVideoElement,
): Promise<CapturedPhoto> {
  if ('ImageCapture' in window) {
    try {
      return await captureWithImageCapture(track);
    } catch {
      // Unsupported on this device, timed out, or threw: use the video frame.
    }
  }
  return captureFromVideo(video);
}
