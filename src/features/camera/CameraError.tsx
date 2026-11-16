import { CameraOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { CameraFailure } from './cameraErrors';

interface CameraErrorProps {
  error: CameraFailure;
  onRetry: () => void;
}

export function CameraError({ error, onRetry }: CameraErrorProps) {
  // Retrying can't fix an insecure or unsupported browser, so hide the button there.
  const canRetry = error.kind !== 'insecure' && error.kind !== 'unsupported';

  return (
    <div role="alert" className="absolute inset-0 grid place-content-center gap-3 p-6 text-center">
      <CameraOff className="mx-auto size-10 text-neutral-500" aria-hidden />
      <p className="text-lg font-semibold">{error.title}</p>
      <p className="max-w-sm text-sm text-neutral-400">{error.hint}</p>
      {canRetry && (
        <Button variant="primary" size="sm" onClick={onRetry} className="mx-auto mt-2">
          Retry
        </Button>
      )}
    </div>
  );
}
