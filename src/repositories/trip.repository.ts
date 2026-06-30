import { supabase } from '@/lib/supabase'
import { SupabaseError } from '@/lib/errors'
import type { Trip } from '@/types/trip'

interface TripRow {
  id: string
  name: string
  total_budget: number
  day_count: number
  start_date: string | null
  currency: string
  created_at: string
}

export interface CreateTripInput {
  name: string
  totalBudget: number
  dayCount: number
  startDate: string | null
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

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .insert({
      name: input.name,
      total_budget: input.totalBudget,
      day_count: input.dayCount,
      start_date: input.startDate,
    })
    .select('*')
    .single()
  if (error) throw new SupabaseError('Không tạo được chuyến đi', error)
  return toTrip(data as TripRow)
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
