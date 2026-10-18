import { HELP_CRUMBS, HELP_TOPICS } from '@/lib/help'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Chapter } from '@/components/ui/atoms'
import { Accordion } from '@/components/ui/Accordion'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { HelpSearch } from './HelpSearch'
import { TopicGrid } from './TopicGrid'
import { StillStuck } from './StillStuck'

// The questions people ask first: the opener of these topics.
const MOST_ASKED = ['request-to-join', 'address-and-privacy', 'cancellations-and-refunds', 'booking-and-payments', 'safety-and-sos', 'host-payouts']

/**
 * /help. Minimal on purpose: one question box that answers in place, every
 * topic as a quiet tile that opens on hover, the six most-asked answers,
 * then a real person.
 */
export function HelpHub() {
  const topics = HELP_TOPICS
  const total = topics.reduce((n, t) => n + t.questions.length, 0)
  const asked = MOST_ASKED.map(s => topics.find(t => t.slug === s)?.questions[0]).filter((x): x is NonNullable<typeof x> => !!x)

  return (
    <>
      <main className="bg-cream">
        <section className="px-6 pb-20 pt-28 md:px-12 lg:px-20">
          <div className="mx-auto max-w-[980px]">
            <Breadcrumbs crumbs={HELP_CRUMBS} />
            <h1 className="mt-10 font-display text-[clamp(56px,9vw,148px)] font-extrabold leading-[0.86] tracking-[-0.07em]">
              How can
              <span className="font-serif font-normal italic tracking-[-0.03em] text-orange"> we help?</span>
            </h1>
            <p className="mt-6 max-w-[480px] font-sans text-lg leading-relaxed text-ink-2">
              {total} answers about going out, money, safety and hosting. Type, and the answer opens right here.
            </p>
            <div className="mt-10">
              <HelpSearch topics={topics} />
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 md:px-12 md:pb-32 lg:px-20">
          <div className="mx-auto max-w-[1180px]">
            <Chapter n="01" title="Browse by topic" />
            <div className="mt-8">
              <TopicGrid topics={topics} />
            </div>
          </div>
        </section>

        {asked.length > 0 && (
          <section className="bg-paper px-6 py-24 md:px-12 md:py-32 lg:px-20">
            <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[1fr_1.6fr]">
              <div>
                <Chapter n="02" title="Most asked" />
                <h2 className="mt-4 font-display text-[clamp(40px,5vw,76px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
                  The ones
                  <span className="font-serif font-normal italic tracking-[-0.03em] text-orange"> everyone asks.</span>
                </h2>
              </div>
              <Accordion items={asked} />
            </div>
          </section>
        )}

        <div className="h-24 bg-cream md:h-32" />
        <StillStuck />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
