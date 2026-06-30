import { Check, Clock } from 'lucide-react'
import type { PaymentStatus } from '@/types/trip'
import { cn } from '@/lib/cn'

interface StatusBadgeProps {
  status: PaymentStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isPaid = status === 'paid'
  const Icon = isPaid ? Check : Clock

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        isPaid ? 'bg-sage/12 text-sage' : 'bg-coral/12 text-coral',
        className,
      )}
    >
      <Icon className="size-3.5" />
      {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
    </span>
  )
}
