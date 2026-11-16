import { RotateCcw, SquarePen } from 'lucide-react';
import { useQualityReport } from '../../hooks/useQualityReport';
import type { CapturedPhoto } from '../../types/photo';
import { QualityPanel } from '../quality/QualityPanel';

const METHOD_LABEL: Record<CapturedPhoto['method'], string> = {
  'image-capture': 'Captured with ImageCapture (full photo resolution)',
  'video-frame': 'Captured from video frame',
};

interface PhotoReviewProps {
  photo: CapturedPhoto;
  onRetake: () => void;
  onAnnotate: () => void;
}

export function PhotoReview({ photo, onRetake, onAnnotate }: PhotoReviewProps) {
  const report = useQualityReport(photo);

  return (
    <div className="flex h-full flex-col bg-black">
      <div className="min-h-0 flex-1">
        <img src={photo.url} alt="Captured photo" className="h-full w-full object-contain" />
      </div>

      <div className="pt-3">
        <QualityPanel report={report} />
        <p className="mt-1 text-center text-[11px] text-neutral-500">{METHOD_LABEL[photo.method]}</p>
      </div>

      <div className="flex justify-center gap-3 px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          onClick={onRetake}
          className="flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 font-medium"
        >
          <RotateCcw className="size-5" /> Retake
        </button>
        <button
          onClick={onAnnotate}
          className="flex items-center gap-2 rounded-full bg-white px-5 py-3 font-medium text-black"
        >
          <SquarePen className="size-5" /> Annotate
        </button>
      </div>
    </div>
  );
}
