import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { StatsTable } from '@/components/stats/StatsTable'
import { CATEGORIES } from '@/constants/categories'
import { formatVnd, formatVndCompact } from '@/lib/format'
import { totalsByCategory, totalsByDay } from '@/services/budget.service'
import { useTripStore } from '@/store/trip-store'

export function StatsPage() {
  const { trip, items } = useTripStore()

  const categoryData = useMemo(
    () =>
      totalsByCategory(items)
        .map((entry) => ({
          id: entry.categoryId,
          name: CATEGORIES[entry.categoryId].label,
          color: CATEGORIES[entry.categoryId].color,
          planned: entry.planned,
          actual: entry.actual,
        }))
        .sort((a, b) => b.planned - a.planned),
    [items],
  )

  const dayData = useMemo(
    () =>
      totalsByDay(items, trip.dayCount).map((entry) => ({
        name: `Ngày ${entry.dayNumber}`,
        planned: entry.planned,
        actual: entry.actual,
      })),
    [items, trip.dayCount],
  )

  const plannedTotal = categoryData.reduce((sum, entry) => sum + entry.planned, 0)
  const hasData = plannedTotal > 0
  const hasItems = items.length > 0

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl text-ink">Thống kê chi tiêu</h2>
        <p className="mt-1 text-sm text-ink-faint">Phân bổ ngân sách dự kiến và thực tế của chuyến đi.</p>
      </div>

      <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <h3 className="font-display text-lg text-ink">Phân bổ dự kiến theo danh mục</h3>
        {hasData ? (
          <div className="mt-4 grid items-center gap-4 sm:grid-cols-[200px_1fr]">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="planned"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatVnd(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2.5">
              {categoryData.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 text-sm">
                  <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="flex-1 text-ink-soft">{entry.name}</span>
                  <span className="tnum font-medium text-ink">{formatVnd(entry.planned)}</span>
                  <span className="tnum w-12 text-right text-ink-faint">
                    {Math.round((entry.planned / plannedTotal) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyChart />
        )}
      </section>

      <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <h3 className="font-display text-lg text-ink">Dự kiến vs Thực tế theo ngày</h3>
        {hasData ? (
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayData} barGap={6} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#9C927E', fontSize: 12 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tick={{ fill: '#9C927E', fontSize: 12 }}
                  tickFormatter={(value) => formatVndCompact(Number(value))}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(14,79,74,0.06)' }}
                  formatter={(value) => formatVnd(Number(value))}
                  contentStyle={{ borderRadius: 12, border: '1px solid #E6DBC4' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                <Bar dataKey="planned" name="Dự kiến" fill="#0E4F4A" radius={[6, 6, 0, 0]} />
                <Bar dataKey="actual" name="Thực tế" fill="#DD6444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart />
        )}
      </section>

      <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <h3 className="font-display text-lg text-ink">Chi tiết theo kế hoạch</h3>
        {hasItems ? (
          <div className="mt-4">
            <StatsTable trip={trip} items={items} />
          </div>
        ) : (
          <EmptyChart />
        )}
      </section>
    </div>
  )
}

function EmptyChart() {
  return (
    <p className="py-10 text-center text-sm text-ink-faint">
      Chưa có dữ liệu chi tiêu. Thêm hoạt động ở tab Kế hoạch để xem thống kê.
    </p>
  )
}
