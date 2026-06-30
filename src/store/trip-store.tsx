import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { COUPLE_STORAGE_KEY, DEFAULT_COUPLE } from '@/constants/app'
import { COTO_TRIP_ID } from '@/constants/trip'
import { SupabaseError } from '@/lib/errors'
import * as itemRepo from '@/repositories/item.repository'
import * as tripRepo from '@/repositories/trip.repository'
import type { Couple, Trip, TripItem } from '@/types/trip'

interface TripData {
  trip: Trip
  items: TripItem[]
}

interface TripStore {
  trip: Trip
  items: TripItem[]
  couple: Couple
  updateTrip: (patch: Partial<Trip>) => void
  upsertItem: (item: TripItem) => void
  deleteItem: (id: string) => void
  updateCouple: (next: Couple) => void
}

type Status = 'loading' | 'ready' | 'error'

const TripContext = createContext<TripStore | null>(null)

function readCouple(): Couple | null {
  const raw = localStorage.getItem(COUPLE_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<Couple>
    const you = parsed.you?.trim()
    const partner = parsed.partner?.trim()
    return you && partner ? { you, partner } : null
  } catch {
    return null
  }
}

export function TripProvider({ children }: { children: ReactNode }) {
  const [couple, setCouple] = useState<Couple>(() => readCouple() ?? DEFAULT_COUPLE)
  const [data, setData] = useState<TripData | null>(null)
  const [status, setStatus] = useState<Status>('loading')

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
    void loadTrip()
  }, [loadTrip])

  const updateCouple = useCallback((next: Couple) => {
    const you = next.you.trim()
    const partner = next.partner.trim()
    if (!you || !partner) return
    const value: Couple = { you, partner }
    localStorage.setItem(COUPLE_STORAGE_KEY, JSON.stringify(value))
    setCouple(value)
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

  const value = useMemo<TripStore | null>(() => {
    if (status !== 'ready' || !data) return null
    return {
      trip: data.trip,
      items: data.items,
      couple,
      updateTrip,
      upsertItem,
      deleteItem,
      updateCouple,
    }
  }, [status, data, couple, updateTrip, upsertItem, deleteItem, updateCouple])

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
