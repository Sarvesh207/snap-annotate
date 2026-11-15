import type { CapturedPhoto } from '../../types/photo';
import {
  gradeBrightness,
  gradeFileSize,
  gradeResolution,
  gradeSharpness,
  worstLevel,
} from './grade';
import { laplacianVariance, meanBrightness, toGrayscale } from './metrics';
import { ANALYSIS_WIDTH } from './thresholds';
import type { QualityCheck, QualityReport } from './types';

/** Decodes the photo into a small grayscale buffer for fast pixel analysis. */
async function loadGrayscale(blob: Blob) {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, ANALYSIS_WIDTH / bitmap.width);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas 2D context unavailable');
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const { data } = ctx.getImageData(0, 0, width, height);
  return { gray: toGrayscale(data), width, height };
}

/** Builds a quality report. Never rejects: if pixel analysis fails, metadata checks still show. */
export async function analyzeImage(photo: CapturedPhoto): Promise<QualityReport> {
  const checks: QualityCheck[] = [
    gradeResolution(photo.width, photo.height),
    gradeFileSize(photo.blob.size),
  ];

  try {
    const { gray, width, height } = await loadGrayscale(photo.blob);
    checks.push(gradeBrightness(meanBrightness(gray)), gradeSharpness(laplacianVariance(gray, width, height)));
  } catch {
    // Decoding/canvas unavailable: report what we can.
  }

  return { overall: worstLevel(checks.map((c) => c.level)), checks };
}
