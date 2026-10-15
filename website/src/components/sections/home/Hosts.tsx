import Image from 'next/image'
import { BRAND } from '@/constants'
import { Button } from '@/components/ui/Button'
import { Eyebrow, H2 } from '@/components/ui/atoms'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'

// Facts only — these mirror the app's real rules (client/src/constants/fees.ts,
// server free-event limit, host badge tiers).
const STATS = [['90%', 'of every ticket is yours'], ['2', 'free events every month'], ['₹0', 'to start hosting']]
const BADGES = [
  { key: 'rising', name: 'Rising', at: '2+ events', tilt: -3 },
  { key: 'established', name: 'Established', at: '10+', tilt: 2 },
  { key: 'elite', name: 'Elite', at: '25+', tilt: 2 },
  { key: 'legend', name: 'Legend', at: '75+', tilt: -2 },
] as const

export function Hosts() {
  return (
    <section className="bg-blush px-6 py-28 md:px-20 md:py-32">
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
        <Reveal>
          <Eyebrow className="!text-blush-ink">For hosts</Eyebrow>
          <H2 className="mb-5 mt-3.5 !text-blush-ink">Throw it.<br />Fill it.<br />Get paid.</H2>
          <p className="max-w-[480px] font-sans text-lg leading-relaxed text-blush-ink/80">
            Sell tickets with UPI, set the crowd mix and approve every guest. Your payout lands in your UPI or bank account after the event.
          </p>
          <dl className="my-9 flex flex-wrap gap-x-12 gap-y-6">
            {STATS.map(([n, l]) => (
              <div key={l}>
                <dt className="font-display text-5xl font-extrabold text-blush-ink">{n}</dt>
                <dd className="font-sans text-sm text-blush-ink/70">{l}</dd>
              </div>
            ))}
          </dl>
          <Button href="/host" kind="ink">Become a host</Button>
        </Reveal>

        <Stagger className="grid grid-cols-2 gap-4.5">
          {BADGES.map(b => (
            <StaggerItem key={b.key}>
              <div
                className="rounded-[28px] bg-white/55 p-6 text-center transition-transform duration-500 ease-out-expo hover:-translate-y-1.5 hover:rotate-0"
                style={{ rotate: `${b.tilt}deg` }}
              >
                <Image src={BRAND.badges[b.key]} alt={`${b.name} host badge`} width={110} height={110} className="mx-auto size-[110px] object-contain" />
                <div className="font-display text-[22px] font-extrabold text-blush-ink">{b.name}</div>
                <div className="font-sans text-[13px] text-blush-ink/70">{b.at} hosted</div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
