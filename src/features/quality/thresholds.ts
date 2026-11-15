/**
 * All image-quality thresholds live here so they are easy to tune and to justify.
 * Values below "poor" fail; values below "warn" pass with a warning.
 */
export const THRESHOLDS = {
  /** Megapixels. <2 MP loses detail when zoomed to annotate; most phones give 8–12 MP. */
  resolutionMp: { poor: 2, warn: 5 },

  /** Bytes. A JPEG this small at ~0.92 quality usually means a tiny or featureless image. */
  fileSizeBytes: { poor: 100 * 1024, warn: 300 * 1024 },

  /** Mean luma on a 0–255 scale. */
  brightness: {
    dark: { poor: 30, warn: 60 },
    bright: { warn: 200, poor: 230 },
  },

  /** Variance of the Laplacian on the downscaled grayscale copy (higher = sharper). */
  sharpness: { poor: 40, warn: 100 },
} as const;

/** Width of the downscaled copy used for pixel analysis (fast, and stable across resolutions). */
export const ANALYSIS_WIDTH = 512;
