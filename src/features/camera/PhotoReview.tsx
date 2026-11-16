import { RotateCcw, SquarePen } from 'lucide-react';
import { Button } from '../../components/ui/Button';
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
    // Landscape: photo on the left, quality + actions in a side column.
    <div className="flex h-full flex-col bg-black landscape:flex-row">
      <div className="min-h-0 min-w-0 flex-1">
        <img src={photo.url} alt="Captured photo" className="h-full w-full object-contain" />
      </div>

      <div className="flex shrink-0 flex-col landscape:w-80 landscape:justify-center landscape:overflow-y-auto landscape:pr-[env(safe-area-inset-right)]">
        <div className="pt-3">
          <QualityPanel report={report} />
          <p className="mt-1 px-4 text-center text-[11px] text-neutral-500">{METHOD_LABEL[photo.method]}</p>
        </div>

        <div className="flex justify-center gap-3 px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button onClick={onRetake}>
            <RotateCcw className="size-5" /> Retake
          </Button>
          <Button variant="primary" onClick={onAnnotate}>
            <SquarePen className="size-5" /> Annotate
          </Button>
        </div>
      </div>
    </div>
  );
}
