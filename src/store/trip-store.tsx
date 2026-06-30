import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Onboarding } from '@/components/Onboarding'
import { Button } from '@/components/ui/Button'
import { SupabaseError } from '@/lib/errors'
import { INITIAL_ITEMS, INITIAL_TRIP } from '@/data/mock'
import * as itemRepo from '@/repositories/item.repository'
import * as tripRepo from '@/repositories/trip.repository'
import type { CreateTripInput } from '@/repositories/trip.repository'
import type { Trip, TripItem } from '@/types/trip'

const ACTIVE_KEY = 'trip-budget:active-trip-id'

export interface TripData {
  trip: Trip
  items: TripItem[]
}

interface TripStore {
  trip: Trip
  items: TripItem[]
  updateTrip: (patch: Partial<Trip>) => void
  upsertItem: (item: TripItem) => void
  deleteItem: (id: string) => void
  addDay: () => void
  importData: (data: TripData) => Promise<void>
  resetToSample: () => Promise<void>
  switchTrip: () => void
}

type Status = 'loading' | 'onboarding' | 'ready' | 'error'

const TripContext = createContext<TripStore | null>(null)

export function TripProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(() => localStorage.getItem(ACTIVE_KEY))
  const [data, setData] = useState<TripData | null>(null)
  const [status, setStatus] = useState<Status>(() => (localStorage.getItem(ACTIVE_KEY) ? 'loading' : 'onboarding'))

  const persistActive = useCallback((id: string | null) => {
    if (id) localStorage.setItem(ACTIVE_KEY, id)
    else localStorage.removeItem(ACTIVE_KEY)
    setActiveId(id)
  }, [])

  const loadActive = useCallback(
    async (id: string) => {
      setStatus('loading')
      try {
        const trip = await tripRepo.fetchTrip(id)
        if (!trip) {
          toast.error('Không tìm thấy chuyến đi với mã này')
          persistActive(null)
          return
        }
        const items = await itemRepo.fetchItems(id)
        setData({ trip, items })
        setStatus('ready')
      } catch (error) {
        console.error(error)
        setStatus('error')
        toast.error(error instanceof SupabaseError ? error.message : 'Lỗi kết nối Supabase')
      }
    },
    [persistActive],
  )

  useEffect(() => {
    if (!activeId) {
      setStatus('onboarding')
      setData(null)
      return
    }
    void loadActive(activeId)
  }, [activeId, loadActive])

  const reload = useCallback(() => {
    if (activeId) void loadActive(activeId)
  }, [activeId, loadActive])

  const updateTrip = useCallback(
    (patch: Partial<Trip>) => {
      setData((prev) => (prev ? { ...prev, trip: { ...prev.trip, ...patch } } : prev))
      if (!activeId) return
      tripRepo.updateTrip(activeId, patch).catch((error) => {
        console.error(error)
        toast.error('Không lưu được thay đổi chuyến đi')
        reload()
      })
    },
    [activeId, reload],
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
      if (!activeId) return
      itemRepo.upsertItem(activeId, item).catch((error) => {
        console.error(error)
        toast.error('Không lưu được hoạt động')
        reload()
      })
    },
    [activeId, reload],
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

  const createAndOpen = useCallback(
    async (input: CreateTripInput) => {
      const trip = await tripRepo.createTrip(input)
      persistActive(trip.id)
    },
    [persistActive],
  )

  const createFromData = useCallback(
    async (source: TripData) => {
      const trip = await tripRepo.createTrip({
        name: source.trip.name,
        totalBudget: source.trip.totalBudget,
        dayCount: source.trip.dayCount,
        startDate: source.trip.startDate,
      })
      const items = source.items.map((item) => ({ ...item, id: crypto.randomUUID() }))
      await itemRepo.insertItems(trip.id, items)
      persistActive(trip.id)
    },
    [persistActive],
  )

  const openByCode = useCallback((code: string) => persistActive(code.trim()), [persistActive])

  const importData = useCallback((source: TripData) => createFromData(source), [createFromData])

  const resetToSample = useCallback(
    () => createFromData({ trip: INITIAL_TRIP, items: INITIAL_ITEMS }),
    [createFromData],
  )

  const switchTrip = useCallback(() => persistActive(null), [persistActive])

  const value = useMemo<TripStore | null>(() => {
    if (status !== 'ready' || !data) return null
    return {
      trip: data.trip,
      items: data.items,
      updateTrip,
      upsertItem,
      deleteItem,
      addDay,
      importData,
      resetToSample,
      switchTrip,
    }
  }, [status, data, updateTrip, upsertItem, deleteItem, addDay, importData, resetToSample, switchTrip])

  if (status === 'loading') return <LoadingScreen />
  if (status === 'error') return <ErrorScreen onRetry={reload} onSwitch={switchTrip} />
  if (status === 'onboarding' || !value) {
    return <Onboarding onCreate={createAndOpen} onOpen={openByCode} onSample={resetToSample} />
  }
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
  onSwitch: () => void
}

function ErrorScreen({ onRetry, onSwitch }: ErrorScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <div>
        <h1 className="font-display text-2xl text-ink">Không kết nối được dữ liệu</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-soft">
          Kiểm tra kết nối mạng rồi thử lại, hoặc mở một chuyến đi khác.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={onRetry}>Thử lại</Button>
        <Button variant="secondary" onClick={onSwitch}>
          Đổi chuyến đi
        </Button>
      </div>
    </div>
  )
}
