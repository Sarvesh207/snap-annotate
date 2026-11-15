import { useState } from 'react';
import { CameraView } from './features/camera/CameraView';
import { PhotoReview } from './features/camera/PhotoReview';
import type { FacingMode } from './hooks/useCamera';
import type { CapturedPhoto } from './types/photo';

type Phase = { step: 'camera' } | { step: 'review'; photo: CapturedPhoto };

function App() {
  const [phase, setPhase] = useState<Phase>({ step: 'camera' });
  // Lives here (not in CameraView) so it survives CameraView unmounting on review.
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');

  function handleRetake() {
    if (phase.step === 'review') URL.revokeObjectURL(phase.photo.url); // free memory
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
      {phase.step === 'review' && <PhotoReview photo={phase.photo} onRetake={handleRetake} />}
    </main>
  );
}

export default App;
