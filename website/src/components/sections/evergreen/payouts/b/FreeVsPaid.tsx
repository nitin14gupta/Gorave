'use client'

import Image from 'next/image'
import { useState } from 'react'
import { HOST_FEES, inr } from '@/lib/host'
import { cn } from '@/lib/cn'
import { LINKS } from '../data'
import { ArrowLink, EASE_CSS, Head } from '../kit'

type Side = 'free' | 'paid'

const PANELS = {
  free: {
    big: '₹0',
    name: 'Free night',
    tone: 'bg-sage text-sage-ink',
    rows: [
      `Up to ${HOST_FEES.freePerMonth} free-entry events a month`,
      'Guests request to join, you pick who comes',
      'No ticketing, so no payout to set up',
    ],
  },
  paid: {
    big: `${inr(HOST_FEES.minTicket)}+`,
    name: 'Paid night',
    tone: 'bg-blush text-blush-ink',
    rows: [
      `Tickets from ${inr(HOST_FEES.minTicket)}, priced by you`,
      `Guests add the ${inr(HOST_FEES.platformFee)} platform fee on top`,
      '90% to your UPI ID or bank after the event',
    ],
  },
} as const

/**
 * Chapter 02, two kinds of night. Two panels side by side; hover one and it
 * widens, its photos fan out from behind the price, the other steps back.
 * Both sit open on phones.
 */
export function FreeVsPaid({ free, paid }: { free: string[]; paid: string[] }) {
  const [on, setOn] = useState<Side | null>(null)
  const photos = { free, paid }

  return (
    <section className="bg-paper px-6 py-24 md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <Head
          n="04"
          label="Two kinds of night"
          title="Free or paid."
          serif="Both free to list."
          aside={<>Start free, charge when you are ready. Hover a side to see how each one works.</>}
        />

        <div className="mt-14 flex flex-col gap-4 lg:h-[520px] lg:flex-row" onMouseLeave={() => setOn(null)}>
          {(['free', 'paid'] as const).map(k => {
            const d = PANELS[k]
            const active = on === k
            const dim = on !== null && !active
            return (
              <div
                key={k}
                onMouseEnter={() => setOn(k)}
                className={cn('relative overflow-hidden rounded-[36px] p-7 md:p-10 lg:basis-0', d.tone)}
                style={{ flexGrow: active ? 1.6 : dim ? 0.7 : 1, transition: `flex-grow .7s ${EASE_CSS}` }}
              >
                {/* Photos fan out from behind the price */}
                <div className="pointer-events-none absolute right-10 top-10 hidden lg:block" aria-hidden>
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="absolute right-0 top-0 h-[200px] w-[150px] overflow-hidden rounded-[18px] shadow-pop"
                      style={{
                        transform: active ? `translate(${-i * 120}px, ${i * 24}px) rotate(${(i - 1) * 7}deg)` : `translate(0, 0) rotate(${i * 3}deg) scale(.85)`,
                        opacity: active ? 1 : i === 0 ? 0.9 : 0,
                        zIndex: 3 - i,
                        transition: `transform .7s ${EASE_CSS} ${active ? i * 0.06 : 0}s, opacity .5s`,
                      }}
                    >
                      <Image src={photos[k][i % photos[k].length]} alt="" fill sizes="160px" className="object-cover" />
                    </div>
                  ))}
                </div>

                <div className="relative flex h-full flex-col">
                  <div className="font-sans text-xs font-bold uppercase tracking-[0.18em] opacity-70">{d.name}</div>
                  <div
                    className="mt-3 font-display font-extrabold leading-none tracking-[-0.06em]"
                    style={{ fontSize: active ? 'clamp(96px,11vw,170px)' : 'clamp(80px,8vw,130px)', transition: `font-size .6s ${EASE_CSS}` }}
                  >
                    {d.big}
                  </div>
                  <ul className="mt-auto grid gap-2 pt-10">
                    {d.rows.map((r, i) => (
                      <li
                        key={r}
                        className="flex items-center gap-3 rounded-2xl bg-white/55 px-4 py-3 font-sans text-[15px] font-bold"
                        style={{ transform: dim ? 'translateY(8px)' : 'none', opacity: dim ? 0.55 : 1, transition: `all .5s ${EASE_CSS} ${i * 0.04}s` }}
                      >
                        <span className="font-serif text-lg font-normal italic opacity-60">{i + 1}</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
        <ArrowLink href={LINKS.pricing} className="mt-8">How to price your first night</ArrowLink>
      </div>
    </section>
  )
}
