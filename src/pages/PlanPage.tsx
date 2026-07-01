import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CoverHero } from '@/components/CoverHero'
import { ActivitiesView } from '@/components/plan/ActivitiesView'
import { ItemModal } from '@/components/plan/ItemModal'
import { SpendingView } from '@/components/plan/SpendingView'
import { SummaryHeader } from '@/components/plan/SummaryHeader'
import { TimelineView } from '@/components/plan/TimelineView'
import { ViewSwitcher } from '@/components/plan/ViewSwitcher'
import type { PlanView } from '@/components/plan/ViewSwitcher'
import { Button } from '@/components/ui/Button'
import { computeSummary } from '@/services/budget.service'
import { useTripStore } from '@/store/trip-store'
import type { TripItem } from '@/types/trip'

interface ModalState {
  open: boolean
  item: TripItem | null
  day: number
}

export function PlanPage() {
  const { trip, items, couple, upsertItem, deleteItem } = useTripStore()
  const [view, setView] = useState<PlanView>('timeline')
  const [modal, setModal] = useState<ModalState>({ open: false, item: null, day: 1 })

  const summary = useMemo(() => computeSummary(trip, items), [trip, items])

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
      <CoverHero trip={trip} couple={couple} />

      <SummaryHeader summary={summary} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ViewSwitcher value={view} onChange={setView} className="w-full sm:flex-1" />
        <Button onClick={() => openCreate(1)} className="shrink-0">
          <Plus className="size-4" />
          Thêm hoạt động
        </Button>
      </div>

      <div key={view} className="animate-[view-in_.22s_ease-out]">
        {view === 'timeline' && (
          <TimelineView trip={trip} items={items} onSelect={openEdit} onAdd={openCreate} />
        )}
        {view === 'spending' && <SpendingView trip={trip} items={items} onSelect={openEdit} />}
        {view === 'activities' && <ActivitiesView items={items} onSelect={openEdit} />}
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
