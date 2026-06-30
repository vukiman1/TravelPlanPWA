import { ListChecks, PieChart, Settings } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { APP_NAME } from '@/constants/app'
import { cn } from '@/lib/cn'
import { useTripStore } from '@/store/trip-store'

const NAV_ITEMS = [
  { to: '/', label: 'Kế hoạch', icon: ListChecks },
  { to: '/stats', label: 'Thống kê', icon: PieChart },
  { to: '/settings', label: 'Cài đặt', icon: Settings },
] as const

export function AppShell() {
  const { couple } = useTripStore()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-sand/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2.5 px-4 py-3">
          <div className="flex shrink-0 items-center gap-2.5">
            <img src="/app-icon.svg" alt="" className="size-8 rounded-lg shadow-sm" />
            <span className="font-display text-lg font-semibold text-ocean">{APP_NAME}</span>
          </div>
          <span className="min-w-0 truncate text-sm font-medium text-ink">
            {couple.you} <span className="text-coral">❤</span> {couple.partner}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-[calc(6rem_+_env(safe-area-inset-bottom))] pt-5">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-float backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-stretch">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="flex flex-1 flex-col items-center gap-1 px-1 pb-2 pt-2.5"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex items-center justify-center rounded-full px-5 py-1 transition-colors',
                      isActive ? 'bg-ocean/12' : 'bg-transparent',
                    )}
                  >
                    <Icon className={cn('size-6 transition-colors', isActive ? 'text-ocean' : 'text-ink-soft')} />
                  </span>
                  <span
                    className={cn(
                      'text-xs font-medium transition-colors',
                      isActive ? 'text-ocean' : 'text-ink-soft',
                    )}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
