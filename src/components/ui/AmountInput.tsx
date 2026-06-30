import { cn } from '@/lib/cn'
import { groupDigits, parseAmount } from '@/lib/format'
import { FIELD_CLASS } from './field'

interface AmountInputProps {
  value: number | null
  onChange: (value: number | null) => void
  allowEmpty?: boolean
  id?: string
  placeholder?: string
}

export function AmountInput({ value, onChange, allowEmpty = false, id, placeholder = '0' }: AmountInputProps) {
  const display = value === null || value === undefined ? '' : groupDigits(value)

  return (
    <div className="relative">
      <input
        id={id}
        inputMode="numeric"
        value={display}
        placeholder={placeholder}
        onChange={(event) => {
          const raw = event.target.value
          if (raw.trim() === '') {
            onChange(allowEmpty ? null : 0)
            return
          }
          onChange(parseAmount(raw))
        }}
        className={cn(FIELD_CLASS, 'tnum h-11 pr-9 text-right')}
      />
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint">₫</span>
    </div>
  )
}
