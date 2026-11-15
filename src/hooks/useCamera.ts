import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cameraFailure,
  toCameraFailure,
  type CameraFailure,
} from '../features/camera/cameraErrors';

export type FacingMode = 'environment' | 'user';

export type CameraState =
  | { status: 'starting' }
  | { status: 'ready'; stream: MediaStream; track: MediaStreamTrack }
  | { status: 'error'; error: CameraFailure };

// Ask high first; the browser picks the closest mode the camera supports.
const HIGH_RES: MediaTrackConstraints = {
  width: { ideal: 4096 },
  height: { ideal: 4096 },
};

function stopStream(stream: MediaStream) {
  stream.getTracks().forEach((t) => t.stop());
}

async function openStream(facingMode: FacingMode): Promise<MediaStream> {
  if (!window.isSecureContext) throw cameraFailure('insecure');
  if (!navigator.mediaDevices?.getUserMedia) throw cameraFailure('unsupported');

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: facingMode }, ...HIGH_RES },
    });
  } catch (err) {
    // Some devices reject the high-res request outright; fall back to defaults.
    if (err instanceof DOMException && err.name === 'OverconstrainedError') {
      return navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    }
    throw err;
  }
}

/** Second pass: push the track to the max resolution the hardware reports. */
async function upgradeToMaxResolution(track: MediaStreamTrack) {
  const caps = track.getCapabilities?.();
  const maxW = caps?.width?.max;
  const maxH = caps?.height?.max;
  if (!maxW || !maxH) return;

  try {
    await track.applyConstraints({ width: { ideal: maxW }, height: { ideal: maxH } });
  } catch {
    // Not fatal: keep whatever resolution we already have.
  }
}

export function useCamera(initialFacing: FacingMode = 'environment') {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>(initialFacing);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<CameraState>({ status: 'starting' });

  // Open (or reopen) the camera whenever facing mode changes or the user retries.
  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;

    const handleEnded = () => {
      if (!cancelled) setState({ status: 'error', error: cameraFailure('disconnected') });
    };

    (async () => {
      try {
        const opened = await openStream(facingMode);
        if (cancelled) {
          stopStream(opened); // unmounted mid-request (e.g. StrictMode double-run)
          return;
        }
        stream = opened;

        const [track] = opened.getVideoTracks();
        await upgradeToMaxResolution(track);
        if (cancelled) return;

        track.addEventListener('ended', handleEnded);
        setState({ status: 'ready', stream: opened, track });
      } catch (err) {
        if (!cancelled) setState({ status: 'error', error: toCameraFailure(err) });
      }
    })();

    return () => {
      cancelled = true;
      if (stream) {
        stream.getVideoTracks().forEach((t) => t.removeEventListener('ended', handleEnded));
        stopStream(stream);
      }
    };
  }, [facingMode, attempt]);

  // Attach the stream to the <video>. The <video> must always be rendered.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || state.status !== 'ready') return;

    video.srcObject = state.stream;
    video.play().catch(() => {
      // muted + playsInline autoplay is allowed; ignore interrupted play()
    });

    return () => {
      video.srcObject = null;
    };
  }, [state]);

  const retry = useCallback(() => {
    setState({ status: 'starting' });
    setAttempt((n) => n + 1);
  }, []);

  const switchCamera = useCallback(() => {
    setState({ status: 'starting' });
    setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'));
  }, []);

  return { videoRef, state, facingMode, retry, switchCamera };
}
