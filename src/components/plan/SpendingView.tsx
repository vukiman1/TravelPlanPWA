import { useMemo } from 'react'
import { CategoryBadge } from '@/components/CategoryBadge'
import { StatusBadge } from '@/components/StatusBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatVnd } from '@/lib/format'
import { groupByDay } from '@/services/budget.service'
import type { Trip, TripItem } from '@/types/trip'

interface SpendingViewProps {
  trip: Trip
  items: TripItem[]
  onSelect: (item: TripItem) => void
}

export function SpendingView({ trip, items, onSelect }: SpendingViewProps) {
  const groups = useMemo(() => groupByDay(items, trip.dayCount), [items, trip.dayCount])

  if (items.length === 0) {
    return (
      <div className="rounded-card border border-line bg-surface p-5 shadow-card">
        <p className="py-8 text-center text-sm text-ink-faint">Chưa có khoản chi nào. Thêm hoạt động để theo dõi chi tiêu.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const ratio = group.plannedTotal > 0 ? group.actualTotal / group.plannedTotal : 0
        const isOver = group.plannedTotal > 0 && group.actualTotal > group.plannedTotal
        return (
          <section key={group.dayNumber} className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
            <header className="border-b border-line bg-paper/60 px-4 py-3.5 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-lg text-ink">Ngày {group.dayNumber}</p>
                <div className="text-right text-xs text-ink-faint">
                  <p>
                    Thực tế <span className="tnum font-semibold text-sage">{formatVnd(group.actualTotal)}</span>
                  </p>
                  <p className="mt-0.5">
                    Dự kiến <span className="tnum text-ink-soft">{formatVnd(group.plannedTotal)}</span>
                  </p>
                </div>
              </div>
              <ProgressBar
                value={ratio}
                className="mt-3"
                fillClassName={isOver ? 'bg-coral' : 'bg-[#74c9a6]'}
                trackClassName="bg-ink/8"
              />
            </header>

            {group.items.length === 0 ? (
              <p className="px-4 py-5 text-center text-sm text-ink-faint">Không có khoản chi trong ngày này.</p>
            ) : (
              <ul className="divide-y divide-line/60 p-1.5 sm:p-2">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition hover:border-line hover:bg-paper sm:px-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{item.activity}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <CategoryBadge category={item.category} size="sm" />
                          <StatusBadge status={item.status} />
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-sm">
                        <p className={`tnum font-semibold ${item.actualAmount === null ? 'text-ink-faint' : 'text-sage'}`}>
                          {item.actualAmount === null ? '—' : formatVnd(item.actualAmount)}
                        </p>
                        <p className="tnum mt-0.5 text-xs text-ink-faint">DK {formatVnd(item.plannedAmount)}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
