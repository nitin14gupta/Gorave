import Link from 'next/link'
import { HELP_TOPICS, SUPPORT_EMAIL } from '@/lib/help'
import { LEGAL_ENTITY } from '@/lib/legal'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { ContactForm, type ContactTopic } from './ContactForm'

const CRUMBS = [{ label: 'Home', href: '/' }, { label: 'Contact', href: '/contact' }]

// Each topic can point at the help answer that most often solves it.
const TOPICS: { key: string; label: string; help?: string; urgent?: boolean }[] = [
  { key: 'booking', label: 'A booking or refund', help: 'cancellations-and-refunds' },
  { key: 'hosting', label: 'Hosting or payouts', help: 'host-payouts' },
  { key: 'safety', label: 'A safety concern', help: 'reporting-and-blocking', urgent: true },
  { key: 'account', label: 'My account', help: 'account-and-verification' },
  { key: 'press', label: 'Press or partnerships' },
  { key: 'other', label: 'Something else' },
]

/**
 * /contact. A form that writes the email for you, with a quick answer for
 * the common topics, and the other ways to reach the right place.
 */
export function ContactPage() {
  const topics: ContactTopic[] = TOPICS.map(t => {
    const h = t.help ? HELP_TOPICS.find(x => x.slug === t.help) : undefined
    return { key: t.key, label: t.label, urgent: t.urgent, help: h?.questions[0] ? { slug: h.slug, title: h.title, question: h.questions[0].q, answer: h.questions[0].a } : undefined }
  })
  const ways = [
    { href: '/help', kicker: 'Help centre', title: 'Most answers are already here', cta: 'Search help' },
    { href: '/safety', kicker: 'Safety', title: 'How we keep nights safe', cta: 'Read it' },
    { href: '/terms', kicker: 'Legal & complaints', title: LEGAL_ENTITY.grievanceOfficer, cta: LEGAL_ENTITY.grievanceEmail },
  ]

  return (
    <>
      <main className="bg-cream">
        <section className="px-6 pb-24 pt-28 md:px-12 md:pb-32 lg:px-20">
          <div className="mx-auto max-w-[1180px]">
            <Breadcrumbs crumbs={CRUMBS} />
            <div className="mt-10 grid items-start gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
              <div className="lg:sticky lg:top-28">
                <h1 className="font-display text-[clamp(56px,8vw,128px)] font-extrabold leading-[0.86] tracking-[-0.07em]">
                  Say hi.
                  <br />
                  <span className="font-serif font-normal italic tracking-[-0.03em] text-orange">We read everything.</span>
                </h1>
                <p className="mt-7 max-w-[420px] font-sans text-xl leading-relaxed text-ink-2">
                  A booking that went sideways, a host question, a safety worry, or just an idea. Tell us, and a real person replies.
                </p>
                <div className="mt-10 space-y-4">
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="group flex items-center gap-4">
                    <span className="grid size-12 place-items-center rounded-full bg-white font-sans text-lg shadow-soft transition-transform duration-500 ease-out-expo group-hover:-rotate-12">@</span>
                    <span>
                      <span className="block font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">Email us directly</span>
                      <span className="block font-display text-[22px] font-extrabold tracking-[-0.035em] transition-colors group-hover:text-orange">{SUPPORT_EMAIL}</span>
                    </span>
                  </a>
                  <a href="tel:112" className="group flex items-center gap-4">
                    <span className="grid size-12 place-items-center rounded-full bg-blush font-sans text-sm font-bold text-blush-ink shadow-soft transition-transform duration-500 ease-out-expo group-hover:-rotate-12">112</span>
                    <span>
                      <span className="block font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">In danger right now</span>
                      <span className="block font-display text-[22px] font-extrabold tracking-[-0.035em] transition-colors group-hover:text-orange">Call 112, then hold SOS</span>
                    </span>
                  </a>
                </div>
              </div>
              <ContactForm topics={topics} />
            </div>
          </div>
        </section>

        <section className="bg-paper px-6 py-20 md:px-12 lg:px-20">
          <div className="mx-auto max-w-[1180px]">
            <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">Other ways in</div>
            <ul className="mt-5 grid gap-3 md:grid-cols-3">
              {ways.map(w => (
                <li key={w.href}>
                  <Link href={w.href} className="group flex h-full flex-col rounded-[26px] bg-cream p-6 transition-[transform,background-color,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:bg-white hover:shadow-soft">
                    <span className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">{w.kicker}</span>
                    <span className="mt-4 font-display text-[24px] font-extrabold leading-tight tracking-[-0.04em]">{w.title}</span>
                    <span className="mt-auto pt-6 font-sans text-sm font-bold">{w.cta} <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span></span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-10 font-sans text-[15px] text-ink-2">
              Gorave is built by a small team in India. <Link href="/about" className="font-bold text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-orange">Meet us</Link>.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
