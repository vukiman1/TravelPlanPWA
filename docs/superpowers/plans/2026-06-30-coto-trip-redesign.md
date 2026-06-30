# Single-trip "Cô Tô 3N2Đ" + Lịch trình đa view — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển app sang một chuyến đi cố định "Cô Tô 3N2Đ", thêm bước nhập tên người dùng, tách Lịch trình thành 3 view, và bổ sung bảng chi tiết ở Thống kê.

**Architecture:** Giữ kiến trúc phân tầng `page → store → repository → Supabase`. Trip dùng 1 UUID cố định; `ensureTrip()` upsert idempotent (không clobber). Tên người dùng lưu `localStorage`, gate hiển thị trước khi load trip. Mỗi view Lịch trình là component tự chứa, đọc cùng `items/trip` rồi render khác nhau, dùng chung `ItemModal`.

**Tech Stack:** React 19, Vite, Tailwind v4, Supabase JS, recharts, lucide-react, Radix.

## Global Constraints

- Verification gate mỗi task: `npm run build` (tsc strict, `noUnusedLocals`/`noUnusedParameters`) **và** `npm run lint` (oxlint) đều phải pass. **Không** có test runner trong repo.
- **Không auto-commit/push/PR.** Commit do chủ dự án tự chạy `/commit`. Plan không chứa bước git.
- TypeScript: không dùng `any`; type/return rõ ràng; `interface` cho object shape, `type` cho union.
- Chuỗi hiển thị bằng **tiếng Việt**; identifier/file/folder bằng **English**.
- Import nội bộ dùng alias `@/`. Dùng token màu/semantic của design system (ocean, sage, coral, ink, paper, line…), không hardcode hex mới (ngoại lệ: tái dùng `#74c9a6` đã có trong `SummaryHeader`).
- Tiền: dùng `formatVnd` từ `@/lib/format`. Số tiền là integer.
- Không thêm comment thừa; không để dead code sau khi gỡ.

---

### Task 1: Foundation — constants, `ensureTrip`, `groupByCategory`

Các thay đổi **bổ sung** (additive), không gỡ gì, nên build luôn xanh.

**Files:**
- Create: `src/constants/trip.ts`
- Modify: `src/repositories/trip.repository.ts` (thêm import + hàm `ensureTrip`)
- Modify: `src/services/budget.service.ts` (thêm `CategoryGroup` + `groupByCategory`)

**Interfaces:**
- Produces:
  - `COTO_TRIP_ID: string`, `COTO_TRIP_NAME: string`, `DEFAULT_DAY_COUNT: number`, `USERNAME_STORAGE_KEY: string` (từ `@/constants/trip`)
  - `ensureTrip(): Promise<Trip>` (từ `@/repositories/trip.repository`)
  - `interface CategoryGroup { categoryId: CategoryId; items: TripItem[]; plannedTotal: number; actualTotal: number }`
  - `groupByCategory(items: TripItem[]): CategoryGroup[]` (từ `@/services/budget.service`)

- [ ] **Step 1: Tạo `src/constants/trip.ts`**

```ts
export const COTO_TRIP_ID = 'c0700000-0000-4000-8000-000000000001'
export const COTO_TRIP_NAME = 'Cô Tô 3N2Đ'
export const DEFAULT_DAY_COUNT = 3
export const USERNAME_STORAGE_KEY = 'trip-budget:username'
```

- [ ] **Step 2: Thêm `ensureTrip` vào `src/repositories/trip.repository.ts`**

Thêm import ngay dưới các import hiện có:

```ts
import { COTO_TRIP_ID, COTO_TRIP_NAME, DEFAULT_DAY_COUNT } from '@/constants/trip'
```

Thêm hàm này (đặt sau `fetchTrip`, trước `createTrip`):

