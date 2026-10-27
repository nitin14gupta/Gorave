'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Chapter, StoreBadges } from '@/components/ui/atoms'

/**
 * Chapter 06, deal yourself in. The big round "Host a night" chip sits
 * still (buttons never follow the cursor) and grows a little on hover.
 */
export function HostCtaB({ firstGuide }: { firstGuide: string }) {
  return (
    <section className="relative overflow-hidden bg-noir px-6 py-28 text-noir-ink md:px-20 md:py-40">
      <div className="relative mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <Chapter n="06" title="Deal yourself in" dark />
          <h2 className="mt-4 font-display text-[clamp(52px,7.4vw,124px)] font-extrabold leading-[0.86] tracking-[-0.065em]">
            You&apos;ve read<br />the plays.<br />
            <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">Run one.</span>
          </h2>
          <p className="mt-6 max-w-[460px] font-sans text-lg leading-relaxed text-noir-ink-2">
            Listing is free. Run up to two free-entry events a month, or sell tickets from ₹99 and keep 90%. Payouts go to UPI or your bank.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <Button href="/host" size="lg">Start hosting</Button>
            <Button href={firstGuide} kind="ghost" dark size="lg">Start with play 01</Button>
          </div>
          <div className="mt-8"><StoreBadges height={44} /></div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="relative">
            <Link
              href="/host"
              className="relative grid size-[220px] place-items-center rounded-full bg-brand text-center shadow-[0_30px_80px_-20px_rgb(255_56_100/0.7)] transition-transform duration-500 ease-out-expo hover:scale-105 md:size-[280px]"
            >
              <span className="font-display text-[34px] font-extrabold leading-[0.9] tracking-[-0.04em] text-white md:text-[42px]">
                Host<br />a night →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
