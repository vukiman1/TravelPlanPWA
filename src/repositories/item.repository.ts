import { supabase } from '@/lib/supabase'
import { SupabaseError } from '@/lib/errors'
import type { CategoryId, PaymentStatus, TripItem } from '@/types/trip'

interface ItemRow {
  id: string
  trip_id: string
  day_number: number
  time: string
  activity: string
  category: string
  planned_amount: number
  actual_amount: number | null
  status: string
  note: string
  sort_order: number
  created_at: string
}

function toItem(row: ItemRow): TripItem {
  return {
    id: row.id,
    dayNumber: row.day_number,
    time: row.time,
    activity: row.activity,
    category: row.category as CategoryId,
    plannedAmount: Number(row.planned_amount),
    actualAmount: row.actual_amount === null ? null : Number(row.actual_amount),
    status: row.status as PaymentStatus,
    note: row.note,
    sortOrder: Number(row.sort_order),
  }
}

function toRow(tripId: string, item: TripItem): Omit<ItemRow, 'created_at'> {
  return {
    id: item.id,
    trip_id: tripId,
    day_number: item.dayNumber,
    time: item.time,
    activity: item.activity,
    category: item.category,
    planned_amount: item.plannedAmount,
    actual_amount: item.actualAmount,
    status: item.status,
    note: item.note,
    sort_order: item.sortOrder,
  }
}

export async function fetchItems(tripId: string): Promise<TripItem[]> {
  const { data, error } = await supabase.from('items').select('*').eq('trip_id', tripId)
  if (error) throw new SupabaseError('Không tải được danh sách hoạt động', error)
  return (data as ItemRow[]).map(toItem)
}

export async function upsertItem(tripId: string, item: TripItem): Promise<void> {
  const { error } = await supabase.from('items').upsert(toRow(tripId, item))
  if (error) throw new SupabaseError('Không lưu được hoạt động', error)
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) throw new SupabaseError('Không xóa được hoạt động', error)
}
