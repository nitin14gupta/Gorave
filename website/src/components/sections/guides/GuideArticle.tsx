import { GUIDES_CRUMBS, guideHref, nextGuide, sectionId, type HostGuide } from '@/lib/hostGuides'
import { absoluteUrl, SITE_URL } from '@/lib/seo'
import { PHOTOS } from '@/constants'
import { JsonLd } from '@/components/ui/JsonLd'
import { Button } from '@/components/ui/Button'
import { Chapter, StoreBadges } from '@/components/ui/atoms'
import { Reveal } from '@/components/motion/Reveal'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { ArticleHero, NextGuideCard, ReadingProgress, Toc } from './article/ArticleMotion'

/**
 * One hosting guide (/host/guides/[slug]). A progress bar across the top,
 * a parallax hero, the body beside a sticky contents list that follows you,
 * tip callouts, then the next guide in the reading path and a host CTA.
 */
export function GuideArticle({ guide }: { guide: HostGuide }) {
  const next = nextGuide(guide.slug)
  const crumbs = [...GUIDES_CRUMBS, { label: guide.title, href: guideHref(guide.slug) }]
  const toc = guide.body.map(s => ({ id: sectionId(s.heading), label: s.heading }))
  const url = absoluteUrl(guideHref(guide.slug))

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.dek,
    image: [`${PHOTOS[guide.hero]}?w=1600&q=75&auto=format`],
    articleSection: guide.category,
    timeRequired: `PT${guide.readMinutes}M`,
    inLanguage: 'en-IN',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    author: { '@type': 'Organization', name: 'Gorave', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'Gorave', url: SITE_URL, logo: { '@type': 'ImageObject', url: absoluteUrl('/img/splash-icon.png') } },
  }

  return (
    <>
      <ReadingProgress />
      <JsonLd data={articleLd} />
      <main>
        <ArticleHero guide={guide} crumbs={crumbs} />

        <section className="bg-cream px-6 py-20 md:px-20 md:py-28">
          <div className="mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[260px_1fr] lg:gap-20">
            <aside className="hidden lg:block">
              <Toc items={toc} />
            </aside>

            <article className="max-w-[720px]">
              {/* Phones: the contents as a plain list */}
              <nav aria-label="In this guide" className="mb-14 rounded-[24px] bg-paper p-6 shadow-soft lg:hidden">
                <div className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3">In this guide</div>
                <ol className="mt-3 grid gap-2">
                  {toc.map((t, i) => (
                    <li key={t.id}>
                      <a href={`#${t.id}`} className="flex gap-3 font-sans text-[15px] font-bold text-ink-2">
                        <span className="font-serif font-normal italic text-orange">{String(i + 1).padStart(2, '0')}</span>
                        {t.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>

              {guide.body.map((s, i) => (
                <section key={s.heading} id={toc[i].id} className="scroll-mt-28 pb-14 last:pb-0">
                  <Chapter n={String(i + 1).padStart(2, '0')} title={guide.category} />
                  <h2 className="mt-4 font-display text-[clamp(30px,3.4vw,46px)] font-extrabold leading-[0.98] tracking-[-0.045em]">{s.heading}</h2>
                  <div className="mt-5 grid gap-5">
                    {s.paragraphs.map(p => (
                      <p key={p.slice(0, 40)} className="font-sans text-[18px] leading-[1.75] text-ink-2">{p}</p>
                    ))}
                  </div>
                  {s.tips && (
                    <Reveal y={20} className="mt-8">
                      <aside className="relative overflow-hidden rounded-[24px] bg-white p-6 text-ink shadow-soft md:p-7">
                        <span aria-hidden className="absolute inset-y-0 left-0 w-[5px] bg-brand" />
                        <div className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-orange">Host tip{s.tips.length > 1 ? 's' : ''}</div>
                        <ul className="mt-3 grid gap-3">
                          {s.tips.map(t => (
                            <li key={t.slice(0, 40)} className="flex gap-3 font-sans text-[16px] leading-relaxed text-ink">
                              <span aria-hidden className="mt-[9px] size-[7px] shrink-0 rounded-full bg-brand" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </aside>
                    </Reveal>
                  )}
                </section>
              ))}
            </article>
          </div>
        </section>

        <section className="bg-cream px-6 pb-20 md:px-20 md:pb-28">
          <div className="mx-auto max-w-[1180px]">
            <NextGuideCard guide={next} href={guideHref(next.slug)} />
          </div>
        </section>

        <section className="bg-paper px-6 py-24 text-ink md:px-20 md:py-28">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-end justify-between gap-10">
            <div>
              <Chapter n="→" title="Your turn" />
              <h2 className="mt-4 font-display text-[clamp(44px,6vw,92px)] font-extrabold leading-[0.88] tracking-[-0.06em]">
                Ready to host<br />
                <span className="font-serif font-normal italic tracking-[-0.02em] text-brand">your own?</span>
              </h2>
              <p className="mt-5 max-w-[460px] font-sans text-lg leading-relaxed text-ink-2">
                Listing is free. Run two free-entry events a month, or sell tickets from ₹99 and keep 90%.
              </p>
            </div>
            <div className="flex flex-col items-start gap-5">
              <div className="flex flex-wrap gap-2.5">
                <Button href="/host" size="lg">Start hosting</Button>
                <Button href="/host/guides" kind="ghost" size="lg">All guides</Button>
              </div>
              <StoreBadges height={44} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
