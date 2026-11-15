export type QualityLevel = 'good' | 'warn' | 'poor';

export type QualityCheckId = 'resolution' | 'fileSize' | 'brightness' | 'sharpness';

export interface QualityCheck {
  id: QualityCheckId;
  label: string;
  /** Human-readable measured value, e.g. "12.2 MP". */
  value: string;
  level: QualityLevel;
  /** Actionable advice, present only when the check is not "good". */
  tip?: string;
}

export interface QualityReport {
  overall: QualityLevel;
  checks: QualityCheck[];
}
