import { BedDouble, UtensilsCrossed, Bus, Ticket, ShoppingBag, Tag } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CategoryId } from '@/types/trip'
import { CATEGORY_IDS } from '@/types/trip'

export interface CategoryMeta {
  id: CategoryId
  label: string
  color: string
  icon: LucideIcon
}

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  accommodation: { id: 'accommodation', label: 'Lưu trú', color: '#0E4F4A', icon: BedDouble },
  food: { id: 'food', label: 'Ăn uống', color: '#DD6444', icon: UtensilsCrossed },
  transport: { id: 'transport', label: 'Di chuyển', color: '#E8A33D', icon: Bus },
  entertainment: { id: 'entertainment', label: 'Giải trí', color: '#2E7DA1', icon: Ticket },
  shopping: { id: 'shopping', label: 'Mua sắm', color: '#8B5A8F', icon: ShoppingBag },
  other: { id: 'other', label: 'Khác', color: '#9C927E', icon: Tag },
}

export const CATEGORY_LIST: readonly CategoryMeta[] = CATEGORY_IDS.map((id) => CATEGORIES[id])
