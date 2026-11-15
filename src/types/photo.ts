export type CaptureMethod = 'image-capture' | 'video-frame';

/** A captured photo plus the metadata the quality check and annotation steps need. */
export interface CapturedPhoto {
  blob: Blob;
  /** Object URL for <img>. Must be revoked when the photo is discarded. */
  url: string;
  width: number;
  height: number;
  method: CaptureMethod;
}
