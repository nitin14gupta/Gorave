import type { City } from '@/constants'
import { Button } from '@/components/ui/Button'
import { Chapter, H2 } from '@/components/ui/atoms'
import { TicketCard } from '@/components/ui/TicketCard'
import { Reveal } from '@/components/motion/Reveal'

const FACTS = [['90%', 'of every ticket is yours'], ['2', 'free events every month'], ['₹0', 'to start hosting']]

export function CityHost({ city }: { city: City }) {
  return (
    <section className="bg-blush px-6 py-24 md:px-20 md:py-28">
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <Chapter n="09" title={`Your turn, ${city.name}`} className="!text-blush-ink/70" />
          <H2 className="mb-5 mt-3.5 !text-blush-ink">Your place.<br />Your crowd.</H2>
          <p className="max-w-[480px] font-sans text-lg leading-relaxed text-blush-ink/80">
            Get discovered by people across {city.name}. Approve every guest, set the crowd mix, sell tickets with UPI.
          </p>
          <dl className="my-9 flex flex-wrap gap-x-12 gap-y-6">
            {FACTS.map(([n, l]) => (
              <div key={l}>
                <dt className="font-display text-5xl font-extrabold text-blush-ink">{n}</dt>
                <dd className="font-sans text-sm text-blush-ink/70">{l}</dd>
              </div>
            ))}
          </dl>
          <Button href="/host" kind="ink">Start hosting</Button>
        </Reveal>
        <div className="hidden justify-center lg:flex">
          <TicketCard width={260} backdrop="var(--color-blush)" title={`House party in ${city.areas[0]}`} className="rotate-[6deg]" />
        </div>
      </div>
    </section>
  )
}
