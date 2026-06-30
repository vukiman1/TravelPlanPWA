import { CATEGORIES } from '@/constants/categories'
import type { CategoryId } from '@/types/trip'
import { cn } from '@/lib/cn'

interface CategoryBadgeProps {
  category: CategoryId
  size?: 'sm' | 'md'
  className?: string
}

export function CategoryBadge({ category, size = 'md', className }: CategoryBadgeProps) {
  const meta = CATEGORIES[category]
  const Icon = meta.icon
  const isSmall = size === 'sm'

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-medium',
        isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-[0.8rem]',
        className,
      )}
      style={{ color: meta.color, backgroundColor: `${meta.color}1a` }}
    >
      <Icon className={isSmall ? 'size-3' : 'size-3.5'} />
      {meta.label}
    </span>
  )
}
