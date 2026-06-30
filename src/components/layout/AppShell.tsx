import { ListChecks, PieChart, Settings } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/cn'

const NAV_ITEMS = [
  { to: '/', label: 'Kế hoạch', icon: ListChecks },
  { to: '/stats', label: 'Thống kê', icon: PieChart },
  { to: '/settings', label: 'Cài đặt', icon: Settings },
] as const

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-sand/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-3">
          <img src="/app-icon.svg" alt="" className="size-8 rounded-lg shadow-sm" />
          <span className="font-display text-lg font-semibold text-ocean">Trip Budget</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5">
        <Outlet />
      </main>

      <nav className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
        <div className="flex gap-1 rounded-full border border-line bg-surface/90 p-1.5 shadow-float backdrop-blur-md">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition',
                  isActive ? 'bg-ocean text-paper shadow-sm' : 'text-ink-soft hover:bg-ink/5',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
