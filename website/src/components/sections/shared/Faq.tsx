import { faqLd } from '@/lib/seo'
import { Accordion, type AccordionItem } from '@/components/ui/Accordion'
import { Chapter, Eyebrow, H2 } from '@/components/ui/atoms'
import { JsonLd } from '@/components/ui/JsonLd'

/** FAQ section with FAQPage structured data, reused by every page template. */
export function Faq({ title = 'Questions, answered', items, chapter }: { title?: string; items: AccordionItem[]; chapter?: string }) {
  return (
    <section className="bg-cream px-6 py-24 md:px-20 md:py-28">
      <JsonLd data={faqLd(items)} />
      <div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-[1fr_1.6fr]">
        <div>
          {chapter ? <Chapter n={chapter} title="The questions" /> : <Eyebrow>FAQ</Eyebrow>}
          <H2 className="mt-3.5 !text-[clamp(40px,5vw,72px)]">{title}</H2>
        </div>
        <Accordion items={items} />
      </div>
    </section>
  )
}
