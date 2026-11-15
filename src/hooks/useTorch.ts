import { useEffect, useReducer, useState } from 'react';

/** Torch state is tied to a specific track: a new track (camera switch/retake) starts off. */
interface TorchRecord {
  track: MediaStreamTrack;
  on: boolean;
}

// Some Android devices only report the torch capability shortly after the stream starts.
const CAPABILITY_RECHECK_MS = [300, 1000, 2500];

export function useTorch(track: MediaStreamTrack | null) {
  const [record, setRecord] = useState<TorchRecord | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, recheckCapabilities] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    if (!track) return;
    const timers = CAPABILITY_RECHECK_MS.map((ms) => setTimeout(recheckCapabilities, ms));
    return () => timers.forEach(clearTimeout);
  }, [track]);

  // Derived from the track on every render, so nothing needs syncing in an effect.
  const supported = !!track && track.getCapabilities?.().torch === true;
  const on = !!track && record?.track === track && record.on;

  async function toggle() {
    if (!track || !supported || pending) return;

    const next = !on;
    setPending(true);
    setError(null);

    let applied = false;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      applied = true;
    } catch {
      setError('Could not switch the torch. Please try again.');
    }

    // Reflect what the hardware reports, not what we asked for.
    const actual = track.getSettings().torch ?? (applied ? next : on);
    setRecord({ track, on: actual });
    setPending(false);
  }

  return { supported, on, pending, error, toggle };
}
