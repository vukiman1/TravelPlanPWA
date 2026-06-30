import { ArrowRight, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AmountInput } from '@/components/ui/AmountInput'
import { Button } from '@/components/ui/Button'
import { FIELD_CLASS, FIELD_LABEL_CLASS } from '@/components/ui/field'
import { cn } from '@/lib/cn'
import type { CreateTripInput } from '@/repositories/trip.repository'

interface OnboardingProps {
  onCreate: (input: CreateTripInput) => Promise<void>
  onOpen: (code: string) => void
  onSample: () => Promise<void>
}

export function Onboarding({ onCreate, onOpen, onSample }: OnboardingProps) {
  const [name, setName] = useState('Chuyến đi của tôi')
  const [budget, setBudget] = useState(10_000_000)
  const [days, setDays] = useState(3)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    try {
      await action()
    } catch (error) {
      console.error(error)
      toast.error('Không thực hiện được, kiểm tra kết nối Supabase')
    } finally {
      setBusy(false)
    }
  }

  function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Hãy nhập tên chuyến đi')
      return
    }
    void run(() => onCreate({ name: trimmed, totalBudget: budget, dayCount: Math.max(1, days), startDate: null }))
  }

  function handleOpen() {
    if (!code.trim()) {
      toast.error('Hãy dán mã chuyến đi')
      return
    }
    onOpen(code)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-rise">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/app-icon.svg" alt="" className="size-16 rounded-2xl shadow-card" />
          <h1 className="mt-4 font-display text-3xl text-ocean">Trip Budget</h1>
          <p className="mt-1.5 text-sm text-ink-soft">Lập kế hoạch chi tiêu cho chuyến du lịch của bạn.</p>
        </div>

        <div className="space-y-4 rounded-card border border-line bg-surface p-6 shadow-card">
          <h2 className="font-display text-lg text-ink">Tạo chuyến đi mới</h2>
          <div>
            <label htmlFor="onb-name" className={FIELD_LABEL_CLASS}>
              Tên chuyến đi
            </label>
            <input
              id="onb-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={cn(FIELD_CLASS, 'h-11')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="onb-budget" className={FIELD_LABEL_CLASS}>
                Tổng ngân sách
              </label>
              <AmountInput id="onb-budget" value={budget} onChange={(value) => setBudget(value ?? 0)} />
            </div>
            <div>
              <label htmlFor="onb-days" className={FIELD_LABEL_CLASS}>
                Số ngày
              </label>
              <input
                id="onb-days"
                type="number"
                min={1}
                value={days}
                onChange={(event) => setDays(Math.max(1, Number(event.target.value) || 1))}
                className={cn(FIELD_CLASS, 'tnum h-11')}
              />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={busy} className="w-full">
            Tạo chuyến đi
            <ArrowRight className="size-4" />
          </Button>
          <button
            type="button"
            onClick={() => void run(onSample)}
            disabled={busy}
            className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-ocean transition hover:text-ocean-deep disabled:opacity-50"
          >
            <Sparkles className="size-4" />
            Dùng dữ liệu mẫu (đi biển 3N2Đ)
          </button>
        </div>

        <div className="mt-4 space-y-3 rounded-card border border-line bg-surface/70 p-6">
          <h2 className="font-display text-lg text-ink">Mở chuyến đi đã có</h2>
          <p className="text-sm text-ink-soft">Dán mã chuyến đi để đồng bộ từ thiết bị khác.</p>
          <div className="flex gap-2">
            <input
              value={code}
              placeholder="Mã chuyến đi"
              onChange={(event) => setCode(event.target.value)}
              className={cn(FIELD_CLASS, 'h-11 flex-1')}
            />
            <Button variant="secondary" onClick={handleOpen} disabled={busy} className="shrink-0">
              Mở
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
