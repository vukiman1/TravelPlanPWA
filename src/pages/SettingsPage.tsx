import { Check, Copy, Download, LogOut, RotateCcw, Upload } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { toast } from 'sonner'
import { AmountInput } from '@/components/ui/AmountInput'
import { Button } from '@/components/ui/Button'
import { FIELD_CLASS, FIELD_LABEL_CLASS } from '@/components/ui/field'
import { CATEGORY_LIST } from '@/constants/categories'
import { cn } from '@/lib/cn'
import type { TripData } from '@/store/trip-store'
import { useTripStore } from '@/store/trip-store'

export function SettingsPage() {
  const { trip, items, updateTrip, importData, resetToSample, switchTrip } = useTripStore()
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const syncLink = `${window.location.origin}/?trip=${trip.id}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(trip.id)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error('Không sao chép được mã')
    }
  }

  function handleExport() {
    const data: TripData = { trip, items }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `trip-budget-${trip.id}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Đã xuất file dữ liệu')
  }

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      let parsed: unknown
      try {
        parsed = JSON.parse(String(reader.result))
      } catch {
        toast.error('File không hợp lệ')
        return
      }
      if (!isTripData(parsed)) {
        toast.error('File không hợp lệ')
        return
      }
      importData(parsed)
        .then(() => toast.success('Đã nhập dữ liệu thành chuyến đi mới'))
        .catch(() => toast.error('Không nhập được dữ liệu'))
    }
    reader.readAsText(file)
  }

  function handleReset() {
    resetToSample()
      .then(() => toast.success('Đã tạo chuyến đi mẫu'))
      .catch(() => toast.error('Không tạo được dữ liệu mẫu'))
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl text-ink">Cài đặt</h2>
        <p className="mt-1 text-sm text-ink-faint">Thông tin chuyến đi, đồng bộ và sao lưu dữ liệu.</p>
      </div>

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
        <div className="grid grid-cols-2 gap-3">
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
            <label htmlFor="trip-days" className={FIELD_LABEL_CLASS}>
              Số ngày
            </label>
            <input
              id="trip-days"
              type="number"
              min={1}
              value={trip.dayCount}
              onChange={(event) => updateTrip({ dayCount: Math.max(1, Number(event.target.value) || 1) })}
              className={cn(FIELD_CLASS, 'h-11 tnum')}
            />
          </div>
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

      <SettingCard title="Đồng bộ thiết bị">
        <p className="text-sm text-ink-soft">
          Dán mã chuyến đi này vào thiết bị khác để mở cùng dữ liệu. Dữ liệu lưu trên Supabase.
        </p>
        <div className="flex items-center gap-2">
          <code className="tnum flex-1 truncate rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm text-ink">
            {trip.id}
          </code>
          <Button variant="secondary" size="sm" onClick={handleCopy} className="shrink-0">
            {copied ? <Check className="size-4 text-sage" /> : <Copy className="size-4" />}
            {copied ? 'Đã chép' : 'Chép mã'}
          </Button>
        </div>
        <div className="flex justify-center rounded-2xl border border-line bg-paper p-5">
          <QRCodeSVG value={syncLink} size={148} bgColor="transparent" fgColor="#0E4F4A" level="M" />
        </div>
        <Button variant="ghost" onClick={switchTrip} className="w-full">
          <LogOut className="size-4" />
          Đổi / mở chuyến đi khác
        </Button>
      </SettingCard>

      <SettingCard title="Sao lưu dữ liệu">
        <p className="text-sm text-ink-soft">Tải về hoặc khôi phục dữ liệu dưới dạng file JSON.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="size-4" />
            Xuất JSON
          </Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-4" />
            Nhập JSON
          </Button>
          <Button variant="ghost" onClick={handleReset}>
            <RotateCcw className="size-4" />
            Khôi phục mẫu
          </Button>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImport} className="hidden" />
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

function isTripData(value: unknown): value is TripData {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.trip === 'object' &&
    candidate.trip !== null &&
    Array.isArray(candidate.items)
  )
}
