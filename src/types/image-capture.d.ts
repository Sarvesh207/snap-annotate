// TypeScript's DOM lib does not yet ship torch constraints or the ImageCapture API.
// Kept in one file so they are easy to delete once TS includes them.

export {};

declare global {
  interface MediaTrackCapabilities {
    torch?: boolean;
  }
  interface MediaTrackConstraintSet {
    torch?: boolean;
  }
  interface MediaTrackSettings {
    torch?: boolean;
  }

  type FillLightMode = 'auto' | 'off' | 'flash';

  interface MediaSettingsRange {
    min: number;
    max: number;
    step: number;
  }

  interface PhotoCapabilities {
    imageWidth: MediaSettingsRange;
    imageHeight: MediaSettingsRange;
    fillLightMode: FillLightMode[];
    redEyeReduction: 'never' | 'always' | 'controllable';
  }

  interface PhotoSettings {
    imageWidth?: number;
    imageHeight?: number;
    fillLightMode?: FillLightMode;
    redEyeReduction?: boolean;
  }

  class ImageCapture {
    constructor(track: MediaStreamTrack);
    readonly track: MediaStreamTrack;
    takePhoto(photoSettings?: PhotoSettings): Promise<Blob>;
    getPhotoCapabilities(): Promise<PhotoCapabilities>;
    getPhotoSettings(): Promise<PhotoSettings>;
    grabFrame(): Promise<ImageBitmap>;
  }
}
