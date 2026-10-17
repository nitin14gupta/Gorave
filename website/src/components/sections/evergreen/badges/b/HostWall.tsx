'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import type { BadgeTier } from '@/lib/pagesData'
import { AvatarImage } from '@/components/ui/AvatarImage'
import { BadgeArt, EASE, Head, MeetHosts, TIER_LOOK, hostName } from '../kit'

/**
 * Chapter 03, the wall. Up to four real hosts per badge, from the top shelf
 * down, as compact cards with the square profile photo the app uses. Every shelf keeps one open place; a shelf nobody has
 * reached yet is all open place.
 */
export function HostWall({ tiers }: { tiers: BadgeTier[] }) {
  const reduce = !!useReducedMotion()
  const shelves = [...tiers].reverse()

  return (
    <section className="bg-cream px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-[1280px]">
        <Head n="04" label="The wall" title="Who holds" serif="which card." aside="Real hosts and the badge they hold right now, top shelf first. Tap anyone to see their profile." />

        <div className="mt-14 grid gap-14 md:gap-20">
          {shelves.map(t => {
            const look = TIER_LOOK[t.key]
            const empty = t.hosts.length === 0
            return (
              <div key={t.key}>
                <div className="flex items-center gap-4 border-b border-ink/10 pb-5">
                  <BadgeArt tier={t.key} size={60} />
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-base italic text-orange">{t.at}+ events hosted</div>
                    <div className="font-display text-[clamp(32px,3.6vw,48px)] font-extrabold leading-none tracking-[-0.045em]">{t.name}</div>
                  </div>
                  <div className="hidden max-w-[300px] text-right font-sans text-[15px] text-ink-2 md:block">{look.line}</div>
                </div>

                {empty ? (
                  <Link
                    href="/host"
                    className="group mt-6 flex flex-col items-start gap-5 rounded-[28px] border-2 border-dashed p-6 transition-colors duration-500 hover:bg-white/50 md:flex-row md:items-center md:p-8"
                    style={{ borderColor: `${look.color}55`, background: `${look.tint}88` }}
                  >
                    <div className="relative size-20 shrink-0 opacity-40 grayscale transition-[filter,opacity,transform] duration-700 ease-out-expo group-hover:rotate-[-8deg] group-hover:scale-110 group-hover:opacity-100 group-hover:grayscale-0">
                      <BadgeArt tier={t.key} size={80} />
                    </div>
                    <div className="flex-1">
                      <div className="font-display text-[clamp(26px,2.6vw,36px)] font-extrabold leading-tight tracking-[-0.04em]">Unclaimed. Nobody holds {t.name} yet.</div>
                      <p className="mt-1 font-sans text-[16px] text-ink-2">Reach {t.at} hosted events and you would be the first one on this shelf.</p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-sans text-[15px] font-bold text-cream transition-transform duration-300 group-hover:-translate-y-0.5">
                      Start hosting ↗
                    </span>
                  </Link>
                ) : (
                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {t.hosts.slice(0, 4).map((h, i) => (
                      <motion.div
                        key={h.username}
                        initial={reduce ? false : { opacity: 0, y: 30, rotate: i % 2 ? 1.5 : -1.5 }}
                        whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.7, ease: EASE, delay: (i % 4) * 0.07 }}
                      >
                        <Link href={`/h/${h.username}`} className="group flex items-center gap-3.5 rounded-[22px] bg-white p-3 shadow-soft transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:shadow-pop">
                          <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-2xl bg-tile">
                            <AvatarImage src={h.avatar} name={hostName(h)} sizes="64px" initialClassName="text-2xl" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-display text-lg font-extrabold leading-tight tracking-[-0.03em]">{hostName(h)}</div>
                            <div className="mt-0.5 font-sans text-[13px] text-ink-3">
                              {h.hosted_count} hosted{h.review_count > 0 && h.avg_rating ? ` · ★ ${h.avg_rating}` : ''}
                            </div>
                            {h.areas[0] && <div className="truncate font-sans text-xs font-bold text-ink-2">{h.areas[0]}</div>}
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                    <Link
                      href="/host"
                      className="group flex items-center gap-3.5 rounded-[22px] border-2 border-dashed p-3 transition-colors duration-500 hover:bg-white/50"
                      style={{ borderColor: `${look.color}55` }}
                    >
                      <div className="grid aspect-square w-16 shrink-0 place-items-center rounded-2xl border-2 border-dashed font-display text-2xl font-extrabold transition-transform duration-500 ease-out-expo group-hover:rotate-90" style={{ borderColor: `${look.color}66`, color: look.color }}>+</div>
                      <div>
                        <div className="font-display text-lg font-extrabold leading-tight tracking-[-0.03em]">Your spot</div>
                        <div className="mt-0.5 font-sans text-[13px] text-ink-3">{t.at} events to get here</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <MeetHosts className="mt-14" />
      </div>
    </section>
  )
}
