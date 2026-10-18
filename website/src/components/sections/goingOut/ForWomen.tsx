import Link from 'next/link'
import { outGuideHref, questionOf, type OutGuide } from '@/lib/goingOut'
import { Chapter } from '@/components/ui/atoms'

// Real product rules, each paired with the guide that explains it.
const PILLARS = [
  { title: 'Women-only nights', line: 'Hosts can make a night women-only. Gender is set once and can’t be changed.', slug: 'women-only-events-explained' },
  { title: 'The crowd mix', line: '50:50, 60:40 and more. Seats fill to the mix the host chose.', slug: 'reading-the-crowd-mix' },
  { title: 'A private address', line: 'Only the area shows publicly. The flat unlocks once you’re confirmed.', slug: 'choosing-a-house-party-you-feel-good-about' },
  { title: 'One-tap SOS', line: 'Live location to up to 5 people you choose, even in the background.', slug: 'using-sos-and-live-location' },
]

/**
 * Chapter 03, for women. Not a separate shelf: four rules the app is built
 * on, each opening the guide that explains it, then the rest of the
 * women's guides as questions.
 */
export function ForWomen({ women }: { women: OutGuide[] }) {
  if (!women.length) return null
  const bySlug = (s: string) => women.find(g => g.slug === s)
  const used = new Set(PILLARS.map(p => p.slug))
  const rest = women.filter(g => !used.has(g.slug))

  return (
    <section className="bg-blush/55 px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-[1280px]">
        <Chapter n="03" title="For women" />
        <h2 className="mt-4 max-w-[900px] font-display text-[clamp(44px,6vw,96px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
          Built so you can
          <span className="font-serif font-normal italic tracking-[-0.03em] text-orange"> say yes.</span>
        </h2>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p, i) => {
            const g = bySlug(p.slug)
            return (
              <li key={p.title}>
                <Link href={g ? outGuideHref(g) : '/safety'} className="group flex h-full flex-col rounded-[28px] bg-white p-6 shadow-soft transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1.5 hover:shadow-pop">
                  <span className="font-serif text-xl italic text-orange">{String(i + 1).padStart(2, '0')}</span>
                  <span className="mt-6 font-display text-[26px] font-extrabold leading-tight tracking-[-0.04em]">{p.title}</span>
                  <span className="mt-2 font-sans text-[15px] leading-relaxed text-ink-2">{p.line}</span>
                  <span className="mt-auto pt-6 font-sans text-sm font-bold">
                    {g ? `Read: ${questionOf(g)}` : 'How safety works'} <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>

        {rest.length > 0 && (
          <div className="mt-14 flex flex-wrap gap-x-3 gap-y-3">
            {rest.map(g => (
              <Link key={g.slug} href={outGuideHref(g)} className="rounded-full bg-white/70 px-5 py-2.5 font-sans text-[15px] font-bold text-ink transition-colors duration-300 hover:bg-ink hover:text-cream">
                {questionOf(g)}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
