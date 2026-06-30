import type { CategoryId, Trip, TripItem } from '@/types/trip'

const NEAR_LIMIT_RATIO = 0.8

export interface BudgetSummary {
  totalBudget: number
  actualSpent: number
  plannedTotal: number
  remaining: number
  percentUsed: number
  isOverBudget: boolean
  isNearLimit: boolean
}

export interface DayGroup {
  dayNumber: number
  items: TripItem[]
  plannedTotal: number
  actualTotal: number
}

export interface CategoryTotal {
  categoryId: CategoryId
  planned: number
  actual: number
}

export interface DayTotal {
  dayNumber: number
  planned: number
  actual: number
}

export function computeSummary(trip: Trip, items: TripItem[]): BudgetSummary {
  const actualSpent = items.reduce((sum, item) => sum + (item.actualAmount ?? 0), 0)
  const plannedTotal = items.reduce((sum, item) => sum + item.plannedAmount, 0)
  const remaining = trip.totalBudget - actualSpent
  const percentUsed = trip.totalBudget > 0 ? actualSpent / trip.totalBudget : 0

  return {
    totalBudget: trip.totalBudget,
    actualSpent,
    plannedTotal,
    remaining,
    percentUsed,
    isOverBudget: remaining < 0,
    isNearLimit: percentUsed >= NEAR_LIMIT_RATIO,
  }
}

export function groupByDay(items: TripItem[], dayCount: number): DayGroup[] {
  const maxDay = items.reduce((max, item) => Math.max(max, item.dayNumber), 0)
  const totalDays = Math.max(dayCount, maxDay)

  return Array.from({ length: totalDays }, (_, index) => {
    const dayNumber = index + 1
    const dayItems = items
      .filter((item) => item.dayNumber === dayNumber)
      .sort((a, b) => a.time.localeCompare(b.time) || a.sortOrder - b.sortOrder)

    return {
      dayNumber,
      items: dayItems,
      plannedTotal: dayItems.reduce((sum, item) => sum + item.plannedAmount, 0),
      actualTotal: dayItems.reduce((sum, item) => sum + (item.actualAmount ?? 0), 0),
    }
  })
}

export function totalsByCategory(items: TripItem[]): CategoryTotal[] {
  const map = new Map<CategoryId, CategoryTotal>()
  for (const item of items) {
    const current = map.get(item.category) ?? { categoryId: item.category, planned: 0, actual: 0 }
    current.planned += item.plannedAmount
    current.actual += item.actualAmount ?? 0
    map.set(item.category, current)
  }
  return [...map.values()].filter((entry) => entry.planned > 0 || entry.actual > 0)
}

export function totalsByDay(items: TripItem[], dayCount: number): DayTotal[] {
  return groupByDay(items, dayCount).map((group) => ({
    dayNumber: group.dayNumber,
    planned: group.plannedTotal,
    actual: group.actualTotal,
  }))
}
