import { cn } from '@/lib/cn'

interface ProgressBarProps {
  value: number
  fillClassName?: string
  trackClassName?: string
  className?: string
}

export function ProgressBar({
  value,
  fillClassName = 'bg-sage',
  trackClassName = 'bg-ink/10',
  className,
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, value * 100))
  return (
    <div className={cn('h-2.5 w-full overflow-hidden rounded-full', trackClassName, className)}>
      <div
        className={cn('h-full rounded-full transition-[width] duration-700 ease-out', fillClassName)}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