```ts
export async function ensureTrip(): Promise<Trip> {
  const { error } = await supabase.from('trips').upsert(
    {
      id: COTO_TRIP_ID,
      name: COTO_TRIP_NAME,
      total_budget: 0,
      day_count: DEFAULT_DAY_COUNT,
      start_date: null,
    },
    { onConflict: 'id', ignoreDuplicates: true },
  )
  if (error) throw new SupabaseError('Không khởi tạo được chuyến đi', error)

  const trip = await fetchTrip(COTO_TRIP_ID)
  if (!trip) throw new SupabaseError('Không tải được chuyến đi', new Error('Trip missing after ensure'))
  return trip
}
```

(Giữ nguyên `createTrip`/`CreateTripInput` ở task này — sẽ gỡ ở Task 2.)

- [ ] **Step 3: Thêm `groupByCategory` vào `src/services/budget.service.ts`**

Sửa dòng import type hiện tại để thêm value `CATEGORY_IDS`. File đang có:

```ts
import type { CategoryId, Trip, TripItem } from '@/types/trip'
```

Thêm ngay dưới nó:

```ts
import { CATEGORY_IDS } from '@/types/trip'
```

Thêm interface + hàm vào cuối file:

```ts
export interface CategoryGroup {
  categoryId: CategoryId
  items: TripItem[]
  plannedTotal: number
  actualTotal: number
}

export function groupByCategory(items: TripItem[]): CategoryGroup[] {
  return CATEGORY_IDS.map((categoryId) => {
    const categoryItems = items
      .filter((item) => item.category === categoryId)
      .sort(
        (a, b) =>
          a.dayNumber - b.dayNumber || a.time.localeCompare(b.time) || a.sortOrder - b.sortOrder,
      )
    return {
      categoryId,
      items: categoryItems,
      plannedTotal: categoryItems.reduce((sum, item) => sum + item.plannedAmount, 0),
      actualTotal: categoryItems.reduce((sum, item) => sum + (item.actualAmount ?? 0), 0),
    }
  }).filter((group) => group.items.length > 0)
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: PASS, không lỗi tsc.

- [ ] **Step 5: Verify lint**

Run: `npm run lint`
Expected: PASS (không error).

---

### Task 2: Single-trip flow — store rewrite, NameGate, AppShell greeting, Settings cleanup

Đây là task "switchover" cốt lõi — store và các consumer phụ thuộc nhau nên đổi cùng lúc để build không gãy giữa chừng.

**Files:**
- Create: `src/components/NameGate.tsx`
- Modify: `src/store/trip-store.tsx` (rewrite)
- Modify: `src/components/layout/AppShell.tsx` (lời chào)
- Modify: `src/pages/SettingsPage.tsx` (rewrite: bỏ sync/backup, thêm card Người dùng)
- Modify: `src/repositories/trip.repository.ts` (gỡ `createTrip` + `CreateTripInput`)
- Modify: `src/repositories/item.repository.ts` (gỡ `insertItems` — hết call site)
- Modify: `package.json` (gỡ dependency `qrcode.react`)
- Delete: `src/data/mock.ts`
- Delete: `src/components/Onboarding.tsx`

**Interfaces:**
- Consumes: `ensureTrip()` (Task 1), `COTO_TRIP_ID`, `USERNAME_STORAGE_KEY` (Task 1).
- Produces (store API mới qua `useTripStore()`):
  - `trip: Trip`, `items: TripItem[]`, `username: string`
  - `updateTrip(patch: Partial<Trip>): void`
  - `upsertItem(item: TripItem): void`
  - `deleteItem(id: string): void`
  - `addDay(): void`
  - `updateUsername(name: string): void`
  - Vẫn export `interface TripData { trip: Trip; items: TripItem[] }` và `TripProvider`, `useTripStore`.
- `NameGate` props: `{ onSubmit: (name: string) => void }`.

- [ ] **Step 1: Tạo `src/components/NameGate.tsx`**

```tsx
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { FIELD_CLASS, FIELD_LABEL_CLASS } from '@/components/ui/field'
import { cn } from '@/lib/cn'

interface NameGateProps {
  onSubmit: (name: string) => void
}

