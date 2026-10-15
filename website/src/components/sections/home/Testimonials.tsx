import { APP_RATING, TESTIMONIALS } from '@/constants'
import { H2 } from '@/components/ui/atoms'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'

export function Testimonials() {
  return (
    <section className="bg-paper px-6 py-24 md:px-20 md:py-28">
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 rounded-[40px] bg-ink p-10 text-cream md:p-20 lg:grid-cols-2">
        <Reveal>
          <H2 dark className="!text-[clamp(44px,5.4vw,76px)]">Social life runs on <span className="text-brand">gorave</span></H2>
          <p className="mt-3 font-sans text-lg text-noir-ink-2">Loved by people who actually go out.</p>
          <div className="mt-8 flex items-center gap-5">
            <div className="font-display text-[56px] font-extrabold leading-none">{APP_RATING.score}</div>
            <div>
              <div className="text-[22px] leading-none tracking-[0.1em] text-gold" aria-label={`${APP_RATING.score} out of 5`}>★★★★★</div>
              <div className="mt-1 font-sans text-sm text-noir-ink-2">{APP_RATING.count}</div>
            </div>
          </div>
        </Reveal>
        <Stagger className="flex flex-col gap-3.5">
          {TESTIMONIALS.map((t, i) => (
            <StaggerItem key={t.name}>
              <figure
                className="rounded-[22px] bg-noir-2 p-5.5 transition-transform duration-500 ease-out-expo hover:-translate-y-1"
                style={{ marginLeft: i % 2 ? 30 : 0 }}
              >
                <blockquote className="inline font-sans text-[17px]">&ldquo;{t.quote}&rdquo;</blockquote>{' '}
                <figcaption className="inline font-sans text-[15px] text-noir-ink-2">— {t.name}, {t.city}</figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
