import { CategoryBadge } from '@/components/CategoryBadge'
import { StatusBadge } from '@/components/StatusBadge'
import { formatVnd } from '@/lib/format'
import type { TripItem } from '@/types/trip'

export const ROW_GRID = 'grid-cols-[58px_1fr_128px_128px_160px]'

interface ItemRowProps {
  item: TripItem
  onSelect: (item: TripItem) => void
}

export function ItemRow({ item, onSelect }: ItemRowProps) {
  const actualLabel = item.actualAmount === null ? '—' : formatVnd(item.actualAmount)

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group w-full rounded-2xl border border-transparent px-3 py-3 text-left transition hover:border-line hover:bg-paper sm:px-4"
    >
      {/* Desktop: aligned table row */}
      <div className={`hidden items-center gap-3 md:grid ${ROW_GRID}`}>
        <span className="tnum font-display text-[0.95rem] text-ink-soft">{item.time}</span>
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{item.activity}</p>
          <div className="mt-1 flex items-center gap-2">
            <CategoryBadge category={item.category} size="sm" />
            {item.note && <span className="truncate text-xs text-ink-faint">{item.note}</span>}
          </div>
        </div>
        <span className="tnum text-right text-ink-soft">{formatVnd(item.plannedAmount)}</span>
        <span className={`tnum text-right font-semibold ${item.actualAmount === null ? 'text-ink-faint' : 'text-sage'}`}>
          {actualLabel}
        </span>
        <div className="flex justify-end">
          <StatusBadge status={item.status} />
        </div>
      </div>

      {/* Mobile: card */}
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="tnum font-display text-[0.95rem] text-ink-soft">{item.time}</span>
          <StatusBadge status={item.status} />
        </div>
        <p className="mt-1.5 font-medium text-ink">{item.activity}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <CategoryBadge category={item.category} size="sm" />
          {item.note && <span className="text-xs text-ink-faint">{item.note}</span>}
        </div>
        <div className="mt-2.5 flex items-center justify-between border-t border-line/70 pt-2.5 text-sm">
          <span className="text-ink-faint">
            Dự kiến <span className="tnum font-medium text-ink-soft">{formatVnd(item.plannedAmount)}</span>
          </span>
          <span className="text-ink-faint">
            Thực tế{' '}
            <span className={`tnum font-semibold ${item.actualAmount === null ? 'text-ink-faint' : 'text-sage'}`}>
              {actualLabel}
            </span>
          </span>
        </div>
      </div>
    </button>
  )
}
