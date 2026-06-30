import * as RSelect from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface SelectOption {
  value: string
  label: string
  leading?: ReactNode
}

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  options: readonly SelectOption[]
  id?: string
  ariaLabel?: string
  className?: string
}

export function Select({ value, onValueChange, options, id, ariaLabel, className }: SelectProps) {
  const selected = options.find((option) => option.value === value)

  return (
    <RSelect.Root value={value} onValueChange={onValueChange}>
      <RSelect.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-line-strong bg-surface px-3.5 text-left text-ink outline-none transition',
          'focus:border-ocean focus:ring-2 focus:ring-ocean/20 data-[state=open]:border-ocean',
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.leading}
          <span className="truncate">{selected?.label ?? 'Chọn...'}</span>
        </span>
        <RSelect.Icon>
          <ChevronDown className="size-4 shrink-0 text-ink-faint" />
        </RSelect.Icon>
      </RSelect.Trigger>

      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={6}
          className="z-[60] overflow-hidden rounded-xl border border-line bg-surface shadow-float animate-[pop_.14s_ease-out]"
          style={{ width: 'var(--radix-select-trigger-width)' }}
        >
          <RSelect.Viewport className="p-1.5">
            {options.map((option) => (
              <RSelect.Item
                key={option.value}
                value={option.value}
                className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-ink outline-none data-[highlighted]:bg-ocean/8 data-[state=checked]:font-semibold"
              >
                {option.leading}
                <RSelect.ItemText>{option.label}</RSelect.ItemText>
                <RSelect.ItemIndicator className="ml-auto">
                  <Check className="size-4 text-ocean" />
                </RSelect.ItemIndicator>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  )
}
