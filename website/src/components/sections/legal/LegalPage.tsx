import Link from 'next/link'
import { LEGAL_DOCS, LEGAL_ENTITY, legalCrumbs, legalHref, type LegalDoc } from '@/lib/legal'
import { slugify } from '@/lib/seo'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { ReadingProgress } from '@/components/sections/guides/article/ArticleMotion'
import { DocSwitcher } from './DocSwitcher'
import { LegalToc } from './LegalToc'

/**
 * One legal document. Calm and readable on purpose: tabs across all five
 * documents, the short version first, then numbered sections beside a
 * contents list that follows you, each heading linkable. Ends with who to
 * contact, including the grievance officer.
 */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  const toc = doc.sections.map(s => ({ id: slugify(s.heading), label: s.heading }))
  const others = LEGAL_DOCS.filter(d => d.slug !== doc.slug)

  return (
    <>
      <ReadingProgress />
      <main className="bg-cream">
        <section className="px-6 pb-16 pt-28 md:px-12 lg:px-20">
          <div className="mx-auto max-w-[1180px]">
            <Breadcrumbs crumbs={legalCrumbs(doc)} />
            <div className="mt-8">
              <DocSwitcher docs={LEGAL_DOCS} current={doc.slug} />
            </div>
            <h1 className="mt-12 font-display text-[clamp(48px,7vw,112px)] font-extrabold leading-[0.88] tracking-[-0.065em]">{doc.title}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-sans text-sm font-bold text-ink-3">
              <span>Last updated {LEGAL_ENTITY.updated}</span>
              <span aria-hidden>·</span>
              <span>{doc.sections.length} sections</span>
            </div>
            <p className="mt-5 max-w-[620px] font-sans text-xl leading-relaxed text-ink-2">{doc.line}</p>

            <div className="mt-12 max-w-[820px] rounded-[30px] bg-white p-7 shadow-soft md:p-9">
              <div className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-orange">The short version</div>
              <ul className="mt-5 grid gap-4">
                {doc.short.map(s => (
                  <li key={s.slice(0, 40)} className="flex gap-4">
                    <span aria-hidden className="mt-[10px] size-2 shrink-0 rounded-full bg-brand" />
                    <span className="font-display text-[clamp(18px,1.8vw,22px)] font-extrabold leading-snug tracking-[-0.025em]">{s}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 font-sans text-sm text-ink-3">This summary helps you read the document. The full text below is what applies.</p>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 md:px-12 md:pb-32 lg:px-20">
          <div className="mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[250px_1fr] lg:gap-20">
            <aside className="hidden lg:block">
              <LegalToc items={toc} />
            </aside>
            <article className="max-w-[720px]">
              {doc.sections.map((s, i) => (
                <section key={s.heading} id={toc[i].id} className="group scroll-mt-28 border-t border-ink/10 py-10 first:border-t-0 first:pt-0">
                  <h2 className="flex items-baseline gap-4 font-display text-[clamp(24px,2.6vw,34px)] font-extrabold leading-tight tracking-[-0.04em]">
                    <span className="font-serif text-xl font-normal italic text-orange">{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex-1">{s.heading}</span>
                    <a href={`#${toc[i].id}`} aria-label={`Link to ${s.heading}`} className="font-sans text-lg text-ink-3 opacity-0 transition-opacity hover:text-orange group-hover:opacity-100">#</a>
                  </h2>
                  <div className="mt-5 grid gap-4 pl-0 md:pl-10">
                    {s.paragraphs.map(p => (
                      <p key={p.slice(0, 50)} className="font-sans text-[17px] leading-[1.75] text-ink-2">{p}</p>
                    ))}
                    {s.bullets && (
                      <ul className="grid gap-2.5">
                        {s.bullets.map(b => (
                          <li key={b.slice(0, 50)} className="flex gap-3 font-sans text-[16px] leading-relaxed text-ink-2">
                            <span aria-hidden className="mt-[10px] size-1.5 shrink-0 rounded-full bg-ink/40" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              ))}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <a href={`mailto:${LEGAL_ENTITY.email}`} className="group rounded-[26px] bg-brand p-6 text-white transition-transform duration-500 ease-out-expo hover:-translate-y-1">
                  <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-white/75">Questions</div>
                  <div className="mt-3 font-display text-2xl font-extrabold tracking-[-0.04em]">Write to us</div>
                  <div className="mt-4 font-sans text-sm font-bold">{LEGAL_ENTITY.email} <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span></div>
                </a>
                <a href={`mailto:${LEGAL_ENTITY.grievanceEmail}`} className="group rounded-[26px] bg-paper p-6 transition-[transform,background-color] duration-500 ease-out-expo hover:-translate-y-1 hover:bg-white">
                  <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">Complaints</div>
                  <div className="mt-3 font-display text-2xl font-extrabold tracking-[-0.04em]">{LEGAL_ENTITY.grievanceOfficer}</div>
                  <div className="mt-4 font-sans text-sm font-bold">{LEGAL_ENTITY.grievanceEmail} <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span></div>
                </a>
              </div>
            </article>
          </div>
        </section>

        <section className="bg-paper px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-[1180px]">
            <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">Also read</div>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {others.map(d => (
                <li key={d.slug}>
                  <Link href={legalHref(d.slug)} className="group block h-full rounded-[24px] bg-cream p-5 transition-[transform,background-color,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:bg-white hover:shadow-soft">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-display text-xl font-extrabold tracking-[-0.035em]">{d.title}</span>
                      <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">→</span>
                    </div>
                    <p className="mt-2 line-clamp-2 font-sans text-[14px] leading-relaxed text-ink-2">{d.line}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
