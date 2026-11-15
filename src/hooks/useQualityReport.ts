import { useEffect, useState } from 'react';
import { analyzeImage } from '../features/quality/analyzeImage';
import type { QualityReport } from '../features/quality/types';
import type { CapturedPhoto } from '../types/photo';

/** Analyses a photo; returns null while the analysis is running. */
export function useQualityReport(photo: CapturedPhoto): QualityReport | null {
  // Store which photo the report belongs to, so a new photo shows "loading" without a reset effect.
  const [result, setResult] = useState<{ photo: CapturedPhoto; report: QualityReport } | null>(null);

  useEffect(() => {
    let cancelled = false;
    analyzeImage(photo).then((report) => {
      if (!cancelled) setResult({ photo, report });
    });
    return () => {
      cancelled = true;
    };
  }, [photo]);

  return result?.photo === photo ? result.report : null;
}