export function NameGate({ onSubmit }: NameGateProps) {
  const [name, setName] = useState('')

  function handleSubmit() {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Hãy nhập tên của bạn')
      return
    }
    onSubmit(trimmed)
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
          <div>
            <label htmlFor="name-gate" className={FIELD_LABEL_CLASS}>
              Tên của bạn
            </label>
            <input
              id="name-gate"
              value={name}
              placeholder="VD: An"
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSubmit()
              }}
              className={cn(FIELD_CLASS, 'h-11')}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full">
            Bắt đầu
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `src/store/trip-store.tsx`**

Thay toàn bộ nội dung file bằng:

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { NameGate } from '@/components/NameGate'
import { Button } from '@/components/ui/Button'
import { COTO_TRIP_ID, USERNAME_STORAGE_KEY } from '@/constants/trip'
import { SupabaseError } from '@/lib/errors'
import * as itemRepo from '@/repositories/item.repository'
import * as tripRepo from '@/repositories/trip.repository'
import type { Trip, TripItem } from '@/types/trip'

export interface TripData {
  trip: Trip
  items: TripItem[]
}

interface TripStore {
  trip: Trip
  items: TripItem[]
  username: string
  updateTrip: (patch: Partial<Trip>) => void
  upsertItem: (item: TripItem) => void
  deleteItem: (id: string) => void
  addDay: () => void
  updateUsername: (name: string) => void
}

type Status = 'naming' | 'loading' | 'ready' | 'error'

const TripContext = createContext<TripStore | null>(null)

function readUsername(): string | null {
  return localStorage.getItem(USERNAME_STORAGE_KEY)
}

export function TripProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(() => readUsername())
  const [data, setData] = useState<TripData | null>(null)
  const [status, setStatus] = useState<Status>(() => (readUsername() ? 'loading' : 'naming'))

  const loadTrip = useCallback(async () => {
    setStatus('loading')
    try {
      const trip = await tripRepo.ensureTrip()
      const items = await itemRepo.fetchItems(trip.id)
      setData({ trip, items })
      setStatus('ready')
    } catch (error) {
      console.error(error)
      setStatus('error')
      toast.error(error instanceof SupabaseError ? error.message : 'Lỗi kết nối Supabase')
    }
  }, [])

  const reload = useCallback(() => {
    void loadTrip()
  }, [loadTrip])

  useEffect(() => {
    if (readUsername()) void loadTrip()
  }, [loadTrip])

  const submitName = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      localStorage.setItem(USERNAME_STORAGE_KEY, trimmed)
      setUsername(trimmed)
      void loadTrip()
    },
    [loadTrip],
  )

  const updateUsername = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    localStorage.setItem(USERNAME_STORAGE_KEY, trimmed)
    setUsername(trimmed)
  }, [])

  const updateTrip = useCallback(
    (patch: Partial<Trip>) => {
      setData((prev) => (prev ? { ...prev, trip: { ...prev.trip, ...patch } } : prev))
      tripRepo.updateTrip(COTO_TRIP_ID, patch).catch((error) => {
        console.error(error)
        toast.error('Không lưu được thay đổi chuyến đi')
        reload()
      })
    },
    [reload],
  )

  const upsertItem = useCallback(
    (item: TripItem) => {
      setData((prev) => {
        if (!prev) return prev
        const exists = prev.items.some((current) => current.id === item.id)
        const items = exists
          ? prev.items.map((current) => (current.id === item.id ? item : current))
          : [...prev.items, item]
        return { ...prev, items }
      })
      itemRepo.upsertItem(COTO_TRIP_ID, item).catch((error) => {
        console.error(error)
        toast.error('Không lưu được hoạt động')
        reload()
      })
    },
    [reload],
  )

  const deleteItem = useCallback(
    (id: string) => {
      setData((prev) => (prev ? { ...prev, items: prev.items.filter((item) => item.id !== id) } : prev))
      itemRepo.deleteItem(id).catch((error) => {
        console.error(error)
        toast.error('Không xóa được hoạt động')
        reload()
      })
    },
    [reload],
  )

  const addDay = useCallback(() => {
    if (!data) return
    updateTrip({ dayCount: data.trip.dayCount + 1 })
  }, [data, updateTrip])

  const value = useMemo<TripStore | null>(() => {
    if (status !== 'ready' || !data || !username) return null
    return {
      trip: data.trip,
      items: data.items,
      username,
      updateTrip,
      upsertItem,
      deleteItem,
      addDay,
      updateUsername,
    }
  }, [status, data, username, updateTrip, upsertItem, deleteItem, addDay, updateUsername])

  if (status === 'naming') return <NameGate onSubmit={submitName} />
  if (status === 'loading') return <LoadingScreen />
  if (status === 'error') return <ErrorScreen onRetry={reload} />
  if (!value) return <LoadingScreen />
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>
}

