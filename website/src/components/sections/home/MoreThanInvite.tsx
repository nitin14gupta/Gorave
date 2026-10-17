import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { AVATARS } from '@/constants'
import { Button } from '@/components/ui/Button'
import { H2, Lede } from '@/components/ui/atoms'
import { Phone } from '@/components/ui/Phone'
import { TicketCard } from '@/components/ui/TicketCard'
import { LockScreen } from '@/components/ui/LockScreen'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'

const REQUESTS = [['Riya', '3 mutual'], ['Arjun', 'Came to your events'], ['Dia', '5 events attended']]

const TILES: { caption: string; href?: string; art: ReactNode }[] = [
  {
    caption: 'Sell tickets.',
    href: '/host/payouts',
    // Two fanned tickets, a hint that it's a guest list, not one invite
    art: (
      <div className="relative h-[330px] w-[230px]">
        <TicketCard width={190} backdrop="var(--color-tile)" title="Indie Gig at the Loft" date="Thursday, 16 October" time="8:00 PM IST" className="absolute left-0 top-4 rotate-[-12deg] opacity-90" />
        <TicketCard width={190} backdrop="var(--color-tile)" className="absolute right-0 top-0 rotate-[6deg]" />
      </div>
    ),
  },
  {
    caption: 'Set the crowd mix.',
    href: '/host/guides/crowd-mix',
    art: (
      <div className="text-center">
        <div className="font-display text-[120px] font-extrabold leading-none tracking-[-0.04em]">50<span className="text-brand">:</span>50</div>
        <div className="mt-2 font-sans font-bold text-ink-2">4 women · 5 men · 1 open</div>
      </div>
    ),
  },
  {
    caption: 'Approve every guest.',
    art: (
      <div className="flex w-[260px] flex-col gap-2.5">
        {REQUESTS.map(([name, signal], j) => (
          <div key={name} className="flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-3 shadow-soft">
            <Image src={AVATARS[j + 2]} alt="" width={32} height={32} sizes="64px" className="size-8 rounded-full object-cover" />
            <div className="flex-1">
              <div className="font-sans text-sm font-bold">{name}</div>
              <div className="font-sans text-[11px] text-green">{signal}</div>
            </div>
            <span className="flex size-7 items-center justify-center rounded-full bg-ink text-[13px] text-white">✓</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    caption: 'Reminders, automatically.',
    art: (
      <Phone width={185} className="rotate-[8deg] translate-y-6">
        <LockScreen />
      </Phone>
    ),
  },
]

export function MoreThanInvite() {
  return (
    <section className="bg-cream px-6 py-28 md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <H2 className="!text-[clamp(48px,6.4vw,90px)]">More than<br />an invite</H2>
            <Lede className="mt-3.5 !text-[22px]">Everything you need to build a community.</Lede>
          </div>
          <div className="flex gap-2.5">
            <Button href="/host" kind="ghost">For hosts</Button>
            <Button href="/app" kind="ink">Get the app</Button>
          </div>
        </Reveal>
        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TILES.map(t => (
            <StaggerItem key={t.caption}>
              <div className="flex h-[380px] items-center justify-center overflow-hidden rounded-3xl bg-tile transition-transform duration-500 ease-out-expo hover:-translate-y-1.5">
                {t.art}
              </div>
              <p className="mt-4 font-sans text-[21px] text-ink-2">
                {t.caption}{' '}
                {t.href && <Link href={t.href} className="text-ink underline underline-offset-4">Learn more</Link>}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
