import { useMemo } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import { CATEGORIES } from '@/constants/categories'
import { formatVnd } from '@/lib/format'
import { groupByCategory } from '@/services/budget.service'
import type { TripItem } from '@/types/trip'

interface ActivitiesViewProps {
  items: TripItem[]
  onSelect: (item: TripItem) => void
}

export function ActivitiesView({ items, onSelect }: ActivitiesViewProps) {
  const groups = useMemo(() => groupByCategory(items), [items])

  if (groups.length === 0) {
    return (
      <div className="rounded-card border border-line bg-surface p-5 shadow-card">
        <p className="py-8 text-center text-sm text-ink-faint">Chưa có hoạt động nào. Thêm hoạt động để bắt đầu.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const meta = CATEGORIES[group.categoryId]
        const Icon = meta.icon
        return (
          <section key={group.categoryId} className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
            <header className="flex items-center justify-between gap-3 border-b border-line bg-paper/60 px-4 py-3.5 sm:px-5">
              <span className="flex items-center gap-2 font-display text-lg" style={{ color: meta.color }}>
                <Icon className="size-5" />
                {meta.label}
              </span>
              <span className="tnum text-sm font-semibold text-ink-soft">{formatVnd(group.plannedTotal)}</span>
            </header>
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
                      <p className="mt-1 text-xs text-ink-faint">
                        Ngày {item.dayNumber} · {item.time}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
