export type CameraFailureKind =
  | 'insecure'
  | 'unsupported'
  | 'permission-denied'
  | 'not-found'
  | 'in-use'
  | 'disconnected'
  | 'unknown';

export interface CameraFailure {
  kind: CameraFailureKind;
  title: string;
  hint: string;
}

const COPY: Record<CameraFailureKind, Omit<CameraFailure, 'kind'>> = {
  insecure: {
    title: 'Camera needs a secure connection',
    hint: 'Open this app over HTTPS (or localhost).',
  },
  unsupported: {
    title: 'Camera not supported',
    hint: 'This browser cannot access a camera. Try a recent Chrome, Safari or Firefox.',
  },
  'permission-denied': {
    title: 'Camera permission denied',
    hint: 'Allow camera access in your browser’s site settings, then retry.',
  },
  'not-found': {
    title: 'No camera found',
    hint: 'Connect a camera or try another device.',
  },
  'in-use': {
    title: 'Camera is busy',
    hint: 'Close other apps or tabs using the camera, then retry.',
  },
  disconnected: {
    title: 'Camera disconnected',
    hint: 'The camera stopped unexpectedly. Retry to reconnect.',
  },
  unknown: {
    title: 'Could not start camera',
    hint: 'Something went wrong. Please retry.',
  },
};

export function cameraFailure(kind: CameraFailureKind): CameraFailure {
  return { kind, ...COPY[kind] };
}

function isCameraFailure(value: unknown): value is CameraFailure {
  return typeof value === 'object' && value !== null && 'kind' in value && 'hint' in value;
}

/** Normalises anything thrown while starting the camera into a CameraFailure. */
export function toCameraFailure(err: unknown): CameraFailure {
  if (isCameraFailure(err)) return err;

  if (err instanceof DOMException) {
    switch (err.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError': // legacy Chrome
        return cameraFailure('permission-denied');
      case 'SecurityError':
        return cameraFailure('insecure');
      case 'NotFoundError':
      case 'DevicesNotFoundError': // legacy Chrome
      case 'OverconstrainedError':
        return cameraFailure('not-found');
      case 'NotReadableError':
      case 'TrackStartError': // legacy Chrome
      case 'AbortError':
        return cameraFailure('in-use');
    }
  }
  return cameraFailure('unknown');
}
