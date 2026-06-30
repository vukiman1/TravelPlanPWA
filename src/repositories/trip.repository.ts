import { supabase } from '@/lib/supabase'
import { SupabaseError } from '@/lib/errors'
import type { Trip } from '@/types/trip'
import { COTO_TRIP_ID, COTO_TRIP_NAME, DEFAULT_DAY_COUNT } from '@/constants/trip'

interface TripRow {
  id: string
  name: string
  total_budget: number
  day_count: number
  start_date: string | null
  currency: string
  created_at: string
}

function toTrip(row: TripRow): Trip {
  return {
    id: row.id,
    name: row.name,
    totalBudget: Number(row.total_budget),
    dayCount: row.day_count,
    startDate: row.start_date,
    currency: 'VND',
  }
}

export async function fetchTrip(id: string): Promise<Trip | null> {
  const { data, error } = await supabase.from('trips').select('*').eq('id', id).maybeSingle()
  if (error) throw new SupabaseError('Không tải được chuyến đi', error)
  return data ? toTrip(data as TripRow) : null
}

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

export async function updateTrip(id: string, patch: Partial<Trip>): Promise<void> {
  const row: Record<string, unknown> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.totalBudget !== undefined) row.total_budget = patch.totalBudget
  if (patch.dayCount !== undefined) row.day_count = patch.dayCount
  if (patch.startDate !== undefined) row.start_date = patch.startDate
  if (Object.keys(row).length === 0) return

  const { error } = await supabase.from('trips').update(row).eq('id', id)
  if (error) throw new SupabaseError('Không cập nhật được chuyến đi', error)
}
