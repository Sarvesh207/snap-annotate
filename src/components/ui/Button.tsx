import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'icon' | 'iconSm';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-white text-black hover:bg-neutral-200',
  secondary: 'bg-white/15 text-white hover:bg-white/25',
  accent: 'bg-yellow-300 text-black hover:bg-yellow-200',
  ghost: 'text-neutral-300 hover:bg-white/10',
  danger: 'text-red-300 hover:bg-red-500/15',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'gap-2 px-4 py-2 text-sm',
  md: 'gap-2 px-5 py-3',
  icon: 'size-12',
  iconSm: 'size-9',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/** Shared button: consistent shape, touch feedback, focus ring and disabled state. */
export function Button({ variant = 'secondary', size = 'md', type = 'button', className, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-medium transition',
        'active:scale-95 disabled:pointer-events-none disabled:opacity-40',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  );
}
