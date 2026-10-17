'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { AVATARS, PHOTOS, type SampleEvent } from '@/constants'
import { Chapter, StoreBadges } from '@/components/ui/atoms'
import { TicketCard } from '@/components/ui/TicketCard'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'
import { cn } from '@/lib/cn'
import { ScanCard } from '../ScanCard'

// On touch screens there's no hover, so every reveal shows its open state.
const OPEN = '[@media(hover:none)]:'

function Tile({ className, title, body, art, href, dark }: { className?: string; title: string; body: string; art: ReactNode; href?: string; dark?: boolean }) {
  const inner = (
    <>
      <div className="relative min-h-[220px] flex-1">{art}</div>
      <div className="relative z-10 mt-5">
        <h3 className={cn('font-display text-[28px] font-extrabold leading-[1] tracking-[-0.04em]', dark ? 'text-white' : 'text-ink')}>{title}</h3>
        <p className={cn('mt-2 max-w-[400px] font-sans text-[15px] leading-relaxed', dark ? 'text-white/85' : 'text-ink-2')}>{body}</p>
      </div>
    </>
  )
  const cls = cn(
    'group relative flex h-full flex-col overflow-hidden rounded-[30px] p-6 transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1.5 hover:shadow-pop md:p-7',
    className,
  )
  return href ? <Link href={href} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>
}

const WAVE = [14, 26, 38, 22, 46, 30, 54, 34, 20, 42, 58, 36, 24, 50, 32, 18, 40, 52, 28, 16, 36, 24, 44, 30, 18, 38, 26, 14]

/**
 * Chapter 02, the rest of the app. A bento of the real features; every tile
 * hides a second beat that slides out when you hover it (and simply shows
 * on touch screens). Ends on the mid-page download strip.
 */
