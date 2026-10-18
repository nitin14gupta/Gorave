import Link from 'next/link'
import { SUPPORT_EMAIL } from '@/lib/help'

/** Last block on every help page: a person, the safety page, and 112. */
export function StillStuck() {
  return (
    <section className="bg-cream px-6 pb-24 md:px-12 md:pb-32 lg:px-20">
      <div className="mx-auto grid max-w-[1180px] gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
        <a href={`mailto:${SUPPORT_EMAIL}`} className="group rounded-[28px] bg-brand p-7 text-white transition-transform duration-500 ease-out-expo hover:-translate-y-1 md:p-8">
          <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-white/75">Still stuck?</div>
          <div className="mt-4 font-display text-[clamp(28px,3vw,40px)] font-extrabold leading-tight tracking-[-0.045em]">Write to a real person.</div>
          <div className="mt-6 inline-flex items-center gap-2 font-sans text-[15px] font-bold">
            {SUPPORT_EMAIL} <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
          </div>
        </a>
        <Link href="/safety" className="group rounded-[28px] bg-paper p-7 transition-[transform,background-color] duration-500 ease-out-expo hover:-translate-y-1 hover:bg-white md:p-8">
          <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">Safety</div>
          <div className="mt-4 font-display text-[26px] font-extrabold leading-tight tracking-[-0.04em]">How we keep nights safe</div>
          <div className="mt-6 font-sans text-[15px] font-bold">Read it <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span></div>
        </Link>
        <a href="tel:112" className="group rounded-[28px] bg-blush/70 p-7 transition-transform duration-500 ease-out-expo hover:-translate-y-1 md:p-8">
          <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-blush-ink">Emergency</div>
          <div className="mt-4 font-display text-[26px] font-extrabold leading-tight tracking-[-0.04em]">In danger right now? Call 112.</div>
          <div className="mt-6 font-sans text-[15px] font-bold">Or hold SOS in the app</div>
        </a>
      </div>
    </section>
  )
}
