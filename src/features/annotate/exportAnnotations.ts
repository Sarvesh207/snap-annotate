import type { Annotation } from './types';

/** Converts normalised boxes back to pixel coordinates of the original image. */
export function toExportJson(items: Annotation[], imageWidth: number, imageHeight: number) {
  return {
    image: { width: imageWidth, height: imageHeight },
    annotations: items.map((a) => ({
      id: a.id,
      label: a.label,
      x: Math.round(a.x * imageWidth),
      y: Math.round(a.y * imageHeight),
      width: Math.round(a.w * imageWidth),
      height: Math.round(a.h * imageHeight),
    })),
  };
}

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
