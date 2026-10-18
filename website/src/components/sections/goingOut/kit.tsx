import { PHOTOS } from '@/constants'
import type { OutGuide } from '@/lib/goingOut'
import { Button } from '@/components/ui/Button'
import { Chapter, StoreBadges } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

export { Head } from '@/components/sections/areaType/kit'

export const EASE = [0.2, 0.8, 0.2, 1] as const
export const EASE_CSS = 'cubic-bezier(.2,.8,.2,1)'
export const guidePhoto = (g: OutGuide) => PHOTOS[g.hero]

/** "For women" pill for guides in the women's collection. */
export function WomenTag({ className }: { className?: string }) {
  return <span className={cn('rounded-full bg-blush px-2.5 py-1 font-sans text-[11px] font-bold text-blush-ink', className)}>For women</span>
}

/** Shared last section: stop reading, go out. */
export function GoOutCta({ n }: { n: string }) {
  return (
    <section className="bg-paper px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-end justify-between gap-10">
        <div>
          <Chapter n={n} title="Enough reading" />
          <h2 className="mt-4 font-display text-[clamp(44px,6vw,96px)] font-extrabold leading-[0.88] tracking-[-0.06em]">
            Now go
            <br />
            <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">out tonight.</span>
          </h2>
          <p className="mt-5 max-w-[460px] font-sans text-lg leading-relaxed text-ink-2">
            House parties, rooftops, game nights and dinners in your city, hosted by real people.
          </p>
        </div>
        <div className="flex flex-col items-start gap-5">
          <div className="flex flex-wrap gap-2.5">
            <Button href="/tonight" size="lg">What’s on tonight</Button>
            <Button href="/app" kind="ghost" size="lg">Get the app</Button>
          </div>
          <StoreBadges height={44} />
        </div>
      </div>
    </section>
  )
}
