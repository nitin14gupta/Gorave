import { GUIDES_HUB_CRUMBS, WOMEN_HUB_CRUMBS, nextOutGuide, outGuideHref, outSectionId, type OutGuide } from '@/lib/goingOut'
import { absoluteUrl, SITE_URL } from '@/lib/seo'
import { PHOTOS } from '@/constants'
import { JsonLd } from '@/components/ui/JsonLd'
import { Chapter } from '@/components/ui/atoms'
import { Reveal } from '@/components/motion/Reveal'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { ArticleHero, NextGuideCard, ReadingProgress, Toc } from '@/components/sections/guides/article/ArticleMotion'

/**
 * One going-out or women's guide. Same reading experience as the hosting
 * guides (progress bar, parallax hero, sticky contents), plus the short
 * version up top, then the next guide in the collection and the way out.
 */
export function OutGuideArticle({ guide }: { guide: OutGuide }) {
  const next = nextOutGuide(guide)
  const women = guide.collection === 'women'
  const crumbs = [...(women ? WOMEN_HUB_CRUMBS : GUIDES_HUB_CRUMBS), { label: guide.title, href: outGuideHref(guide) }]
  const toc = guide.body.map(s => ({ id: outSectionId(s.heading), label: s.heading }))
  const url = absoluteUrl(outGuideHref(guide))
  const image = PHOTOS[guide.hero]

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.dek,
    image: [image.startsWith('http') ? `${image}?w=1600&q=75&auto=format` : absoluteUrl(image)],
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
        <ArticleHero guide={guide} crumbs={crumbs} kicker={women ? 'Gorave guide for women' : 'Gorave going-out guide'} />

        <section className="bg-cream px-6 py-20 md:px-20 md:py-28">
          <div className="mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[260px_1fr] lg:gap-20">
            <aside className="hidden lg:block">
              <Toc items={toc} />
            </aside>

            <article className="max-w-[720px]">
              <Reveal y={20}>
                <div className="rounded-[28px] bg-white p-7 shadow-soft md:p-8">
                  <div className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-orange">The short version</div>
                  <ol className="mt-4 grid gap-4">
                    {guide.takeaways.map((t, i) => (
                      <li key={t.slice(0, 40)} className="flex gap-4">
                        <span className="font-serif text-xl italic text-orange">{i + 1}</span>
                        <span className="font-display text-[20px] font-extrabold leading-snug tracking-[-0.025em]">{t}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </Reveal>

              <nav aria-label="In this guide" className="mt-10 rounded-[24px] bg-paper p-6 shadow-soft lg:hidden">
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

              <div className="mt-16">
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
                          <div className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-orange">Good to know</div>
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
              </div>
            </article>
          </div>
        </section>

        <section className="bg-cream px-6 pb-20 md:px-20 md:pb-28">
          <div className="mx-auto max-w-[1180px]">
            <NextGuideCard guide={next} href={outGuideHref(next)} />
          </div>
        </section>

      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
