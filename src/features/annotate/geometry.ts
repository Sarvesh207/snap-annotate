// Pure geometry helpers. Annotations are stored in normalised (0–1) image coordinates;
// these convert to/from on-screen pixels for whatever size the image is displayed at.
import type { PixelRect, Point, Rect, Size } from './types';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampPoint(p: Point): Point {
  return { x: clamp(p.x, 0, 1), y: clamp(p.y, 0, 1) };
}

/** Rect spanning two points, in any drag direction, clamped to the image. */
export function rectFromPoints(a: Point, b: Point): Rect {
  const p = clampPoint(a);
  const q = clampPoint(b);
  return {
    x: Math.min(p.x, q.x),
    y: Math.min(p.y, q.y),
    w: Math.abs(p.x - q.x),
    h: Math.abs(p.y - q.y),
  };
}

/** Normalised rect → pixels at the current display size. */
export function toPixels(rect: Rect, size: Size): PixelRect {
  return {
    x: rect.x * size.width,
    y: rect.y * size.height,
    width: rect.w * size.width,
    height: rect.h * size.height,
  };
}

/** Pixels at the current display size → normalised rect. */
export function toNormalized(px: PixelRect, size: Size): Rect {
  return {
    x: px.x / size.width,
    y: px.y / size.height,
    w: px.width / size.width,
    h: px.height / size.height,
  };
}
