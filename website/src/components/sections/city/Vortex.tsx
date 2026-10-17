import Link from 'next/link'
import { POSTERS, type City, type PosterDef } from '@/constants'
import { StoreBadges } from '@/components/ui/atoms'
import { Poster } from '@/components/ui/Poster'

// Rings from the centre out: radius, how many flyers, flyer size, seconds per turn.
const RINGS = [
  { r: 200, n: 14, size: 30, speed: 90 },
  { r: 320, n: 18, size: 54, speed: 110 },
  { r: 470, n: 22, size: 86, speed: 130 },
  { r: 650, n: 26, size: 124, speed: 150 },
  { r: 860, n: 30, size: 168, speed: 170 },
]

/**
 * Chapter 11, see you out there. Rings of flyers rotate slowly
 * counter-clockwise around the call to action, smaller towards the centre.
 */
export function Vortex({ city, chapter = '11', posters = POSTERS.filter(p => p.kind === 'template') }: { city: City; chapter?: string; posters?: PosterDef[] }) {
  return (
    <section className="relative h-[920px] overflow-hidden bg-paper">
      <div className="absolute left-1/2 top-1/2" aria-hidden>
        {RINGS.map((ring, ri) => (
          <div key={ri} className="absolute left-0 top-0" style={{ animation: `spin-ccw ${ring.speed}s linear infinite` }}>
            {Array.from({ length: ring.n }, (_, k) => {
              const angle = (k / ring.n) * 360 + ri * 11
              const poster = posters[(k * 3 + ri * 5) % posters.length]
              return (
                <div
                  key={k}
                  className="absolute left-0 top-0"
                  style={{ transform: `rotate(${angle}deg) translateX(${ring.r}px) rotate(${90 + ((k * 13) % 30) - 15}deg) translate(-50%, -50%)` }}
                >
                  <div className="transition-transform duration-500 hover:scale-125">
                    <Poster poster={poster} area={city.areas[k % city.areas.length]} width={ring.size} height={ring.size} radius={Math.max(4, ring.size * 0.08)} />
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center px-6 text-center [&_a]:pointer-events-auto">
        <div className="mb-5 font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3">
          <span className="font-serif text-xl normal-case italic tracking-normal text-orange">{chapter}</span> · See you out there
        </div>
        <Link
          href="/app"
          className="rounded-full bg-ink px-14 py-8 font-display text-[clamp(40px,5vw,72px)] font-extrabold uppercase leading-none tracking-[-0.04em] text-cream shadow-pop transition-transform duration-500 hover:scale-105"
        >
          Get the app
        </Link>
        <p className="mt-6 font-sans text-xl text-ink-2">Your social life in {city.name} will thank you.</p>
        <div className="mt-6"><StoreBadges /></div>
      </div>
    </section>
  )
}