export function useTripStore(): TripStore {
  const store = useContext(TripContext)
  if (!store) throw new Error('useTripStore must be used within a TripProvider')
  return store
}

function LoadingScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 text-ink-soft">
      <div className="size-10 animate-spin rounded-full border-[3px] border-line border-t-ocean" />
      <p className="text-sm">Đang tải chuyến đi…</p>
    </div>
  )
}

interface ErrorScreenProps {
  onRetry: () => void
}

function ErrorScreen({ onRetry }: ErrorScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <div>
        <h1 className="font-display text-2xl text-ink">Không kết nối được dữ liệu</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-soft">Kiểm tra kết nối mạng rồi thử lại.</p>
      </div>
      <Button onClick={onRetry}>Thử lại</Button>
    </div>
  )
}
```

- [ ] **Step 3: Cập nhật `src/components/layout/AppShell.tsx` (lời chào)**

Thêm import:

```tsx
import { useTripStore } from '@/store/trip-store'
```

Trong `AppShell`, lấy `username` ở đầu hàm và thay khối `<header>` hiện tại:

```tsx
export function AppShell() {
  const { username } = useTripStore()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-sand/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2.5 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <img src="/app-icon.svg" alt="" className="size-8 rounded-lg shadow-sm" />
            <span className="font-display text-lg font-semibold text-ocean">Trip Budget</span>
          </div>
          <span className="truncate text-sm text-ink-soft">
            Chào, <span className="font-medium text-ink">{username}</span>
          </span>
        </div>
      </header>
```

Giữ nguyên phần `<main>` và `<nav>` phía dưới.

- [ ] **Step 4: Rewrite `src/pages/SettingsPage.tsx`**

Thay toàn bộ nội dung file bằng:

```tsx
import { useState } from 'react'
import type { ReactNode } from 'react'
import { AmountInput } from '@/components/ui/AmountInput'
import { FIELD_CLASS, FIELD_LABEL_CLASS } from '@/components/ui/field'
import { CATEGORY_LIST } from '@/constants/categories'
import { cn } from '@/lib/cn'
import { useTripStore } from '@/store/trip-store'

export function SettingsPage() {
  const { trip, username, updateTrip, updateUsername } = useTripStore()
  const [nameDraft, setNameDraft] = useState(username)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl text-ink">Cài đặt</h2>
        <p className="mt-1 text-sm text-ink-faint">Thông tin chuyến đi và tài khoản của bạn.</p>
      </div>

      <SettingCard title="Người dùng">
        <div>
          <label htmlFor="username" className={FIELD_LABEL_CLASS}>
            Tên của bạn
          </label>
          <input
            id="username"
            value={nameDraft}
            onChange={(event) => {
              setNameDraft(event.target.value)
              updateUsername(event.target.value)
            }}
            onBlur={() => {
              if (!nameDraft.trim()) setNameDraft(username)
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
```

- [ ] **Step 5: Gỡ `createTrip` + `CreateTripInput` khỏi `src/repositories/trip.repository.ts`**

Xóa nguyên `export interface CreateTripInput { ... }` và nguyên hàm `export async function createTrip(...) { ... }`. Giữ lại `TripRow`, `toTrip`, `fetchTrip`, `ensureTrip`, `updateTrip`.

- [ ] **Step 6: Gỡ `insertItems` khỏi `src/repositories/item.repository.ts`**

Xóa nguyên hàm `export async function insertItems(...) { ... }`. Giữ `fetchItems`, `upsertItem`, `deleteItem` và các helper `toItem`/`toRow`.

- [ ] **Step 7: Xóa file không còn dùng**

Run:
```bash
rm src/data/mock.ts src/components/Onboarding.tsx
```

- [ ] **Step 8: Gỡ dependency `qrcode.react`**

Run:
```bash
npm uninstall qrcode.react
```
Expected: `package.json` không còn `qrcode.react`; `package-lock.json` cập nhật.

- [ ] **Step 9: Verify build**

Run: `npm run build`
Expected: PASS. (Nếu báo lỗi "Cannot find module" ở đâu đó → còn sót import của file đã xóa; sửa rồi chạy lại.)

- [ ] **Step 10: Verify lint**

Run: `npm run lint`
Expected: PASS (không error).

---

### Task 3: Lịch trình 3 view

**Files:**
- Create: `src/components/plan/ViewSwitcher.tsx`
- Create: `src/components/plan/TimelineView.tsx`
- Create: `src/components/plan/SpendingView.tsx`
- Create: `src/components/plan/ActivitiesView.tsx`
- Modify: `src/pages/PlanPage.tsx` (rewrite host)
- Delete: `src/components/plan/DayGroup.tsx`
- Delete: `src/components/plan/ItemRow.tsx`

**Interfaces:**
- Consumes: `groupByDay`, `groupByCategory`, `computeSummary` (`@/services/budget.service`); `useTripStore()` API (Task 2); `ItemModal`, `SummaryHeader`, `CategoryBadge`, `StatusBadge`, `ProgressBar`, `Button`.
- Produces:
  - `type PlanView = 'timeline' | 'spending' | 'activities'` + `ViewSwitcher` props `{ value: PlanView; onChange: (view: PlanView) => void; className?: string }` (từ `@/components/plan/ViewSwitcher`)
  - `TimelineView` props `{ trip: Trip; items: TripItem[]; onSelect: (item: TripItem) => void; onAdd: (dayNumber: number) => void; onAddDay: () => void }`
  - `SpendingView` props `{ trip: Trip; items: TripItem[]; onSelect: (item: TripItem) => void }`
  - `ActivitiesView` props `{ items: TripItem[]; onSelect: (item: TripItem) => void }`

- [ ] **Step 1: Tạo `src/components/plan/ViewSwitcher.tsx`**

```tsx
import { Clock, Coins, ListTodo } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export type PlanView = 'timeline' | 'spending' | 'activities'

interface ViewOption {
  value: PlanView
  label: string
  icon: LucideIcon
}

const VIEW_OPTIONS: readonly ViewOption[] = [
  { value: 'timeline', label: 'Thời gian', icon: Clock },
  { value: 'spending', label: 'Chi tiêu', icon: Coins },
  { value: 'activities', label: 'Hoạt động', icon: ListTodo },
]

interface ViewSwitcherProps {
  value: PlanView
  onChange: (view: PlanView) => void
  className?: string
}

export function ViewSwitcher({ value, onChange, className }: ViewSwitcherProps) {
  return (
    <div className={cn('flex gap-1 rounded-full border border-line bg-surface p-1 shadow-card', className)}>
      {VIEW_OPTIONS.map((option) => {
        const Icon = option.icon
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition',
              isActive ? 'bg-ocean text-paper shadow-sm' : 'text-ink-soft hover:bg-ink/5',
            )}
          >
            <Icon className="size-4" />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Tạo `src/components/plan/TimelineView.tsx`**

```tsx
import { CalendarPlus, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { CategoryBadge } from '@/components/CategoryBadge'
import { StatusBadge } from '@/components/StatusBadge'
import { formatVnd } from '@/lib/format'
import { groupByDay } from '@/services/budget.service'
import type { Trip, TripItem } from '@/types/trip'

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })

interface TimelineViewProps {
  trip: Trip
  items: TripItem[]
  onSelect: (item: TripItem) => void
  onAdd: (dayNumber: number) => void
  onAddDay: () => void
}

export function TimelineView({ trip, items, onSelect, onAdd, onAddDay }: TimelineViewProps) {
  const groups = useMemo(() => groupByDay(items, trip.dayCount), [items, trip.dayCount])

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const dateLabel = formatDayDate(trip.startDate, group.dayNumber)
        return (
          <section key={group.dayNumber} className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
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

            <div className="p-3 sm:p-4">
              {group.items.length === 0 ? (
                <p className="py-5 text-center text-sm text-ink-faint">Chưa có hoạt động nào trong ngày này.</p>
              ) : (
                <ol className="space-y-3 border-l-2 border-line pl-5">
                  {group.items.map((item) => (
                    <li key={item.id} className="relative">
                      <span className="absolute -left-[1.6rem] top-2 size-3 rounded-full border-2 border-surface bg-ocean" />
                      <button
                        type="button"
                        onClick={() => onSelect(item)}
                        className="w-full rounded-2xl border border-transparent bg-paper/50 px-3.5 py-3 text-left transition hover:border-line hover:bg-paper"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="tnum font-display text-[0.95rem] text-ink-soft">{item.time}</span>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="mt-1 font-medium text-ink">{item.activity}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <CategoryBadge category={item.category} size="sm" />
                          {item.note && <span className="text-xs text-ink-faint">{item.note}</span>}
                        </div>
                        <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-2 text-sm">
                          <span className="text-ink-faint">
                            Dự kiến <span className="tnum font-medium text-ink-soft">{formatVnd(item.plannedAmount)}</span>
                          </span>
                          <span className="text-ink-faint">
                            Thực tế{' '}
                            <span className={`tnum font-semibold ${item.actualAmount === null ? 'text-ink-faint' : 'text-sage'}`}>
                              {item.actualAmount === null ? '—' : formatVnd(item.actualAmount)}
                            </span>
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ol>
              )}

              <button
                type="button"
                onClick={() => onAdd(group.dayNumber)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong py-2.5 text-sm font-medium text-ink-soft transition hover:border-ocean/50 hover:text-ocean"
              >
                <Plus className="size-4" />
                Thêm hoạt động
              </button>
            </div>
          </section>
        )
      })}

      <button
        type="button"
        onClick={onAddDay}
        className="flex w-full items-center justify-center gap-2 rounded-card border border-dashed border-line-strong py-3 text-sm font-medium text-ink-soft transition hover:border-ocean/50 hover:text-ocean"
      >
        <CalendarPlus className="size-4" />
        Thêm ngày
      </button>
    </div>
  )
}

function formatDayDate(startDate: string | null, dayNumber: number): string | null {
  if (!startDate) return null
  const base = new Date(startDate)
  if (Number.isNaN(base.getTime())) return null
  base.setDate(base.getDate() + (dayNumber - 1))
  return WEEKDAY_FORMATTER.format(base)
}
```

- [ ] **Step 3: Tạo `src/components/plan/SpendingView.tsx`**

```tsx
import { useMemo } from 'react'
import { CategoryBadge } from '@/components/CategoryBadge'
import { StatusBadge } from '@/components/StatusBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatVnd } from '@/lib/format'
import { groupByDay } from '@/services/budget.service'
import type { Trip, TripItem } from '@/types/trip'

interface SpendingViewProps {
  trip: Trip
  items: TripItem[]
  onSelect: (item: TripItem) => void
}

export function SpendingView({ trip, items, onSelect }: SpendingViewProps) {
  const groups = useMemo(() => groupByDay(items, trip.dayCount), [items, trip.dayCount])

  if (items.length === 0) {
    return (
      <div className="rounded-card border border-line bg-surface p-5 shadow-card">
        <p className="py-8 text-center text-sm text-ink-faint">Chưa có khoản chi nào. Thêm hoạt động để theo dõi chi tiêu.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const ratio = group.plannedTotal > 0 ? group.actualTotal / group.plannedTotal : 0
        const isOver = group.plannedTotal > 0 && group.actualTotal > group.plannedTotal
        return (
          <section key={group.dayNumber} className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
            <header className="border-b border-line bg-paper/60 px-4 py-3.5 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-lg text-ink">Ngày {group.dayNumber}</p>
                <div className="text-right text-xs text-ink-faint">
                  <p>
                    Thực tế <span className="tnum font-semibold text-sage">{formatVnd(group.actualTotal)}</span>
                  </p>
                  <p className="mt-0.5">
                    Dự kiến <span className="tnum text-ink-soft">{formatVnd(group.plannedTotal)}</span>
                  </p>
                </div>
              </div>
              <ProgressBar
                value={ratio}
                className="mt-3"
                fillClassName={isOver ? 'bg-coral' : 'bg-[#74c9a6]'}
                trackClassName="bg-ink/8"
              />
            </header>

            {group.items.length === 0 ? (
              <p className="px-4 py-5 text-center text-sm text-ink-faint">Không có khoản chi trong ngày này.</p>
            ) : (
              <ul className="divide-y divide-line/60 p-1.5 sm:p-2">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition hover:border-line hover:bg-paper sm:px-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{item.activity}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <CategoryBadge category={item.category} size="sm" />
                          <StatusBadge status={item.status} />
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-sm">
                        <p className={`tnum font-semibold ${item.actualAmount === null ? 'text-ink-faint' : 'text-sage'}`}>
                          {item.actualAmount === null ? '—' : formatVnd(item.actualAmount)}
                        </p>
                        <p className="tnum mt-0.5 text-xs text-ink-faint">DK {formatVnd(item.plannedAmount)}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Tạo `src/components/plan/ActivitiesView.tsx`**

```tsx
import { useMemo } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import { CATEGORIES } from '@/constants/categories'
import { formatVnd } from '@/lib/format'
import { groupByCategory } from '@/services/budget.service'
import type { TripItem } from '@/types/trip'

interface ActivitiesViewProps {
  items: TripItem[]
  onSelect: (item: TripItem) => void
}

export function ActivitiesView({ items, onSelect }: ActivitiesViewProps) {
  const groups = useMemo(() => groupByCategory(items), [items])

  if (groups.length === 0) {
    return (
      <div className="rounded-card border border-line bg-surface p-5 shadow-card">
        <p className="py-8 text-center text-sm text-ink-faint">Chưa có hoạt động nào. Thêm hoạt động để bắt đầu.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const meta = CATEGORIES[group.categoryId]
        const Icon = meta.icon
        return (
          <section key={group.categoryId} className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
            <header className="flex items-center justify-between gap-3 border-b border-line bg-paper/60 px-4 py-3.5 sm:px-5">
              <span className="flex items-center gap-2 font-display text-lg" style={{ color: meta.color }}>
                <Icon className="size-5" />
                {meta.label}
              </span>
              <span className="tnum text-sm font-semibold text-ink-soft">{formatVnd(group.plannedTotal)}</span>
            </header>
            <ul className="divide-y divide-line/60 p-1.5 sm:p-2">
              {group.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition hover:border-line hover:bg-paper sm:px-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{item.activity}</p>
                      <p className="mt-1 text-xs text-ink-faint">
                        Ngày {item.dayNumber} · {item.time}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 5: Rewrite `src/pages/PlanPage.tsx`**

Thay toàn bộ nội dung file bằng:

```tsx
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
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
  const { trip, items, upsertItem, deleteItem, addDay } = useTripStore()
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
      <SummaryHeader trip={trip} summary={summary} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ViewSwitcher value={view} onChange={setView} className="w-full sm:flex-1" />
        <Button onClick={() => openCreate(1)} className="shrink-0">
          <Plus className="size-4" />
          Thêm hoạt động
        </Button>
      </div>

      {view === 'timeline' && (
        <TimelineView trip={trip} items={items} onSelect={openEdit} onAdd={openCreate} onAddDay={addDay} />
      )}
      {view === 'spending' && <SpendingView trip={trip} items={items} onSelect={openEdit} />}
      {view === 'activities' && <ActivitiesView items={items} onSelect={openEdit} />}

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
```

- [ ] **Step 6: Xóa view bảng cũ**

Run:
```bash
rm src/components/plan/DayGroup.tsx src/components/plan/ItemRow.tsx
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 8: Verify lint**

Run: `npm run lint`
Expected: PASS (không error).

---

### Task 4: Thống kê — thêm bảng chi tiết

**Files:**
- Create: `src/components/stats/StatsTable.tsx`
- Modify: `src/pages/StatsPage.tsx` (thêm section bảng, giữ biểu đồ)

**Interfaces:**
- Consumes: `groupByDay` (`@/services/budget.service`); `CategoryBadge`, `StatusBadge`; `formatVnd`.
- Produces: `StatsTable` props `{ trip: Trip; items: TripItem[] }`.

- [ ] **Step 1: Tạo `src/components/stats/StatsTable.tsx`**

```tsx
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
  const plannedTotal = items.reduce((sum, item) => sum + item.plannedAmount, 0)
  const actualTotal = items.reduce((sum, item) => sum + (item.actualAmount ?? 0), 0)

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
```

- [ ] **Step 2: Thêm bảng vào `src/pages/StatsPage.tsx`**

Thêm import (cùng cụm import component):

```tsx
import { StatsTable } from '@/components/stats/StatsTable'
```

Thêm dòng tính `hasItems` ngay dưới dòng `const hasData = plannedTotal > 0`:

```tsx
const hasItems = items.length > 0
```

Thêm section mới ngay **trước** thẻ đóng `</div>` cuối cùng của `return` (sau section "Dự kiến vs Thực tế theo ngày"):

```tsx
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
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Verify lint**

Run: `npm run lint`
Expected: PASS (không error).

- [ ] **Step 5: Kiểm tra tay (manual)**

Run: `npm run dev`, mở app:
1. Xóa `localStorage` key `trip-budget:username` (DevTools) → reload → màn NameGate hiện → nhập tên → vào app.
2. Lịch trình rỗng; bấm "Thêm hoạt động" thêm vài mục ở các ngày khác nhau.
3. Chuyển 3 view Thời gian / Chi tiêu / Hoạt động — dữ liệu hiển thị đúng, bấm item mở modal sửa được.
4. Tab Thống kê: pie + bar + bảng "Chi tiết theo kế hoạch" có subtotal mỗi ngày và dòng Tổng.
5. Cài đặt: đổi tên ở card "Người dùng" → lời chào ở header đổi theo; không còn card Đồng bộ/Sao lưu.

---

## Self-Review (đã thực hiện khi viết plan)

**Spec coverage:**
- Fixed-ID single trip → Task 1 (`ensureTrip`, constants) + Task 2 (store dùng `COTO_TRIP_ID`, bỏ create/seed/switch).
- Username + NameGate + lời chào header + sửa ở Settings → Task 2.
- Lịch trình 3 view (Thời gian/Chi tiêu/Hoạt động) → Task 3.
- Thống kê giữ biểu đồ + thêm bảng → Task 4.
- Bỏ Đồng bộ & Sao lưu ở Settings, gỡ `qrcode.react` → Task 2.
- `groupByCategory` helper → Task 1.
- Xóa `mock.ts`, `Onboarding`, `DayGroup`, `ItemRow`, `createTrip`/`insertItems` → Task 2 & 3.

**Type consistency:** `PlanView` định nghĩa ở ViewSwitcher, import ở PlanPage. Store API (`username`, `updateUsername`) khai báo ở Task 2, dùng ở AppShell/Settings. Props view khớp lời gọi trong PlanPage. `ensureTrip(): Promise<Trip>` dùng trong store. `groupByCategory` trả `CategoryGroup[]` dùng ở ActivitiesView.

**Placeholder scan:** Không có TBD/TODO; mọi step có code/command cụ thể.
