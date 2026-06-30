export const CATEGORY_IDS = [
  'accommodation',
  'food',
  'transport',
  'entertainment',
  'shopping',
  'other',
] as const

export type CategoryId = (typeof CATEGORY_IDS)[number]

export type PaymentStatus = 'paid' | 'unpaid'

export interface TripItem {
  id: string
  dayNumber: number
  time: string
  activity: string
  category: CategoryId
  plannedAmount: number
  actualAmount: number | null
  status: PaymentStatus
  note: string
  sortOrder: number
}

export interface Trip {
  id: string
  name: string
  totalBudget: number
  dayCount: number
  startDate: string | null
  currency: 'VND'
}

export interface Couple {
  you: string
  partner: string
}
