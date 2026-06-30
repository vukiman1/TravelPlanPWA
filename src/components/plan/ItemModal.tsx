import * as Dialog from '@radix-ui/react-dialog'
import { Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AmountInput } from '@/components/ui/AmountInput'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import type { SelectOption } from '@/components/ui/Select'
import { FIELD_CLASS, FIELD_LABEL_CLASS } from '@/components/ui/field'
import { CATEGORY_LIST } from '@/constants/categories'
import { cn } from '@/lib/cn'
import type { CategoryId, PaymentStatus, TripItem } from '@/types/trip'

interface ItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: TripItem | null
  defaultDay: number
  dayCount: number
  onSubmit: (item: TripItem) => void
  onDelete: (id: string) => void
}

interface FormState {
  dayNumber: number
  time: string
  activity: string
  category: CategoryId
  plannedAmount: number
  actualAmount: number | null
  status: PaymentStatus
  note: string
}

const CATEGORY_OPTIONS: SelectOption[] = CATEGORY_LIST.map((meta) => ({
  value: meta.id,
  label: meta.label,
  leading: <meta.icon className="size-4" style={{ color: meta.color }} />,
}))

function buildInitialState(item: TripItem | null, defaultDay: number): FormState {
  if (item) {
    return {
      dayNumber: item.dayNumber,
      time: item.time,
      activity: item.activity,
      category: item.category,
      plannedAmount: item.plannedAmount,
      actualAmount: item.actualAmount,
      status: item.status,
      note: item.note,
    }
  }
  return {
    dayNumber: defaultDay,
    time: '08:00',
    activity: '',
    category: 'food',
    plannedAmount: 0,
    actualAmount: null,
    status: 'unpaid',
    note: '',
  }
}

export function ItemModal({ open, onOpenChange, item, defaultDay, dayCount, onSubmit, onDelete }: ItemModalProps) {
  const isEditing = item !== null
  const [form, setForm] = useState<FormState>(() => buildInitialState(item, defaultDay))

  useEffect(() => {
    if (open) setForm(buildInitialState(item, defaultDay))
  }, [open, item, defaultDay])

  const dayOptions: SelectOption[] = Array.from({ length: dayCount }, (_, index) => ({
    value: String(index + 1),
    label: `Ngày ${index + 1}`,
  }))

  function handleSubmit() {
    const activity = form.activity.trim()
    if (!activity) {
      toast.error('Hãy nhập tên hoạt động')
      return
    }
    onSubmit({
      id: item?.id ?? crypto.randomUUID(),
      dayNumber: form.dayNumber,
      time: form.time,
      activity,
      category: form.category,
      plannedAmount: form.plannedAmount,
      actualAmount: form.actualAmount,
      status: form.status,
      note: form.note.trim(),
      sortOrder: item?.sortOrder ?? Date.now(),
    })
    onOpenChange(false)
  }

  function handleDelete() {
    if (item) onDelete(item.id)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ocean-deep/45 backdrop-blur-sm animate-[fade_.15s_ease-out]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card border border-line bg-surface p-4 shadow-float animate-[pop_.16s_ease-out] sm:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <Dialog.Title className="font-display text-xl text-ink">
              {isEditing ? 'Sửa hoạt động' : 'Thêm hoạt động'}
            </Dialog.Title>
            <Dialog.Close className="rounded-full p-1.5 text-ink-faint transition hover:bg-ink/5 hover:text-ink">
              <X className="size-5" />
            </Dialog.Close>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={FIELD_LABEL_CLASS}>Ngày</label>
                <Select
                  ariaLabel="Ngày"
                  value={String(form.dayNumber)}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, dayNumber: Number(value) }))}
                  options={dayOptions}
                />
              </div>
              <div>
                <label htmlFor="item-time" className={FIELD_LABEL_CLASS}>
                  Thời gian
                </label>
                <input
                  id="item-time"
                  type="time"
                  value={form.time}
                  onChange={(event) => setForm((prev) => ({ ...prev, time: event.target.value }))}
                  className={cn(FIELD_CLASS, 'h-11 tnum')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="item-activity" className={FIELD_LABEL_CLASS}>
                Hoạt động
              </label>
              <input
                id="item-activity"
                value={form.activity}
                placeholder="VD: Ăn tối hải sản"
                onChange={(event) => setForm((prev) => ({ ...prev, activity: event.target.value }))}
                className={cn(FIELD_CLASS, 'h-11')}
              />
            </div>

            <div>
              <label className={FIELD_LABEL_CLASS}>Mục đích chi tiêu</label>
              <Select
                ariaLabel="Mục đích chi tiêu"
                value={form.category}
                onValueChange={(value) => setForm((prev) => ({ ...prev, category: value as CategoryId }))}
                options={CATEGORY_OPTIONS}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="item-planned" className={FIELD_LABEL_CLASS}>
                  Số tiền dự kiến
                </label>
                <AmountInput
                  id="item-planned"
                  value={form.plannedAmount}
                  onChange={(value) => setForm((prev) => ({ ...prev, plannedAmount: value ?? 0 }))}
                />
              </div>
              <div>
                <label htmlFor="item-actual" className={FIELD_LABEL_CLASS}>
                  Số tiền thực tế
                </label>
                <AmountInput
                  id="item-actual"
                  allowEmpty
                  placeholder="Chưa chi"
                  value={form.actualAmount}
                  onChange={(value) => setForm((prev) => ({ ...prev, actualAmount: value }))}
                />
              </div>
            </div>

            <div>
              <label className={FIELD_LABEL_CLASS}>Trạng thái</label>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-paper p-1">
                <StatusToggle
                  active={form.status === 'unpaid'}
                  label="Chưa thanh toán"
                  onClick={() => setForm((prev) => ({ ...prev, status: 'unpaid' }))}
                />
                <StatusToggle
                  active={form.status === 'paid'}
                  label="Đã thanh toán"
                  onClick={() => setForm((prev) => ({ ...prev, status: 'paid' }))}
                />
              </div>
            </div>

            <div>
              <label htmlFor="item-note" className={FIELD_LABEL_CLASS}>
                Ghi chú
              </label>
              <textarea
                id="item-note"
                rows={2}
                value={form.note}
                placeholder="VD: Nhà hàng ven biển"
                onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                className={cn(FIELD_CLASS, 'resize-none py-2.5')}
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            {isEditing ? (
              <Button variant="danger" onClick={handleDelete}>
                <Trash2 className="size-4" />
                Xóa
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button onClick={handleSubmit}>Lưu</Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

interface StatusToggleProps {
  active: boolean
  label: string
  onClick: () => void
}

function StatusToggle({ active, label, onClick }: StatusToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg py-2 text-sm font-medium transition',
        active ? 'bg-surface text-ocean shadow-sm' : 'text-ink-faint hover:text-ink-soft',
      )}
    >
      {label}
    </button>
  )
}
