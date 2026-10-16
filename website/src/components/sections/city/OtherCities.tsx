import Link from 'next/link'
import { CITIES, type City } from '@/constants'

export function OtherCities({ current }: { current: City }) {
  const others = CITIES.filter(c => c.slug !== current.slug)
  return (
    <section className="bg-paper px-6 py-20 md:px-20">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-6 font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink-3">Also on Gorave</div>
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          {others.map(c => (
            <li key={c.slug}>
              <Link href={`/${c.slug}`} className="font-display text-[clamp(28px,3.4vw,44px)] font-extrabold tracking-[-0.04em] text-ink transition-colors hover:text-orange">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
