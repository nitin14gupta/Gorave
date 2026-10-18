import Link from 'next/link'
import { HELP_CRUMBS, HELP_TOPICS, helpHref, type HelpTopic } from '@/lib/help'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { JsonLd } from '@/components/ui/JsonLd'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { QAList } from './QAList'
import { TopicRail } from './TopicRail'
import { StillStuck } from './StillStuck'

/**
 * /help/[topic]. The topic rail on the left, the answers on the right, then
 * the next topic and a real person. FAQPage structured data for search.
 */
export function HelpTopicView({ topic }: { topic: HelpTopic }) {
  const i = HELP_TOPICS.findIndex(t => t.slug === topic.slug)
  const prev = HELP_TOPICS[(i - 1 + HELP_TOPICS.length) % HELP_TOPICS.length]
  const next = HELP_TOPICS[(i + 1) % HELP_TOPICS.length]
  const crumbs = [...HELP_CRUMBS, { label: topic.title, href: helpHref(topic.slug) }]
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: topic.questions.map(x => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })),
  }

  return (
    <>
      <JsonLd data={faqLd} />
      <main className="bg-cream">
        <section className="px-6 pb-24 pt-28 md:px-12 md:pb-32 lg:px-20">
          <div className="mx-auto max-w-[1180px]">
            <Breadcrumbs crumbs={crumbs} />
            <div className="mt-12 grid gap-14 lg:grid-cols-[230px_1fr] lg:gap-20">
              <aside className="hidden lg:block">
                <TopicRail topics={HELP_TOPICS} current={topic.slug} />
              </aside>
              <div>
                <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">{topic.group} · {topic.questions.length} answers</div>
                <h1 className="mt-4 font-display text-[clamp(48px,6.4vw,104px)] font-extrabold leading-[0.88] tracking-[-0.065em]">{topic.title}</h1>
                <p className="mt-5 max-w-[540px] font-sans text-xl leading-relaxed text-ink-2">{topic.line}</p>
                <div className="mt-12">
                  <QAList items={topic.questions} />
                </div>

                <div className="mt-16 grid gap-3 sm:grid-cols-2">
                  {[{ t: prev, label: 'Previous' }, { t: next, label: 'Next' }].map(({ t, label }) => (
                    <Link key={label} href={helpHref(t.slug)} className="group rounded-[24px] bg-paper p-6 transition-[transform,background-color,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:bg-white hover:shadow-soft">
                      <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">{label}</div>
                      <div className="mt-2 flex items-center justify-between gap-4">
                        <span className="font-display text-[24px] font-extrabold tracking-[-0.04em]">{t.title}</span>
                        <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/help" className="mt-8 inline-block font-sans text-sm font-bold text-ink-3 transition-colors hover:text-ink lg:hidden">← All help topics</Link>
              </div>
            </div>
          </div>
        </section>
        <StillStuck />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
