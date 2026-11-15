import { useCamera } from '../../hooks/useCamera';

// Temporary view to verify step 1 (camera stream + errors).
export function CameraView() {
  const { videoRef, state, retry, switchCamera } = useCamera();

  return (
    <div className="relative h-full bg-black">
      {/* Always rendered so videoRef exists before the stream arrives */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-contain"
      />

      {state.status === 'starting' && (
        <p className="absolute inset-0 grid place-items-center">Starting camera…</p>
      )}

      {state.status === 'error' && (
        <div className="absolute inset-0 grid place-content-center gap-2 p-6 text-center">
          <p className="font-semibold">{state.error.title}</p>
          <p className="text-sm text-neutral-400">{state.error.hint}</p>
          <button onClick={retry} className="mx-auto rounded bg-white px-4 py-2 text-black">
            Retry
          </button>
        </div>
      )}

      {state.status === 'ready' && (
        <button
          onClick={switchCamera}
          className="absolute bottom-4 right-4 rounded bg-white/20 px-3 py-2"
        >
          Switch
        </button>
      )}
    </div>
  );
}
