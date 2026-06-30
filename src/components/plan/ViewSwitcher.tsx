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
  return (
    <div className={cn('flex gap-1 rounded-full border border-line bg-surface p-1 shadow-card', className)}>
      {VIEW_OPTIONS.map((option) => {
        const Icon = option.icon
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition',
              isActive ? 'bg-ocean text-paper shadow-sm' : 'text-ink-soft hover:bg-ink/5',
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
