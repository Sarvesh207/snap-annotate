import { lazy, Suspense, useState } from 'react';
import { CameraView } from './features/camera/CameraView';
import { PhotoReview } from './features/camera/PhotoReview';
import type { FacingMode } from './hooks/useCamera';
import type { CapturedPhoto } from './types/photo';

// Konva is large; load the annotation editor only when the user opens it,
// so the camera screen starts fast.
const AnnotateScreen = lazy(() =>
  import('./features/annotate/AnnotateScreen').then((m) => ({ default: m.AnnotateScreen })),
);

type Phase =
  | { step: 'camera' }
  | { step: 'review'; photo: CapturedPhoto }
  | { step: 'annotate'; photo: CapturedPhoto };

function App() {
  const [phase, setPhase] = useState<Phase>({ step: 'camera' });
  // Lives here (not in CameraView) so it survives CameraView unmounting on review.
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');

  /** Drops the current photo (freeing its object URL) and returns to the camera. */
  function discardPhoto() {
    if (phase.step !== 'camera') URL.revokeObjectURL(phase.photo.url);
    setPhase({ step: 'camera' });
  }

  return (
    <main className="h-full">
      {phase.step === 'camera' && (
        <CameraView
          initialFacingMode={facingMode}
          onFacingModeChange={setFacingMode}
          onCapture={(photo) => setPhase({ step: 'review', photo })}
        />
      )}
      {phase.step === 'review' && (
        <PhotoReview
          photo={phase.photo}
          onRetake={discardPhoto}
          onAnnotate={() => setPhase({ step: 'annotate', photo: phase.photo })}
        />
      )}
      {phase.step === 'annotate' && (
        <Suspense
          fallback={<p className="grid h-full place-items-center text-neutral-400">Loading editor…</p>}
        >
          <AnnotateScreen photo={phase.photo} onNewPhoto={discardPhoto} />
        </Suspense>
      )}
    </main>
  );
}

export default App;
