import { CalendarPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DayGroup } from '@/components/plan/DayGroup'
import { ItemModal } from '@/components/plan/ItemModal'
import { SummaryHeader } from '@/components/plan/SummaryHeader'
import { computeSummary, groupByDay } from '@/services/budget.service'
import { useTripStore } from '@/store/trip-store'
import type { TripItem } from '@/types/trip'

interface ModalState {
  open: boolean
  item: TripItem | null
  day: number
}

export function PlanPage() {
  const { trip, items, upsertItem, deleteItem, addDay } = useTripStore()
  const [modal, setModal] = useState<ModalState>({ open: false, item: null, day: 1 })

  const summary = useMemo(() => computeSummary(trip, items), [trip, items])
  const groups = useMemo(() => groupByDay(items, trip.dayCount), [items, trip.dayCount])

  function openEdit(item: TripItem) {
    setModal({ open: true, item, day: item.dayNumber })
  }

  function openCreate(day: number) {
    setModal({ open: true, item: null, day })
  }

  function handleSubmit(item: TripItem) {
    upsertItem(item)
    toast.success('Đã lưu hoạt động')
  }

  function handleDelete(id: string) {
    deleteItem(id)
    toast.success('Đã xóa hoạt động')
  }

  return (
    <div className="space-y-5">
      <SummaryHeader trip={trip} summary={summary} />

      <div className="flex items-center justify-between pt-1">
        <h2 className="font-display text-xl text-ink">Lịch trình</h2>
        <button
          type="button"
          onClick={addDay}
          className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-sm font-medium text-ink-soft transition hover:border-ocean/50 hover:text-ocean"
        >
          <CalendarPlus className="size-4" />
          Thêm ngày
        </button>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <DayGroup
            key={group.dayNumber}
            group={group}
            startDate={trip.startDate}
            onSelect={openEdit}
            onAdd={openCreate}
          />
        ))}
      </div>

      <ItemModal
        open={modal.open}
        onOpenChange={(open) => setModal((prev) => ({ ...prev, open }))}
        item={modal.item}
        defaultDay={modal.day}
        dayCount={trip.dayCount}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  )
}
