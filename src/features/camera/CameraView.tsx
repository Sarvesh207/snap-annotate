import { useState } from 'react';
import { SwitchCamera } from 'lucide-react';
import { useCamera, type FacingMode } from '../../hooks/useCamera';
import { useTorch } from '../../hooks/useTorch';
import type { CapturedPhoto } from '../../types/photo';
import { captureImage } from './captureImage';
import { CameraError } from './CameraError';
import { TorchButton } from './TorchButton';

interface CameraViewProps {
  /** Camera to open on mount (e.g. the one used before a retake). */
  initialFacingMode: FacingMode;
  onFacingModeChange: (mode: FacingMode) => void;
  onCapture: (photo: CapturedPhoto) => void;
}

export function CameraView({ initialFacingMode, onFacingModeChange, onCapture }: CameraViewProps) {
  const { videoRef, state, retry, switchCamera } = useCamera(initialFacingMode);
  const torch = useTorch(state.status === 'ready' ? state.track : null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const isReady = state.status === 'ready';
  const notice = captureError ?? torch.error;

  async function handleCapture() {
    const video = videoRef.current;
    if (state.status !== 'ready' || !video || isCapturing) return;

    setIsCapturing(true);
    setCaptureError(null);
    try {
      onCapture(await captureImage(state.track, video));
    } catch {
      setCaptureError('Could not capture the photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }

  function handleSwitchCamera() {
    onFacingModeChange(switchCamera());
  }

  return (
    <div className="flex h-full flex-col bg-black">
      {/* Preview: object-contain so what you see is exactly what gets captured */}
      <div className="relative min-h-0 flex-1">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-contain"
        />

        {state.status === 'starting' && (
          <p className="absolute inset-0 grid place-items-center text-neutral-400">
            Starting camera…
          </p>
        )}
        {state.status === 'error' && <CameraError error={state.error} onRetry={retry} />}

        {notice && (
          <p
            role="alert"
            className="absolute inset-x-4 top-4 rounded-lg bg-red-600/90 px-4 py-2 text-center text-sm"
          >
            {notice}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 items-center px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <TorchButton
          supported={torch.supported}
          on={torch.on}
          pending={torch.pending}
          onToggle={torch.toggle}
        />

        <button
          onClick={handleCapture}
          disabled={!isReady || isCapturing}
          aria-label="Take photo"
          className="mx-auto size-18 rounded-full border-4 border-white p-1 transition active:scale-95 disabled:opacity-40"
        >
          <span
            className={`block size-full rounded-full bg-white transition ${isCapturing ? 'scale-75 opacity-60' : ''}`}
          />
        </button>

        <button
          onClick={handleSwitchCamera}
          disabled={!isReady}
          aria-label="Switch camera"
          className="ml-auto grid size-12 place-items-center rounded-full bg-white/15 disabled:opacity-40"
        >
          <SwitchCamera className="size-6" />
        </button>
      </div>
    </div>
  );
}
