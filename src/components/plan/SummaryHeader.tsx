import { TriangleAlert } from 'lucide-react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatVnd } from '@/lib/format'
import type { BudgetSummary } from '@/services/budget.service'

interface SummaryHeaderProps {
  summary: BudgetSummary
}

export function SummaryHeader({ summary }: SummaryHeaderProps) {
  const percentLabel = Math.round(summary.percentUsed * 100)
  const fillClassName = summary.isOverBudget ? 'bg-coral' : summary.isNearLimit ? 'bg-sun' : 'bg-[#74c9a6]'

  return (
    <section className="relative overflow-hidden rounded-card bg-gradient-to-br from-ocean-deep via-ocean to-ocean-soft p-6 text-paper shadow-float animate-rise sm:p-8">
      <div className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-sun/25 blur-2xl" />
      <div className="pointer-events-none absolute right-5 top-5 size-14 rounded-full bg-sun/80 sm:size-20" />

      <div className="relative">
        <h2 className="max-w-[18ch] pr-16 font-display text-2xl leading-tight text-paper sm:pr-0 sm:text-3xl">
          Ngân sách
        </h2>

        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-[1fr_1fr_1.3fr]">
          <Figure label="Tổng ngân sách" value={formatVnd(summary.totalBudget)} />
          <Figure label="Thực tế đã chi" value={formatVnd(summary.actualSpent)} />
          <Figure
            label="Số tiền còn lại"
            value={formatVnd(summary.remaining)}
            emphasis
            tone={summary.isOverBudget ? 'over' : 'ok'}
          />
        </div>

        <div className="mt-6">
          <ProgressBar value={summary.percentUsed} fillClassName={fillClassName} trackClassName="bg-paper/15" />
          <div className="mt-2.5 flex items-center justify-between text-sm text-paper/70">
            <span className="tnum">Đã dùng {percentLabel}% ngân sách</span>
            <span className="tnum">Dự kiến {formatVnd(summary.plannedTotal)}</span>
          </div>
        </div>

        {(summary.isOverBudget || summary.isNearLimit) && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-paper/10 px-3.5 py-2.5 text-sm text-paper">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-sun" />
            <span>
              {summary.isOverBudget
                ? `Đã vượt ngân sách ${formatVnd(Math.abs(summary.remaining))}.`
                : 'Sắp chạm ngưỡng ngân sách, cân nhắc các khoản chi tiếp theo.'}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

interface FigureProps {
  label: string
  value: string
  emphasis?: boolean
  tone?: 'ok' | 'over'
}

function Figure({ label, value, emphasis = false, tone = 'ok' }: FigureProps) {
  return (
    <div className={emphasis ? 'col-span-2 sm:col-span-1' : undefined}>
      <p className="text-xs font-medium uppercase tracking-wide text-paper/55">{label}</p>
      <p
        className={
          emphasis
            ? `tnum mt-1 whitespace-nowrap font-display text-2xl font-semibold sm:text-3xl ${tone === 'over' ? 'text-coral-soft' : 'text-sun'}`
            : 'tnum mt-1 text-lg font-semibold text-paper sm:text-xl'
        }
      >
        {value}
      </p>
    </div>
  )
}
