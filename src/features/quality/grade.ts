// Pure functions: measured value → QualityCheck, using THRESHOLDS.
import { formatBytes, formatMegapixels } from '../../lib/format';
import { THRESHOLDS } from './thresholds';
import type { QualityCheck, QualityLevel } from './types';

const SEVERITY: Record<QualityLevel, number> = { good: 0, warn: 1, poor: 2 };

export function worstLevel(levels: QualityLevel[]): QualityLevel {
  return levels.reduce<QualityLevel>((worst, l) => (SEVERITY[l] > SEVERITY[worst] ? l : worst), 'good');
}

/** For metrics where higher is better. */
function levelForMinimum(value: number, limits: { poor: number; warn: number }): QualityLevel {
  if (value < limits.poor) return 'poor';
  if (value < limits.warn) return 'warn';
  return 'good';
}

export function gradeResolution(width: number, height: number): QualityCheck {
  const level = levelForMinimum((width * height) / 1_000_000, THRESHOLDS.resolutionMp);
  return {
    id: 'resolution',
    label: 'Resolution',
    value: `${formatMegapixels(width, height)} · ${width}×${height}`,
    level,
    tip: level === 'good' ? undefined : 'Low resolution: use the rear camera or move closer to the subject.',
  };
}

export function gradeFileSize(bytes: number): QualityCheck {
  const level = levelForMinimum(bytes, THRESHOLDS.fileSizeBytes);
  return {
    id: 'fileSize',
    label: 'File size',
    value: formatBytes(bytes),
    level,
    tip: level === 'good' ? undefined : 'Very small file: the image may lack detail.',
  };
}

export function gradeBrightness(mean: number): QualityCheck {
  const { dark, bright } = THRESHOLDS.brightness;
  let level: QualityLevel = 'good';
  let tip: string | undefined;

  if (mean < dark.warn) {
    level = mean < dark.poor ? 'poor' : 'warn';
    tip = 'Too dark: turn on the torch or move to better light.';
  } else if (mean > bright.warn) {
    level = mean > bright.poor ? 'poor' : 'warn';
    tip = 'Overexposed: avoid direct light or glare on the subject.';
  }

  return {
    id: 'brightness',
    label: 'Brightness',
    value: `${Math.round((mean / 255) * 100)}%`,
    level,
    tip,
  };
}

export function gradeSharpness(score: number): QualityCheck {
  const level = levelForMinimum(score, THRESHOLDS.sharpness);
  return {
    id: 'sharpness',
    label: 'Sharpness',
    value: level === 'good' ? `Sharp (${Math.round(score)})` : `Blurry (${Math.round(score)})`,
    level,
    tip: level === 'good' ? undefined : 'Looks blurry: hold the device steady, let it focus, then retake.',
  };
}
