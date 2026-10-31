import Image from 'next/image'
import { EVENT_TYPES, PHOTOS } from '@/constants'
import type { PublicReviews } from '@/lib/api'
import { H2 } from '@/components/ui/atoms'
import { Reveal } from '@/components/motion/Reveal'

type Review = PublicReviews['reviews'][number]

/** The strongest real reviews: 4 stars and up, no repeated lines. */
function bestReviews(data: PublicReviews | null, limit: number) {
  if (!data) return []
  const seen = new Set<string>()
  const picked: Review[] = []
  for (const r of [...data.reviews].sort((a, b) => b.rating - a.rating)) {
    const key = r.body.trim().toLowerCase()
    if (r.rating < 4 || seen.has(key)) continue
    seen.add(key)
    picked.push(r)
    if (picked.length === limit) break
  }
  return picked
}

function reviewPhoto(r: Review) {
  return r.event_image ?? PHOTOS[(EVENT_TYPES.find(t => t.key === r.event_type) ?? EVENT_TYPES[EVENT_TYPES.length - 1]).photo]
}

/**
 * Each real review on the flyer of the night it came from. If there are none
 * yet the section doesn't render: no invented quotes or ratings.
 */
export function Testimonials({ data }: { data: PublicReviews | null }) {
  const reviews = bestReviews(data, 4)
  if (!data || !reviews.length) return null

  return (
    <section className="bg-paper py-24 md:py-28">
      <div className="mx-auto max-w-[1280px] px-6 md:px-20 xl:px-0">
        <Reveal className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <H2>Social life runs<br />on gorave.</H2>
          {data.avg_rating ? (
            <div className="pb-2 font-sans text-[15px] text-ink-2 md:text-right">
              <span className="font-bold text-ink">{data.avg_rating.toFixed(1)}</span> <span className="text-orange" aria-hidden>★</span> from {data.review_count.toLocaleString('en-IN')} event reviews
            </div>
          ) : null}
        </Reveal>

        <div className="-mx-6 mt-11 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-6 px-6 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-4">
          {reviews.map((r, i) => (
            <figure key={`${r.name}-${i}`} className="w-[76vw] max-w-[320px] shrink-0 snap-start md:w-auto md:max-w-none">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-tile">
                <Image src={reviewPhoto(r)} alt={r.event_title} fill sizes="(max-width: 768px) 76vw, 300px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <blockquote className="absolute inset-x-5 bottom-5 font-display text-[clamp(24px,2.1vw,28px)] font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
                  &ldquo;{r.body}&rdquo;
                </blockquote>
              </div>
              <figcaption className="mt-3.5 font-sans">
                <div className="flex items-center justify-between gap-3 text-[15px]">
                  <span className="truncate font-bold text-ink">{r.name}{r.city ? `, ${r.city}` : ''}</span>
                  <span className="shrink-0 font-bold text-ink"><span className="text-orange" aria-hidden>★</span> {r.rating}</span>
                </div>
                <div className="mt-0.5 truncate text-sm text-ink-2">After {r.event_title}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
