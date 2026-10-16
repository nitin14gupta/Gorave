import Image from 'next/image'
import { templateImage } from '@/constants'
import { HOST_TEMPLATES } from '@/lib/host'
import { Chapter, StoreBadges } from '@/components/ui/atoms'
import { Button } from '@/components/ui/Button'

const ROW = [...HOST_TEMPLATES, ...HOST_TEMPLATES]

/**
 * Chapter 08 — your turn. Two belts of invite templates run in opposite
 * directions behind the last line; hovering a belt pauses it.
 */
export function HostCtaA() {
  return (
    <section className="relative overflow-hidden bg-cream py-24 md:py-32">
      <div className="relative z-10 mx-auto max-w-[1280px] px-6 text-center md:px-20">
        <Chapter n="08" title="Your turn" className="justify-center" />
        <h2 className="mx-auto mt-5 max-w-[960px] font-display text-[clamp(52px,8vw,128px)] font-extrabold leading-[0.88] tracking-[-0.06em]">
          Saturday&apos;s free.<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-brand">Throw something.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[520px] font-sans text-lg text-ink-2">Free to list. Two free-entry events a month, or paid from ₹99 with 90% to you.</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Button href="/app" size="lg">Start hosting</Button>
          <StoreBadges height={48} />
        </div>
      </div>

      <div className="mt-16 grid gap-4" aria-hidden>
        {[0, 1].map(r => (
          <div key={r} className="group overflow-hidden">
            <div
              className="flex w-max gap-4 group-hover:[animation-play-state:paused]"
              style={{ animation: `marquee ${r ? 46 : 38}s linear infinite`, animationDirection: r ? 'reverse' : 'normal' }}
            >
              {ROW.concat(ROW).map((t, i) => (
                <div
                  key={i}
                  className="relative h-[200px] w-[150px] shrink-0 overflow-hidden rounded-[18px] shadow-soft transition-transform duration-500 ease-out-expo hover:-translate-y-2 hover:rotate-[-3deg] md:h-[260px] md:w-[195px]"
                >
                  <Image src={templateImage(t)} alt="" fill sizes="200px" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
