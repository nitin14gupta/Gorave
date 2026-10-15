import type { ReactNode } from 'react'
import { SAMPLE_EVENTS } from '@/constants'
import { H2, Lede } from '@/components/ui/atoms'
import { InviteCard } from '@/components/ui/InviteCard'
import { TicketCard } from '@/components/ui/TicketCard'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'

const STEPS: { n: string; title: string; body: string; art: ReactNode }[] = [
  {
    n: '01',
    title: 'Find your night',
    body: 'Browse by vibe, date or price. Closest to you first.',
    art: <InviteCard event={SAMPLE_EVENTS[1]} width={240} tilt={-3} />,
  },
  {
    n: '02',
    title: 'Request or book',
    body: 'Free events are host-approved so the crowd stays right. Paid ones book in a tap with UPI.',
    art: (
      <div className="w-[260px] rotate-2 rounded-[22px] bg-noir p-4 text-noir-ink shadow-pop">
        <div className="font-sans text-xs text-noir-ink-2">gorave · now</div>
        <div className="mt-1 font-display text-lg font-extrabold">You&apos;re in!</div>
        <div className="mt-1 font-sans text-[13px] text-noir-ink-2">Your request for Bollywood Retro Night was accepted. Ticket ready.</div>
      </div>
    ),
  },
  {
    n: '03',
    title: 'Show up, scan in',
    body: "The exact address unlocks once you're in. Your QR ticket gets you through the door.",
    art: <TicketCard width={210} className="-rotate-[7deg]" />,
  },
]

export function OneLink() {
  return (
    <section className="bg-cream px-6 py-28 md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <Reveal className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <H2>One link.<br />Everyone&apos;s in.</H2>
          <Lede className="max-w-[380px]">No more &ldquo;who&apos;s coming?&rdquo; in the group chat. Gorave handles the guest list, the money and the door.</Lede>
        </Reveal>
        <Stagger className="grid border-t-[1.5px] border-ink md:grid-cols-3">
          {STEPS.map((s, i) => (
            <StaggerItem key={s.n} className={i ? 'border-ink md:border-l-[1.5px]' : ''}>
              <div className="px-0 pt-8 md:px-7">
                <div className="font-serif text-[40px] italic text-orange">{s.n}</div>
                <h3 className="mt-2 font-display text-[32px] font-extrabold tracking-[-0.03em]">{s.title}</h3>
                <p className="min-h-20 font-sans text-base leading-relaxed text-ink-2">{s.body}</p>
                <div className="flex h-[330px] items-center justify-center">{s.art}</div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
