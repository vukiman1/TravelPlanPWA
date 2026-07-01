import * as Dialog from '@radix-ui/react-dialog'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { APP_NAME } from '@/constants/app'
import { NAV_ITEMS } from '@/constants/navigation'
import { cn } from '@/lib/cn'

export function NavDrawer() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Mở điều hướng"
        className="hidden size-9 items-center justify-center rounded-lg text-ink-soft transition hover:bg-ink/5 hover:text-ink landscape-phone:inline-flex"
      >
        <Menu className="size-6" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ocean-deep/45 backdrop-blur-sm data-[state=open]:animate-[fade_.15s_ease-out] data-[state=closed]:animate-[fade-out_.15s_ease-in]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-0 top-0 z-50 flex h-dvh w-64 max-w-[80vw] flex-col border-r border-line bg-surface p-4 shadow-float data-[state=open]:animate-[slide-in-left_.2s_ease-out] data-[state=closed]:animate-[slide-out-left_.18s_ease-in]"
        >
          <Dialog.Title className="px-2 font-display text-lg font-semibold text-ocean">{APP_NAME}</Dialog.Title>
          <nav className="mt-4 flex flex-col gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>
                {({ isActive }) => (
                  <span
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive ? 'bg-ocean/12 text-ocean' : 'text-ink-soft active:bg-line/50',
                    )}
                  >
                    <Icon className="size-5" />
                    {label}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
