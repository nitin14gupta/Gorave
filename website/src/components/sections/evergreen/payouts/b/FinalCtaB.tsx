import { Chapter } from '@/components/ui/atoms'
import { LINKS, ONE, rs } from '../data'
import { ArrowLink, CtaRow } from '../kit'
import { Teeth } from './Teeth'

/** Chapter 07, the last word: a blank stub waiting for your first night. Hover it to ink the total. */
export function FinalCtaB() {
  return (
    <section className="overflow-hidden bg-paper px-6 py-24 md:px-20 md:py-32">
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <Chapter n="08" title="Your turn" />
          <h2 className="mt-5 font-display text-[clamp(56px,8.4vw,136px)] font-extrabold leading-[0.86] tracking-[-0.065em]">
            Print your
            <br />
            <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">first payout.</span>
          </h2>
          <p className="mt-6 max-w-[500px] font-sans text-lg text-ink-2">
            List the night for free, set a price or keep it free, and let Gorave handle the money.
          </p>
          <CtaRow className="mt-9" />
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            <ArrowLink href={LINKS.guides}>Read the host guides</ArrowLink>
            <ArrowLink href={LINKS.pricing}>How to price your first night</ArrowLink>
          </div>
        </div>

        <div className="group mx-auto w-full max-w-[360px] rotate-3 transition-transform duration-700 ease-out-expo hover:rotate-0 hover:scale-[1.03]">
          <Teeth flip className="text-white" />
          <div className="bg-white px-7 py-8 font-mono text-ink shadow-pop">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-3">Payout · your first night</div>
            <div className="my-4 border-t border-dashed border-ink/30" />
            <div className="flex justify-between text-sm"><span>Event</span><span className="text-ink-3">yours to name</span></div>
            <div className="mt-2 flex justify-between text-sm"><span>Guests</span><span className="text-ink-3">you pick</span></div>
            <div className="mt-2 flex justify-between text-sm"><span>Your share</span><span>90%</span></div>
            <div className="my-4 border-t border-dashed border-ink/30" />
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-3">You keep</div>
            <div className="mt-1 font-display text-5xl font-extrabold tracking-[-0.05em] text-ink/20 transition-colors duration-700 group-hover:text-ink">
              {rs(ONE.host)}
            </div>
            <div className="mt-1 font-sans text-[12px] text-ink-3">Per {rs(ONE.ticket)} ticket, as an example</div>
          </div>
          <Teeth className="text-white" />
        </div>
      </div>
    </section>
  )
}
