import { ListChecks, PieChart, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Kế hoạch', icon: ListChecks },
  { to: '/stats', label: 'Thống kê', icon: PieChart },
  { to: '/settings', label: 'Cài đặt', icon: Settings },
]
