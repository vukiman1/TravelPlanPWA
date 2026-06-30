import { useState } from 'react'
import type { ReactNode } from 'react'
import { AmountInput } from '@/components/ui/AmountInput'
import { FIELD_CLASS, FIELD_LABEL_CLASS } from '@/components/ui/field'
import { CATEGORY_LIST } from '@/constants/categories'
import { cn } from '@/lib/cn'
import { useTripStore } from '@/store/trip-store'

export function SettingsPage() {
  const { trip, couple, updateTrip, updateCouple } = useTripStore()
  const [youDraft, setYouDraft] = useState(couple.you)
  const [partnerDraft, setPartnerDraft] = useState(couple.partner)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl text-ink">Cài đặt</h2>
        <p className="mt-1 text-sm text-ink-faint">Thông tin chuyến đi của hai đứa mình.</p>
      </div>

      <SettingCard title="Hai đứa mình">
        <div>
          <label htmlFor="couple-you" className={FIELD_LABEL_CLASS}>
            Tên bạn
          </label>
          <input
            id="couple-you"
            value={youDraft}
            onChange={(event) => {
              setYouDraft(event.target.value)
              updateCouple({ you: event.target.value, partner: partnerDraft })
            }}
            onBlur={() => {
              if (!youDraft.trim()) setYouDraft(couple.you)
            }}
            className={cn(FIELD_CLASS, 'h-11')}
          />
        </div>
        <div>
          <label htmlFor="couple-partner" className={FIELD_LABEL_CLASS}>
            Tên người ấy
          </label>
          <input
            id="couple-partner"
            value={partnerDraft}
            onChange={(event) => {
              setPartnerDraft(event.target.value)
              updateCouple({ you: youDraft, partner: event.target.value })
            }}
            onBlur={() => {
              if (!partnerDraft.trim()) setPartnerDraft(couple.partner)
            }}
            className={cn(FIELD_CLASS, 'h-11')}
          />
        </div>
      </SettingCard>

      <SettingCard title="Thông tin chuyến đi">
        <div>
          <label htmlFor="trip-name" className={FIELD_LABEL_CLASS}>
            Tên chuyến đi
          </label>
          <input
            id="trip-name"
            value={trip.name}
            onChange={(event) => updateTrip({ name: event.target.value })}
            className={cn(FIELD_CLASS, 'h-11')}
          />
        </div>
        <div>
          <label htmlFor="trip-budget" className={FIELD_LABEL_CLASS}>
            Tổng ngân sách
          </label>
          <AmountInput
            id="trip-budget"
            value={trip.totalBudget}
            onChange={(value) => updateTrip({ totalBudget: value ?? 0 })}
          />
        </div>
        <div>
          <label htmlFor="trip-start" className={FIELD_LABEL_CLASS}>
            Ngày bắt đầu (tùy chọn)
          </label>
          <input
            id="trip-start"
            type="date"
            value={trip.startDate ?? ''}
            onChange={(event) => updateTrip({ startDate: event.target.value || null })}
            className={cn(FIELD_CLASS, 'h-11')}
          />
        </div>
      </SettingCard>

      <SettingCard title="Danh mục chi tiêu">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_LIST.map((meta) => {
            const Icon = meta.icon
            return (
              <span
                key={meta.id}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
                style={{ color: meta.color, backgroundColor: `${meta.color}1a` }}
              >
                <Icon className="size-4" />
                {meta.label}
              </span>
            )
          })}
        </div>
      </SettingCard>
    </div>
  )
}

interface SettingCardProps {
  title: string
  children: ReactNode
}

function SettingCard({ title, children }: SettingCardProps) {
  return (
    <section className="space-y-4 rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
      <h3 className="font-display text-lg text-ink">{title}</h3>
      {children}
    </section>
  )
}
