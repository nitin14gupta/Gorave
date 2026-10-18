import Image from 'next/image'
import Link from 'next/link'
import { PHOTOS } from '@/constants'
import { outGuideHref, type OutGuide } from '@/lib/goingOut'
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

/** A guide as a photo card. */
export function GuideTile({ g, className, tall }: { g: OutGuide; className?: string; tall?: boolean }) {
  return (
    <Link href={outGuideHref(g)} className={cn('group block', className)}>
      <div className={cn('relative overflow-hidden rounded-[26px] bg-tile', tall ? 'aspect-[4/5]' : 'aspect-[4/3]')}>
        <Image src={guidePhoto(g)} alt="" fill sizes="(min-width: 1024px) 400px, 90vw" className="object-cover transition-transform duration-[1.1s] ease-out-expo group-hover:scale-[1.06]" />
        {g.collection === 'women' && <WomenTag className="absolute left-3 top-3" />}
      </div>
      <div className="mt-4 font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink-3">{g.category} · {g.readMinutes} min</div>
      <div className="mt-1.5 font-display text-[24px] font-extrabold leading-[1.05] tracking-[-0.035em] transition-colors group-hover:text-orange">{g.title}</div>
      <p className="mt-2 line-clamp-2 font-sans text-[15px] leading-relaxed text-ink-2">{g.dek}</p>
    </Link>
  )
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
