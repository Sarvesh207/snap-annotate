import { RotateCcw } from 'lucide-react';
import type { CapturedPhoto } from '../../types/photo';

interface PhotoReviewProps {
  photo: CapturedPhoto;
  onRetake: () => void;
}

export function PhotoReview({ photo, onRetake }: PhotoReviewProps) {
  return (
    <div className="flex h-full flex-col bg-black">
      <div className="min-h-0 flex-1">
        <img src={photo.url} alt="Captured photo" className="h-full w-full object-contain" />
      </div>

      {/* Temporary info line; replaced by the quality panel in step 4 */}
      <p className="px-4 pt-3 text-center text-xs text-neutral-400">
        {photo.width} × {photo.height} · {photo.method}
      </p>

      <div className="flex justify-center gap-3 px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          onClick={onRetake}
          className="flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 font-medium"
        >
          <RotateCcw className="size-5" /> Retake
        </button>
        {/* "Annotate" button added in step 5 */}
      </div>
    </div>
  );
}
