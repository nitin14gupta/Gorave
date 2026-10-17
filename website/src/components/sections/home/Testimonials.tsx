import type { PublicReviews } from '@/lib/api'
import { H2 } from '@/components/ui/atoms'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'

/**
 * Real reviews from guests (public API): the platform-wide average and the
 * latest written ones. If there are none yet, the section doesn't render —
 * no invented quotes or ratings.
 */
export function Testimonials({ data }: { data: PublicReviews | null }) {
  if (!data || !data.reviews.length) return null
  const { avg_rating, review_count, reviews } = data
  return (
    <section className="bg-paper px-6 py-24 md:px-20 md:py-28">
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 rounded-[40px] bg-ink p-10 text-cream md:p-20 lg:grid-cols-2">
        <Reveal>
          <H2 dark className="!text-[clamp(44px,5.4vw,76px)]">Social life runs on <span className="text-brand">gorave</span></H2>
          <p className="mt-3 font-sans text-lg text-noir-ink-2">What guests said after the night.</p>
          {avg_rating && (
            <div className="mt-8 flex items-center gap-5">
              <div className="font-display text-[56px] font-extrabold leading-none">{avg_rating.toFixed(1)}</div>
              <div>
                <div className="text-[22px] leading-none tracking-[0.1em] text-gold" aria-label={`${avg_rating} out of 5`}>★★★★★</div>
                <div className="mt-1 font-sans text-sm text-noir-ink-2">from {review_count.toLocaleString('en-IN')} event reviews</div>
              </div>
            </div>
          )}
        </Reveal>
        <Stagger className="flex flex-col gap-3.5">
          {reviews.map((t, i) => (
            <StaggerItem key={`${t.name}-${i}`}>
              <figure
                className="rounded-[22px] bg-noir-2 p-5.5 transition-transform duration-500 ease-out-expo hover:-translate-y-1"
                style={{ marginLeft: i % 2 ? 30 : 0 }}
              >
                <blockquote className="font-sans text-[17px]">&ldquo;{t.body}&rdquo;</blockquote>
                <figcaption className="mt-2 font-sans text-[14px] text-noir-ink-2">
                  {t.name}{t.city ? `, ${t.city}` : ''} · <span className="text-gold">{'★'.repeat(t.rating)}</span> · {t.event_title}
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
