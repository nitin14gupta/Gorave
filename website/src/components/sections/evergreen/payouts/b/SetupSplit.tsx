'use client'

import Image from 'next/image'
import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Phone } from '@/components/ui/Phone'
import { cn } from '@/lib/cn'
import { LINKS, ONE, rs } from '../data'
import { ArrowLink, EASE, Head, Lock, Tick } from '../kit'

const STEPS = [
  { n: '01', title: 'Add a UPI ID', body: 'Type it in and the app verifies it, then shows you the account name so you know the money is going to the right person.' },
  { n: '02', title: 'Or a bank account', body: 'Holder name, account number and IFSC. We look up the bank and branch from the IFSC so you can check them at a glance.' },
  { n: '03', title: 'Locked to you', body: 'Payout details are encrypted. One UPI ID or bank account can be linked to only one Gorave account.' },
  { n: '04', title: 'Host, then get paid', body: 'After the event, Gorave sends your 90% to the account you added. No chasing guests for money.' },
]

/**
 * Chapter 03, set up once. Sticky split on desktop: the phone holds still
 * on the left and swaps screens as each step scrolls past on the right.
 * On phones each step carries its own screen.
 */
export function SetupSplit({ cover }: { cover: string }) {
  const [on, setOn] = useState(0)

  return (
    <section className="bg-cream px-6 py-24 md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <Head n="05" label="Set up once" title="Tell us where." serif="We do the rest." />

        <div className="mt-10 grid gap-16 lg:grid-cols-[1fr_1fr]">
          <div className="hidden lg:block">
            <div className="sticky top-[12vh] flex h-[76vh] items-center justify-center">
              <div className="absolute size-[440px] rounded-full bg-sky" aria-hidden />
              <div className="absolute ml-56 mt-64 size-40 rounded-full bg-blush" aria-hidden />
              <Phone width={290} className="relative">
                <div className="absolute inset-0 bg-paper">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={on}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="absolute inset-0 px-4 pb-6 pt-14"
                    >
                      <Screen i={on} cover={cover} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </Phone>
            </div>
          </div>

          <ol>
            {STEPS.map((s, i) => (
              <motion.li
                key={s.n}
                onViewportEnter={() => setOn(i)}
                viewport={{ amount: 0.6 }}
                className="flex flex-col justify-center py-10 lg:min-h-[70vh] lg:py-0"
              >
                <div className={cn('transition-opacity duration-500', on === i ? 'lg:opacity-100' : 'lg:opacity-30')}>
                  <div className="font-serif text-3xl italic text-orange">{s.n}</div>
                  <h3 className="mt-2 font-display text-[clamp(32px,3.6vw,52px)] font-extrabold leading-[0.95] tracking-[-0.05em]">{s.title}</h3>
                  <p className="mt-3 max-w-[460px] font-sans text-lg leading-relaxed text-ink-2">{s.body}</p>
                  {i === 2 && <ArrowLink href={LINKS.safety} className="mt-5">How Gorave keeps nights safe</ArrowLink>}
                </div>
                <div className="mt-6 max-w-[360px] rounded-[28px] bg-paper p-4 pt-5 shadow-soft lg:hidden">
                  <Screen i={i} cover={cover} />
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function Screen({ i, cover }: { i: number; cover: string }) {
  if (i === 0)
    return (
      <Frame title="Payout details">
        <Field label="UPI ID" value="yourname@bank" />
        <Ok title="UPI ID verified" body="Account name shows here" />
        <Btn>Save</Btn>
      </Frame>
    )
  if (i === 1)
    return (
      <Frame title="Payout details">
        <Field label="Account holder" value="As on your bank" muted />
        <Field label="Account number" value="•••• •••• 4821" />
        <Field label="IFSC" value="ABCD0123456" />
        <Ok title="Bank and branch found" body="Looked up from the IFSC" />
      </Frame>
    )
  if (i === 2)
    return (
      <Frame title="Payout details">
        <div className="grid place-items-center rounded-2xl bg-sage px-4 py-6 text-center text-sage-ink">
          <span className="grid size-12 place-items-center rounded-full bg-white"><Lock /></span>
          <div className="mt-3 font-display text-lg font-extrabold tracking-[-0.03em]">Encrypted</div>
          <div className="font-sans text-[12px] leading-snug">Your details are stored securely</div>
        </div>
        <div className="rounded-2xl bg-white p-3 font-sans text-[12px] leading-snug text-ink-2 shadow-soft">
          <span className="font-bold text-ink">One account, one host.</span> This UPI ID or bank account can only be linked to your Gorave account.
        </div>
      </Frame>
    )
  return (
    <Frame title="Payouts">
      <div className="overflow-hidden rounded-2xl bg-white shadow-soft">
        <div className="relative h-24">
          <Image src={cover} alt="" fill sizes="280px" className="object-cover" />
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 font-sans text-[10px] font-bold text-ink">Event ended</span>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">
            Payout sent <Tick />
          </div>
          <div className="mt-1 font-display text-3xl font-extrabold tracking-[-0.05em] tabular-nums">{rs(ONE.host)}</div>
          <div className="font-sans text-[11px] text-ink-3">Example: one {rs(ONE.ticket)} ticket</div>
        </div>
      </div>
      <div className="grid gap-1 rounded-2xl bg-white p-3 font-sans text-[12px] shadow-soft">
        <div className="flex justify-between"><span className="text-ink-2">Your share</span><span className="font-bold">90%</span></div>
        <div className="flex justify-between"><span className="text-ink-2">Sent to</span><span className="font-bold">UPI ID or bank</span></div>
        <div className="flex justify-between"><span className="text-ink-2">When</span><span className="font-bold">After the event</span></div>
      </div>
    </Frame>
  )
}

function Frame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-2.5">
      <div className="mb-1 font-display text-[22px] font-extrabold tracking-[-0.04em] text-ink">{title}</div>
      {children}
    </div>
  )
}

function Field({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2">
      <div className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">{label}</div>
      <div className={cn('truncate font-sans text-[14px] font-bold', muted ? 'text-ink-3' : 'text-ink')}>{value}</div>
    </div>
  )
}

function Ok({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 ring-1 ring-green/30">
      <Tick />
      <div>
        <div className="font-sans text-[13px] font-bold text-ink">{title}</div>
        <div className="font-sans text-[11px] text-ink-3">{body}</div>
      </div>
    </div>
  )
}

function Btn({ children }: { children: ReactNode }) {
  return <div className="mt-1 grid place-items-center rounded-full bg-brand py-2.5 font-sans text-sm font-bold text-white">{children}</div>
}