export function Bento({ events }: { events: SampleEvent[] }) {
  const thumbs = events.slice(0, 3)
  return (
    <section className="bg-cream px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-[1320px]">
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Chapter n="03" title="Everything else" />
            <h2 className="mt-4 font-display text-[clamp(46px,6vw,88px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
              Small things that<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-orange">make the night.</span>
            </h2>
          </div>
          <p className="max-w-[360px] font-sans text-lg leading-relaxed text-ink-2">Hover around. Everything here is in the app today, on iPhone and Android.</p>
        </Reveal>

        <Stagger className="mt-14 grid auto-rows-[minmax(340px,auto)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Closest first */}
          <StaggerItem className="sm:col-span-2">
            <Tile
              className="bg-white"
              title="Closest first."
              body="Pick your city and the nearest nights rise to the top. Filter by free, tonight, weekend or vibe."
              art={
                <div className="absolute inset-0">
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Free', 'Tonight', 'Weekend', 'Vibe'].map((c, i) => (
                      <span
                        key={c}
                        className={cn(
                          'rounded-full px-3.5 py-2 font-sans text-[13px] font-bold transition-all duration-500 ease-out-expo',
                          i === 0 ? `bg-ink text-cream group-hover:bg-tile group-hover:text-ink-2 ${OPEN}bg-tile ${OPEN}text-ink-2` : 'bg-tile text-ink-2',
                          i === 1 && `group-hover:bg-ink group-hover:text-cream ${OPEN}bg-ink ${OPEN}text-cream`,
                        )}
                        style={{ transitionDelay: `${i * 40}ms` }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="absolute right-0 top-[64px] h-[150px] w-[150px]">
                    {thumbs.map((e, i) => (
                      <div
                        key={e.id}
                        className={cn(
                          'absolute right-0 top-0 w-[150px] overflow-hidden rounded-2xl bg-cream shadow-soft transition-[translate,rotate] duration-700 ease-out-expo',
                          '[translate:var(--ix)_0] group-hover:[translate:var(--hx)_0] group-hover:!rotate-0',
                          i < 2 && 'hidden sm:block',
                        )}
                        style={{ ['--ix' as string]: `${(i - 2) * 14}px`, ['--hx' as string]: `${(i - 2) * 166}px`, rotate: `${(i - 2) * 4}deg`, transitionDelay: `${(2 - i) * 60}ms`, zIndex: i }}
                      >
                        <div className="relative h-[90px]"><Image src={e.image ?? PHOTOS[e.photo]} alt="" fill sizes="300px" className="object-cover" /></div>
                        <div className="p-2.5">
                          <div className="line-clamp-1 font-display text-[13px] font-extrabold">{e.title}</div>
                          <div className="line-clamp-1 font-sans text-[11px] text-ink-3">{e.area} · {e.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              }
            />
          </StaggerItem>

          {/* 2. Verified */}
          <StaggerItem>
            <Tile
              className="bg-tile"
              title="Real people only."
              body="Every guest is phone-verified and 18+."
              art={
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-[132px] font-extrabold leading-none tracking-[-0.06em] text-ink transition-transform duration-700 ease-out-expo group-hover:-translate-y-3 group-hover:scale-90">18+</span>
                  <span className={cn(
                    'absolute right-2 top-4 flex size-[92px] items-center justify-center rounded-full bg-green text-center font-sans text-[11px] font-bold uppercase leading-tight tracking-[0.08em] text-white shadow-pop',
                    'rotate-[-30deg] scale-0 transition-transform duration-700 ease-out-expo group-hover:rotate-[12deg] group-hover:scale-100',
                    `${OPEN}rotate-[12deg] ${OPEN}scale-100`,
                  )}>
                    Phone<br />verified
                  </span>
                </div>
              }
            />
          </StaggerItem>

          {/* 3. Crowd mix */}
          <StaggerItem>
            <Tile
              className="bg-blush"
              title="Hosts set the crowd."
              body="A crowd mix like women-only or 50:50, plus an age gate."
              art={
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform duration-700 ease-out-expo group-hover:-translate-y-full">
                    <div className="font-display text-[96px] font-extrabold leading-none tracking-[-0.05em] text-blush-ink">50<span className="text-brand">:</span>50</div>
                    <div className="mt-1 font-sans text-sm font-bold text-blush-ink/70">hover for another</div>
                  </div>
                  <div className="absolute inset-0 flex translate-y-full flex-col items-center justify-center transition-transform duration-700 ease-out-expo group-hover:translate-y-0">
                    <div className="font-serif text-[60px] italic leading-none text-blush-ink">Women-only</div>
                    <div className="mt-3 flex gap-1.5">
                      {['18+', '21+', '25+'].map((a, i) => (
                        <span key={a} className={cn('rounded-full px-3 py-1 font-sans text-xs font-bold', i === 1 ? 'bg-blush-ink text-blush' : 'bg-white/70 text-blush-ink')}>{a}</span>
                      ))}
                    </div>
                  </div>
                </div>
              }
            />
          </StaggerItem>

          {/* 4. Voice intro */}
          <StaggerItem className="sm:col-span-2">
            <Tile
              className="bg-sky"
              title="Say hi before you show up."
              body="Profiles have photos and a 30-second voice intro, so the host and the room know who's coming."
              art={
                <div className="absolute inset-0 flex items-center gap-5">
                  <div className="relative size-[110px] shrink-0 overflow-hidden rounded-full shadow-soft transition-transform duration-700 ease-out-expo group-hover:scale-105">
                    <Image src={AVATARS[0]} alt="" fill sizes="220px" className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex h-[64px] items-center gap-[4px]">
                      {WAVE.map((h, i) => (
                        <span
                          key={i}
                          className={cn('w-[5px] origin-center scale-y-[0.35] rounded-full bg-sky-ink/25 transition-[transform,background-color] duration-500 ease-out-expo group-hover:scale-y-100 group-hover:bg-sky-ink', `${OPEN}scale-y-100 ${OPEN}bg-sky-ink`, i > 22 && 'hidden sm:block')}
                          style={{ height: h, transitionDelay: `${i * 18}ms` }}
                        />
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-2 font-sans text-xs font-bold text-sky-ink/70">
                      <span className="flex size-6 items-center justify-center rounded-full bg-sky-ink text-[9px] text-sky">▶</span>
                      Voice intro · 0:30
                    </div>
                  </div>
                </div>
              }
            />
          </StaggerItem>

          {/* 5. Vibers / Vibing */}
          <StaggerItem>
            <Tile
              className="bg-sage"
              title="Vibers and Vibing."
              body="People who follow you are your Vibers. People you follow, you're Vibing."
              art={
                <div className="absolute inset-0 flex flex-col justify-center gap-3">
                  <div className="flex items-center gap-2 transition-transform duration-700 ease-out-expo group-hover:translate-x-6">
                    <span className="rounded-full bg-sage-ink px-4 py-2.5 font-display text-xl font-extrabold text-sage">Vibers</span>
                    <span className="font-sans text-sm font-bold text-sage-ink/70">→ you</span>
                  </div>
                  <div className="flex items-center gap-2 transition-transform duration-700 ease-out-expo group-hover:-translate-x-1">
                    <span className="font-sans text-sm font-bold text-sage-ink/70">you →</span>
                    <span className="rounded-full bg-white px-4 py-2.5 font-display text-xl font-extrabold text-sage-ink">Vibing</span>
                  </div>
                </div>
              }
            />
          </StaggerItem>

          {/* 6. SOS */}
          <StaggerItem>
            <Tile
              className="bg-white"
              title="SOS, one tap."
              body="Shares your live location with up to 5 emergency contacts."
              art={
                <div className="absolute inset-0 flex items-center justify-center">
                  {[0, 1, 2, 3, 4].map(i => {
                    const a = (i / 5) * Math.PI * 2 - Math.PI / 2
                    const x = Math.round(Math.cos(a) * 92)
                    const y = Math.round(Math.sin(a) * 82)
                    return (
                      <span
                        key={i}
                        className={cn(
                          'absolute size-10 overflow-hidden rounded-full opacity-0 ring-2 ring-coral transition-[transform,opacity] duration-700 ease-out-expo',
                          '[transform:translate(0px,0px)_scale(0.4)] group-hover:opacity-100 group-hover:[transform:translate(var(--tx),var(--ty))_scale(1)]',
                          `${OPEN}opacity-100 ${OPEN}[transform:translate(var(--tx),var(--ty))_scale(1)]`,
                        )}
                        style={{ ['--tx' as string]: `${x}px`, ['--ty' as string]: `${y}px`, transitionDelay: `${i * 50}ms` }}
                      >
                        <Image src={AVATARS[(i + 1) % AVATARS.length]} alt="" width={40} height={40} sizes="80px" className="size-full object-cover" />
                      </span>
                    )
                  })}
                  <span className="relative flex size-[96px] items-center justify-center rounded-full bg-coral font-display text-[28px] font-extrabold text-white shadow-[0_20px_40px_-14px_rgb(255_56_100/0.7)] transition-transform duration-500 ease-out-expo group-hover:scale-90">SOS</span>
                </div>
              }
            />
          </StaggerItem>

          {/* 7. Pay */}
          <StaggerItem className="sm:col-span-2">
            <Tile
              className="bg-tile"
              title="UPI in, ticket out."
              body="Paid events book instantly with UPI or the Gorave Wallet. One flat ₹50 platform fee, and your QR ticket lands straight away."
              art={
                <div className="absolute inset-0">
                  <div className="flex flex-wrap gap-2">
                    {['GPay', 'PhonePe', 'Paytm', 'Gorave Wallet'].map(a => (
                      <span key={a} className="rounded-xl bg-white px-3.5 py-2.5 font-sans text-[13px] font-bold text-ink shadow-[0_1px_0_rgb(23_19_16/0.06)]">{a}</span>
                    ))}
                  </div>
                  <div className="mt-5 inline-flex items-baseline gap-2 rounded-2xl bg-white/70 px-4 py-3">
                    <span className="font-display text-[44px] font-extrabold leading-none tracking-[-0.04em]">₹50</span>
                    <span className="font-sans text-sm font-bold text-ink-2">flat platform fee</span>
                  </div>
                  <div className={cn(
                    'absolute -top-2 right-0 hidden translate-x-[38%] rotate-[16deg] transition-[translate,rotate] duration-700 ease-out-expo group-hover:translate-x-0 group-hover:rotate-[5deg] sm:block',
                    `${OPEN}translate-x-0`,
                  )}>
                    <TicketCard width={168} backdrop="var(--color-tile)" />
                  </div>
                </div>
              }
            />
          </StaggerItem>

          {/* 8. Host */}
          <StaggerItem className="sm:col-span-2">
            <Tile
              href="/host"
              dark
              className="bg-brand"
              title="Host your own. →"
              body="Listing is free, with 2 free-entry events a month. Paid tickets start at ₹99 and you keep 90%."
              art={
                <div className="absolute inset-0 grid grid-cols-2 gap-3">
                  {[
                    ['Free', 'to list'],
                    ['2', 'free-entry events a month'],
                    ['₹99', 'tickets from'],
                    ['90%', 'yours to keep'],
                  ].map(([big, small], i) => (
                    <div
                      key={small}
                      className={cn('flex flex-col justify-end rounded-2xl bg-white/14 p-4 backdrop-blur-sm transition-transform duration-700 ease-out-expo', i % 2 ? 'group-hover:translate-y-2' : 'group-hover:-translate-y-2')}
                      style={{ transitionDelay: `${i * 50}ms` }}
                    >
                      <div className="font-display text-[clamp(30px,3.4vw,46px)] font-extrabold leading-none tracking-[-0.04em] text-white">{big}</div>
                      <div className="mt-1 font-sans text-[13px] font-bold text-white/80">{small}</div>
                    </div>
                  ))}
                </div>
              }
            />
          </StaggerItem>
        </Stagger>

        {/* Mid-page download strip */}
        <Reveal className="mt-6">
          <div className="flex flex-col items-start justify-between gap-6 rounded-[30px] bg-paper p-7 shadow-soft md:flex-row md:items-center md:p-9">
            <div>
              <div className="font-display text-[clamp(30px,3.4vw,46px)] font-extrabold leading-[0.95] tracking-[-0.045em]">All of it, in your pocket.</div>
              <div className="mt-2 font-sans text-[15px] text-ink-2">On iPhone and Android. Tap a badge, or scan on a computer.</div>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <StoreBadges height={50} />
              <ScanCard />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
