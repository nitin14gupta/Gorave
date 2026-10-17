import { CITIES, PHOTOS } from '@/constants'
import { Eyebrow, H2, Lede } from '@/components/ui/atoms'
import { Reveal } from '@/components/motion/Reveal'
import { HoverPreviewList } from '@/components/ui/HoverPreviewList'

/** City list with a photo that follows the cursor and swaps per row. */
export function Cities() {
  const rows = CITIES.slice(0, 6).map(c => ({
    key: c.slug,
    label: c.name,
    href: `/${c.slug}`,
    aside: `${c.areas.slice(0, 3).join(' · ')} →`,
    image: PHOTOS[c.photo],
  }))

  return (
    <section className="bg-paper px-6 py-28 md:px-20 md:py-32">
      <div className="mx-auto grid max-w-[1280px] gap-14 lg:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <Eyebrow>Cities</Eyebrow>
          <H2 className="mb-5 mt-3.5 !text-[clamp(40px,5vw,72px)]">Where&apos;s the party tonight?</H2>
          <Lede>Pick your city to see what&apos;s on near you.</Lede>
        </Reveal>
        <HoverPreviewList rows={rows} />
      </div>
    </section>
  )
}
