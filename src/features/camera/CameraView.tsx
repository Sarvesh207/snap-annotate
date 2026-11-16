import { useState } from 'react';
import { SwitchCamera } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useCamera, type FacingMode } from '../../hooks/useCamera';
import { useTorch } from '../../hooks/useTorch';
import { cn } from '../../lib/cn';
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
  const { videoRef, state, facingMode, retry, switchCamera } = useCamera(initialFacingMode);
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
    if ('vibrate' in navigator) navigator.vibrate(30); // haptic tick where supported (Android)
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
    // Landscape (rotated phones, desktops): controls move to a side column like native camera apps.
    <div className="flex h-full flex-col bg-black landscape:flex-row">
      {/* Preview: object-contain so what you see is exactly what gets captured */}
      <div className="relative min-h-0 min-w-0 flex-1">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          // Mirror the selfie preview only, as users expect; the captured photo is not mirrored.
          className={cn('h-full w-full object-contain', facingMode === 'user' && '-scale-x-100')}
        />

        {state.status === 'starting' && (
          <p role="status" className="absolute inset-0 grid place-items-center text-neutral-400">
            Starting camera…
          </p>
        )}
        {state.status === 'error' && <CameraError error={state.error} onRetry={retry} />}

        {isCapturing && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-white opacity-0 motion-safe:animate-shutter-flash"
            />
            <p role="status" className="absolute inset-x-0 bottom-4 text-center text-sm text-white/80">
              Capturing…
            </p>
          </>
        )}

        {notice && (
          <p
            role="alert"
            className="absolute inset-x-4 top-[max(1rem,env(safe-area-inset-top))] rounded-lg bg-red-600/90 px-4 py-2 text-center text-sm"
          >
            {notice}
          </p>
        )}
      </div>

      <div
        className={cn(
          'grid grid-cols-3 items-center px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
          'landscape:grid-cols-1 landscape:grid-rows-3 landscape:px-4 landscape:pt-6 landscape:pb-6',
          'landscape:pr-[max(1rem,env(safe-area-inset-right))]',
        )}
      >
        <TorchButton
          className="justify-self-start landscape:justify-self-center"
          supported={torch.supported}
          on={torch.on}
          pending={torch.pending}
          onToggle={torch.toggle}
        />

        <button
          type="button"
          onClick={handleCapture}
          disabled={!isReady || isCapturing}
          aria-label="Take photo"
          className="size-18 justify-self-center rounded-full border-4 border-white p-1 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95 disabled:opacity-40"
        >
          <span
            className={cn('block size-full rounded-full bg-white transition', isCapturing && 'scale-75 opacity-60')}
          />
        </button>

        <Button
          size="icon"
          onClick={handleSwitchCamera}
          disabled={!isReady}
          aria-label="Switch camera"
          className="justify-self-end landscape:justify-self-center"
        >
          <SwitchCamera className="size-6" />
        </Button>
      </div>
    </div>
  );
}
