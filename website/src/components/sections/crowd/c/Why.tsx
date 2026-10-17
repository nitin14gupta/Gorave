'use client'

import Image from 'next/image'
import { useState } from 'react'
import { AREA_SCENES } from '@/lib/area'
import type { CrowdContent } from '@/lib/crowd'
import { Chapter } from '@/components/ui/atoms'
import { EASE_CSS, Rise } from './kit'

/**
 * Chapter 03, the reasons. Four full-bleed photo panels side by side; hover
 * (or tap, or tab to) one and it opens wide while the others fold to slivers.
 */
export function Why({ crowd, chapter = '03' }: { crowd: CrowdContent; chapter?: string }) {
  const [active, setActive] = useState(0)
  // The street scenes have men in them, so a women-only page stays on its own photo, cropped differently.
  const images =
    crowd.slug === 'women-only'
      ? [{ src: crowd.image, pos: '50% 50%' }, { src: AREA_SCENES.building, pos: '50% 50%' }, { src: crowd.image, pos: '88% 72%' }, { src: crowd.image, pos: '8% 62%' }]
      : [{ src: crowd.image, pos: '50% 50%' }, { src: AREA_SCENES.rooftop, pos: '50% 50%' }, { src: AREA_SCENES.livingroom, pos: '50% 50%' }, { src: AREA_SCENES.doorway, pos: '50% 50%' }]

  return (
    <section className="bg-paper px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Chapter n={chapter} title="The reasons" />
            <h2 className="mt-4 font-display text-[clamp(44px,6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
              Why people pick
              <br />
              <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">{crowd.nights}.</span>
            </h2>
          </div>
          <p className="hidden max-w-[300px] font-sans text-base text-ink-3 md:block">Hover a panel to open it.</p>
        </div>

        {/* Desktop: the accordion */}
        <div className="mt-14 hidden h-[min(76vh,700px)] gap-3 md:flex">
          {crowd.why.map((w, i) => {
            const on = active === i
            return (
              <button
                key={w.title}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-expanded={on}
                className="group relative min-w-0 overflow-hidden rounded-[28px] bg-noir text-left text-noir-ink outline-none focus-visible:ring-4 focus-visible:ring-orange/60"
                style={{ flexGrow: on ? 5 : 1, flexBasis: 0, transition: `flex-grow .8s ${EASE_CSS}` }}
              >
                <Rise className="absolute inset-0" delay={i * 0.08} y={60}>
                  <Image
                    src={images[i].src}
                    alt=""
                    fill
                    sizes="(max-width: 1400px) 60vw, 840px"
                    className="object-cover"
                    style={{ objectPosition: images[i].pos, transform: `scale(${on ? 1 : 1.18})`, transition: `transform 1.1s ${EASE_CSS}` }}
                  />
                </Rise>
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-noir via-noir/45 to-noir/10" />
                <div aria-hidden className="absolute inset-0 bg-noir/45" style={{ opacity: on ? 0 : 1, transition: `opacity .6s ${EASE_CSS}` }} />

                <div className="absolute left-6 top-6 font-serif text-2xl italic text-orange">0{i + 1}</div>

                {/* Folded: the title runs up the sliver */}
                <div
                  className="absolute bottom-7 left-1/2 origin-center whitespace-nowrap font-display text-2xl font-extrabold tracking-[-0.03em] [writing-mode:vertical-rl]"
                  style={{ transform: 'translateX(-50%) rotate(180deg)', opacity: on ? 0 : 1, transition: `opacity .4s ${EASE_CSS}` }}
                >
                  {w.title}
                </div>

                {/* Open: title and body, fixed width so nothing reflows while it opens */}
                <div
                  className="absolute bottom-0 left-0 w-[min(520px,44vw)] p-9"
                  style={{
                    opacity: on ? 1 : 0,
                    transform: `translateY(${on ? 0 : 24}px)`,
                    transition: `opacity .5s ${EASE_CSS} ${on ? '.25s' : '0s'}, transform .7s ${EASE_CSS} ${on ? '.2s' : '0s'}`,
                  }}
                >
                  <div className="font-display text-[clamp(32px,3.2vw,48px)] font-extrabold leading-[0.98] tracking-[-0.045em]">{w.title}</div>
                  <p className="mt-3 max-w-[420px] font-sans text-lg leading-relaxed text-noir-ink/85">{w.body}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Mobile: stacked, every panel open */}
        <div className="mt-10 grid gap-4 md:hidden">
          {crowd.why.map((w, i) => (
            <Rise key={w.title} y={30}>
              <div className="relative min-h-[420px] overflow-hidden rounded-[26px] bg-noir text-noir-ink">
                <Image src={images[i].src} alt="" fill sizes="100vw" className="object-cover" style={{ objectPosition: images[i].pos }} />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-noir via-noir/50 to-noir/5" />
                <div className="absolute left-5 top-5 font-serif text-2xl italic text-orange">0{i + 1}</div>
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="font-display text-[32px] font-extrabold leading-none tracking-[-0.045em]">{w.title}</div>
                  <p className="mt-2.5 font-sans text-base leading-relaxed text-noir-ink/85">{w.body}</p>
                </div>
              </div>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  )
}
