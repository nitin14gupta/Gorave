import { H2, Lede, StoreBadges } from '@/components/ui/atoms'
import { Phone } from '@/components/ui/Phone'
import { LiveEventDetailScreen } from '@/components/ui/LiveEvents'
import { Parallax } from '@/components/motion/Parallax'
import { Reveal } from '@/components/motion/Reveal'

export function SaturdayCta() {
  return (
    <section className="bg-noir px-6 py-24 md:px-20 md:py-32">
      <div className="relative mx-auto flex max-w-[1280px] flex-col justify-between gap-10 overflow-hidden rounded-[44px] bg-cream px-8 py-16 md:px-20 md:py-24 lg:h-[560px] lg:flex-row lg:items-center">
        <Reveal>
          <H2 className="!text-[clamp(52px,6.6vw,96px)]">Your Saturday<br />is waiting.</H2>
          <Lede className="mb-8 mt-5">Get the app and find something to do this weekend.</Lede>
          <StoreBadges />
        </Reveal>
        <div className="hidden self-start lg:flex">
          <Parallax offset={-90} rotate={2}>
            <div className="-rotate-8"><Phone width={240}><LiveEventDetailScreen index={1} /></Phone></div>
          </Parallax>
          <Parallax offset={-160} rotate={-2} className="-ml-15 mt-18">
            <div className="rotate-6"><Phone width={240}><LiveEventDetailScreen index={2} /></Phone></div>
          </Parallax>
        </div>
      </div>
    </section>
  )
}
