import { COVER_IMAGE_SRC } from '@/constants/app'
import type { Couple, Trip } from '@/types/trip'

interface CoverHeroProps {
  trip: Trip
  couple: Couple
}

export function CoverHero({ trip, couple }: CoverHeroProps) {
  const nights = Math.max(0, trip.dayCount - 1)

  return (
    <div className="relative overflow-hidden rounded-card shadow-card">
      <img src={COVER_IMAGE_SRC} alt="" className="h-44 w-full object-cover object-bottom sm:h-52" />
      <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep/75 via-ocean-deep/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-paper sm:p-5">
        <h1 className="font-display text-4xl font-semibold leading-none drop-shadow-sm sm:text-5xl">{trip.name}</h1>
        <p className="mt-2 text-sm text-paper/90">
          {couple.you} <span className="text-coral-soft">❤</span> {couple.partner} · {trip.dayCount} ngày {nights} đêm
        </p>
      </div>
    </div>
  )
}
