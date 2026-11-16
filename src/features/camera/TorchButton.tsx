import { Flashlight, FlashlightOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface TorchButtonProps {
  supported: boolean;
  on: boolean;
  pending: boolean;
  onToggle: () => void;
  className?: string;
}

export function TorchButton({ supported, on, pending, onToggle, className }: TorchButtonProps) {
  const label = !supported
    ? 'Torch not available on this camera'
    : on
      ? 'Turn torch off'
      : 'Turn torch on';

  return (
    <Button
      size="icon"
      variant={on ? 'accent' : 'secondary'}
      onClick={onToggle}
      disabled={!supported || pending}
      aria-label={label}
      aria-pressed={supported ? on : undefined}
      title={label}
      className={className}
    >
      {on ? <Flashlight className="size-6" /> : <FlashlightOff className="size-6" />}
    </Button>
  );
}
