import { Flashlight, FlashlightOff } from 'lucide-react';

interface TorchButtonProps {
  supported: boolean;
  on: boolean;
  pending: boolean;
  onToggle: () => void;
}

export function TorchButton({ supported, on, pending, onToggle }: TorchButtonProps) {
  const label = !supported
    ? 'Torch not available on this camera'
    : on
      ? 'Turn torch off'
      : 'Turn torch on';

  return (
    <button
      onClick={onToggle}
      disabled={!supported || pending}
      aria-label={label}
      aria-pressed={supported ? on : undefined}
      title={label}
      className={`grid size-12 place-items-center rounded-full transition disabled:opacity-40 ${
        on ? 'bg-yellow-300 text-black' : 'bg-white/15'
      }`}
    >
      {on ? <Flashlight className="size-6" /> : <FlashlightOff className="size-6" />}
    </button>
  );
}
