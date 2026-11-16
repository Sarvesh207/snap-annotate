export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * Rectangle in NORMALISED image coordinates (0–1 of the image's width/height).
 * Storing boxes this way keeps them aligned at any display size: rendering just
 * multiplies by the current on-screen image size.
 */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Rectangle in on-screen pixels (the shape Konva works with). */
export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Annotation extends Rect {
  id: string;
  label: string;
  color: string;
}
