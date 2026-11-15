// Pure pixel math, no DOM access, so it is easy to reason about (and to test).

/** RGBA bytes → luma per pixel (ITU-R BT.601 weights). */
export function toGrayscale(rgba: Uint8ClampedArray): Float32Array {
  const gray = new Float32Array(rgba.length / 4);
  for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
    gray[p] = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
  }
  return gray;
}

/** Average brightness, 0 (black) to 255 (white). */
export function meanBrightness(gray: Float32Array): number {
  if (gray.length === 0) return 0;
  let sum = 0;
  for (const v of gray) sum += v;
  return sum / gray.length;
}

/**
 * Sharpness score: variance of the Laplacian (4-neighbour kernel).
 * Sharp edges produce large second derivatives; blur flattens them, lowering the variance.
 */
export function laplacianVariance(gray: Float32Array, width: number, height: number): number {
  if (width < 3 || height < 3) return 0;

  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap = gray[i - 1] + gray[i + 1] + gray[i - width] + gray[i + width] - 4 * gray[i];
      sum += lap;
      sumSq += lap * lap;
      n++;
    }
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
}
