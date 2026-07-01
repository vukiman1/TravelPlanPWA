import { Clock, Coins, ListTodo } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export type PlanView = 'timeline' | 'spending' | 'activities'

interface ViewOption {
  value: PlanView
  label: string
  icon: LucideIcon
}

const VIEW_OPTIONS: readonly ViewOption[] = [
  { value: 'timeline', label: 'Thời gian', icon: Clock },
  { value: 'spending', label: 'Chi tiêu', icon: Coins },
  { value: 'activities', label: 'Hoạt động', icon: ListTodo },
]

interface ViewSwitcherProps {
  value: PlanView
  onChange: (view: PlanView) => void
  className?: string
}

export function ViewSwitcher({ value, onChange, className }: ViewSwitcherProps) {
  const activeIndex = VIEW_OPTIONS.findIndex((option) => option.value === value)

  return (
    <div className={cn('relative flex rounded-full border border-line bg-surface p-1 shadow-card', className)}>
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 rounded-full bg-ocean shadow-sm transition-transform duration-300 ease-out"
        style={{ width: 'calc((100% - 0.5rem) / 3)', transform: `translateX(calc(${activeIndex} * 100%))` }}
      />
      {VIEW_OPTIONS.map((option) => {
        const Icon = option.icon
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'text-paper' : 'text-ink-soft hover:text-ink',
            )}
          >
            <Icon className="size-4" />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
