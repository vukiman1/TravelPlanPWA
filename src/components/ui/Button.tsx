import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-ocean text-paper hover:bg-ocean-deep shadow-sm',
  secondary: 'bg-surface text-ink border border-line-strong hover:border-ocean/40',
  ghost: 'text-ink-soft hover:bg-ink/5',
  danger: 'text-coral border border-coral/30 hover:bg-coral/10',
}

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 rounded-xl px-3.5 text-sm',
  md: 'h-11 gap-2 rounded-xl px-5 text-[0.95rem]',
}

export function Button({ variant = 'primary', size = 'md', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean/40',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        className,
      )}
      {...props}
    />
  )
}
