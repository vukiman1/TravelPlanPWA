import { Plus } from 'lucide-react'
import { ItemRow, ROW_GRID } from './ItemRow'
import { formatVnd } from '@/lib/format'
import type { DayGroup as DayGroupData } from '@/services/budget.service'
import type { TripItem } from '@/types/trip'

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })

interface DayGroupProps {
  group: DayGroupData
  startDate: string | null
  onSelect: (item: TripItem) => void
  onAdd: (dayNumber: number) => void
}

export function DayGroup({ group, startDate, onSelect, onAdd }: DayGroupProps) {
  const dateLabel = formatDayDate(startDate, group.dayNumber)

  return (
    <section className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
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

      {group.items.length > 0 && (
        <div className={`hidden gap-3 border-b border-line px-7 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-faint md:grid ${ROW_GRID}`}>
          <span>Giờ</span>
          <span>Hoạt động</span>
          <span className="text-right">Dự kiến</span>
          <span className="text-right">Thực tế</span>
          <span className="text-right">Trạng thái</span>
        </div>
      )}

      <div className="divide-y divide-line/60 p-1.5 sm:p-2">
        {group.items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-ink-faint">Chưa có hoạt động nào trong ngày này.</p>
        ) : (
          group.items.map((item) => <ItemRow key={item.id} item={item} onSelect={onSelect} />)
        )}
      </div>

      <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        <button
          type="button"
          onClick={() => onAdd(group.dayNumber)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong py-2.5 text-sm font-medium text-ink-soft transition hover:border-ocean/50 hover:text-ocean"
        >
          <Plus className="size-4" />
          Thêm hoạt động
        </button>
      </div>
    </section>
  )
}

function formatDayDate(startDate: string | null, dayNumber: number): string | null {
  if (!startDate) return null
  const base = new Date(startDate)
  if (Number.isNaN(base.getTime())) return null
  base.setDate(base.getDate() + (dayNumber - 1))
  return WEEKDAY_FORMATTER.format(base)
}
