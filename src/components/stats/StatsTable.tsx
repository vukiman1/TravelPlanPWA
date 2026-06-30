import { Fragment } from 'react'
import { CategoryBadge } from '@/components/CategoryBadge'
import { StatusBadge } from '@/components/StatusBadge'
import { formatVnd } from '@/lib/format'
import { groupByDay } from '@/services/budget.service'
import type { Trip, TripItem } from '@/types/trip'

interface StatsTableProps {
  trip: Trip
  items: TripItem[]
}

export function StatsTable({ trip, items }: StatsTableProps) {
  const groups = groupByDay(items, trip.dayCount)
  const plannedTotal = groups.reduce((sum, group) => sum + group.plannedTotal, 0)
  const actualTotal = groups.reduce((sum, group) => sum + group.actualTotal, 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
            <th className="px-3 py-2.5 font-semibold">Giờ</th>
            <th className="px-3 py-2.5 font-semibold">Hoạt động</th>
            <th className="px-3 py-2.5 font-semibold">Danh mục</th>
            <th className="px-3 py-2.5 text-right font-semibold">Dự kiến</th>
            <th className="px-3 py-2.5 text-right font-semibold">Thực tế</th>
            <th className="px-3 py-2.5 text-right font-semibold">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <Fragment key={group.dayNumber}>
              <tr className="bg-paper/60">
                <td colSpan={3} className="px-3 py-2 font-display font-semibold text-ink">
                  Ngày {group.dayNumber}
                </td>
                <td className="tnum px-3 py-2 text-right text-ink-soft">{formatVnd(group.plannedTotal)}</td>
                <td className="tnum px-3 py-2 text-right font-semibold text-sage">{formatVnd(group.actualTotal)}</td>
                <td className="px-3 py-2" />
              </tr>
              {group.items.length === 0 ? (
                <tr className="border-b border-line/60">
                  <td colSpan={6} className="px-3 py-3 text-center text-ink-faint">
                    Không có hoạt động
                  </td>
                </tr>
              ) : (
                group.items.map((item) => (
                  <tr key={item.id} className="border-b border-line/60">
                    <td className="tnum px-3 py-2.5 text-ink-soft">{item.time}</td>
                    <td className="px-3 py-2.5 text-ink">{item.activity}</td>
                    <td className="px-3 py-2.5">
                      <CategoryBadge category={item.category} size="sm" />
                    </td>
                    <td className="tnum px-3 py-2.5 text-right text-ink-soft">{formatVnd(item.plannedAmount)}</td>
                    <td
                      className={`tnum px-3 py-2.5 text-right font-medium ${item.actualAmount === null ? 'text-ink-faint' : 'text-sage'}`}
                    >
                      {item.actualAmount === null ? '—' : formatVnd(item.actualAmount)}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))
              )}
            </Fragment>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-line font-semibold">
            <td colSpan={3} className="px-3 py-3 text-ink">
              Tổng
            </td>
            <td className="tnum px-3 py-3 text-right text-ink">{formatVnd(plannedTotal)}</td>
            <td className="tnum px-3 py-3 text-right text-sage">{formatVnd(actualTotal)}</td>
            <td className="px-3 py-3" />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
