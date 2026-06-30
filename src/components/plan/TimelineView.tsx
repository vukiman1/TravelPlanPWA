import { Plus } from 'lucide-react'
import { useMemo } from 'react'
import { CategoryBadge } from '@/components/CategoryBadge'
import { StatusBadge } from '@/components/StatusBadge'
import { formatVnd } from '@/lib/format'
import { groupByDay } from '@/services/budget.service'
import type { Trip, TripItem } from '@/types/trip'

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })

interface TimelineViewProps {
  trip: Trip
  items: TripItem[]
  onSelect: (item: TripItem) => void
  onAdd: (dayNumber: number) => void
}

export function TimelineView({ trip, items, onSelect, onAdd }: TimelineViewProps) {
  const groups = useMemo(() => groupByDay(items, trip.dayCount), [items, trip.dayCount])

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const dateLabel = formatDayDate(trip.startDate, group.dayNumber)
        return (
          <section key={group.dayNumber} className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
            <header className="flex items-center justify-between gap-3 border-b border-line bg-paper/60 px-4 py-3.5 sm:px-5">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-ocean font-display text-base font-semibold text-paper">
                  {group.dayNumber}
                </span>
                <div>
                  <p className="font-display text-lg leading-none text-ink">Ngày {group.dayNumber}</p>
                  {dateLabel && <p className="mt-1 text-xs text-ink-faint">{dateLabel}</p>}
                </div>
              </div>
              <div className="text-right text-xs text-ink-faint">
                <p>
                  Thực tế <span className="tnum font-semibold text-sage">{formatVnd(group.actualTotal)}</span>
                </p>
                <p className="mt-0.5">
                  Dự kiến <span className="tnum text-ink-soft">{formatVnd(group.plannedTotal)}</span>
                </p>
              </div>
            </header>

            <div className="p-3 sm:p-4">
              {group.items.length === 0 ? (
                <p className="py-5 text-center text-sm text-ink-faint">Chưa có hoạt động nào trong ngày này.</p>
              ) : (
                <ol className="space-y-3 border-l-2 border-line pl-5">
                  {group.items.map((item) => (
                    <li key={item.id} className="relative">
                      <span className="absolute -left-[1.6rem] top-2 size-3 rounded-full border-2 border-surface bg-ocean" />
                      <button
                        type="button"
                        onClick={() => onSelect(item)}
                        className="w-full rounded-2xl border border-transparent bg-paper/50 px-3.5 py-3 text-left transition hover:border-line hover:bg-paper"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="tnum font-display text-[0.95rem] text-ink-soft">{item.time}</span>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="mt-1 font-medium text-ink">{item.activity}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <CategoryBadge category={item.category} size="sm" />
                          {item.note && <span className="text-xs text-ink-faint">{item.note}</span>}
                        </div>
                        <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-2 text-sm">
                          <span className="text-ink-faint">
                            D.Kiến <span className="tnum font-medium text-ink-soft">{formatVnd(item.plannedAmount)}</span>
                          </span>
                          <span className="text-ink-faint">
                            T.Tế{' '}
                            <span className={`tnum font-semibold ${item.actualAmount === null ? 'text-ink-faint' : 'text-sage'}`}>
                              {item.actualAmount === null ? '—' : formatVnd(item.actualAmount)}
                            </span>
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ol>
              )}

              <button
                type="button"
                onClick={() => onAdd(group.dayNumber)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong py-2.5 text-sm font-medium text-ink-soft transition hover:border-ocean/50 hover:text-ocean"
              >
                <Plus className="size-4" />
                Thêm hoạt động
              </button>
            </div>
          </section>
        )
      })}
    </div>
  )
}

function formatDayDate(startDate: string | null, dayNumber: number): string | null {
  if (!startDate) return null
  const base = new Date(startDate)
  if (Number.isNaN(base.getTime())) return null
  base.setDate(base.getDate() + (dayNumber - 1))
  return WEEKDAY_FORMATTER.format(base)
}
