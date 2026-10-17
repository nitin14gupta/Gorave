'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import { Chapter, StoreBadges } from '@/components/ui/atoms'
import { Phone } from '@/components/ui/Phone'
import { DiscoverScreen, PayScreen, TicketScreen } from '@/components/ui/AppScreens'
import { LockScreen } from '@/components/ui/LockScreen'
import { cn } from '@/lib/cn'
import { ProfileScreen, RequestScreen, SosScreen } from '../screens'

interface Beat { when: string; title: string; body: string; screen: ReactNode }

// Illustrative clock times for one night out; the features are the real ones.
const BEATS: Beat[] = [
  { when: 'Thursday, 9:40 pm', title: 'Find it.', body: 'Open Gorave in your city. The closest nights come first. Filter by free, tonight, weekend or vibe.', screen: <DiscoverScreen /> },
  { when: '9:42 pm', title: 'Ask to join.', body: 'Free events are request-to-join. The host sees your photos and voice intro, then approves.', screen: <RequestScreen /> },
  { when: 'Friday, lunch', title: 'Or book it.', body: 'Paid events book instantly with UPI or the Gorave Wallet. One flat ₹50 platform fee.', screen: <PayScreen /> },
  { when: 'Saturday, 4:02 pm', title: 'The address lands.', body: 'Only confirmed guests get the exact location. Everyone else just sees the area.', screen: <LockScreen /> },
  { when: '8:30 pm', title: 'Show the QR.', body: 'Your ticket is in the app. The host scans it at the door.', screen: <TicketScreen /> },
  { when: 'All night', title: 'Feel safe.', body: 'Everyone is phone-verified and 18+. SOS shares your live location with up to 5 emergency contacts.', screen: <SosScreen /> },
  { when: 'Sunday', title: 'Keep the people.', body: 'Follow the ones you clicked with. They become your Vibers, you are Vibing them back.', screen: <ProfileScreen /> },
]

function usePinned(track: React.RefObject<HTMLDivElement | null>, section: React.RefObject<HTMLElement | null>) {
  const [m, setM] = useState({ dist: 0, vw: 1440 })
  useEffect(() => {
    const el = track.current
    const sec = section.current
    if (!el || !sec) return
    const measure = () => {
      const wide = window.matchMedia('(min-width: 768px)').matches
      setM({ dist: wide ? Math.max(0, Math.round(el.scrollWidth - window.innerWidth)) : 0, vw: window.innerWidth })
    }
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    ro.observe(sec)
    return () => ro.disconnect()
  }, [track, section])
  return m
}

/**
 * Chapter 01, a night in the app. The section pins and the night slides
 * past sideways, Thursday to Sunday, one real screen per beat, with a clock
 * line running along the top. Ends on the store badges. Phones swipe it.
 */
export function NightRail() {
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const m = usePinned(track, section)
  const pinned = m.dist > 0
  const { scrollYProgress: p } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const x = useTransform(p, v => (m.dist ? -Math.round(v * m.dist) : 0))
  const bar = useTransform(p, v => (m.dist ? v : 1))
  const [cur, setCur] = useState(0)
  useMotionValueEvent(p, 'change', v => setCur(Math.min(BEATS.length - 1, Math.max(0, Math.round(v * (BEATS.length + 0.6) - 0.6)))))

  return (
    <section ref={section} className="relative bg-paper" style={pinned ? { height: `calc(100vh + ${m.dist}px)` } : undefined}>
      <div className={pinned ? 'sticky top-0 flex h-screen flex-col overflow-hidden pt-[96px]' : 'py-24 md:py-32'}>
        <div className="px-6 md:px-12 lg:px-20">
          <div className="flex items-center justify-between gap-6 border-b border-ink/15 pb-4">
            <Chapter n="02" title="Thursday to Sunday" />
            <div className="hidden font-serif text-xl italic text-ink-2 md:block">{BEATS[cur].when}</div>
          </div>
        </div>

        <div className={cn(pinned ? 'flex flex-1 items-center' : 'mt-10 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]')}>
          <motion.div ref={track} style={{ x }} className="flex w-max items-start gap-0 px-6 md:items-center md:px-12 lg:px-20">
            <div className="w-[300px] shrink-0 snap-start pr-10 md:w-[400px] md:pr-14">
              <h2 className="font-display text-[clamp(48px,5.4vw,84px)] font-extrabold leading-[0.88] tracking-[-0.055em]">
                Thursday<br />to Sunday,<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-orange">in seven taps.</span>
              </h2>
              <p className="mt-6 max-w-[300px] font-sans text-lg leading-relaxed text-ink-2">One night out, the way it actually goes on Gorave.</p>
              {pinned && <div className="mt-8 flex items-center gap-3 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-ink-3">Keep scrolling <span className="h-px w-10 bg-ink/25" /> →</div>}
            </div>

            {BEATS.map((b, i) => (
              <div key={b.title} className="flex w-[300px] shrink-0 snap-start flex-col gap-6 border-l border-ink/12 px-6 md:w-auto md:flex-row md:items-center md:gap-9 md:px-10">
                <div className={cn('shrink-0 transition-transform duration-700 ease-out-expo', i % 2 ? 'md:rotate-[2.5deg]' : 'md:-rotate-[2.5deg]', pinned && cur === i && 'md:rotate-0 md:scale-[1.03]')}>
                  <div className="h-[472px] w-[230px] md:h-[512px] md:w-[250px] [@media(max-height:820px)]:md:h-[451px] [@media(max-height:820px)]:md:w-[220px]">
                    <Phone width={250} className="origin-top-left scale-[0.92] md:scale-100 [@media(max-height:820px)]:md:scale-[0.88]">{b.screen}</Phone>
                  </div>
                </div>
                <div className="md:w-[260px]">
                  <div className="font-serif text-xl italic text-orange">{b.when}</div>
                  <div className="mt-2 font-display text-[44px] font-extrabold leading-[0.92] tracking-[-0.05em] text-ink md:text-[52px]">{b.title}</div>
                  <p className="mt-3 font-sans text-[16px] leading-relaxed text-ink-2">{b.body}</p>
                  <div className="mt-5 font-serif text-[15px] italic text-ink-3">0{i + 1} / 0{BEATS.length}</div>
                </div>
              </div>
            ))}

            {/* End: the badges */}
            <div className="shrink-0 snap-start border-l border-ink/12 px-6 md:px-10">
              <div className="flex h-[420px] w-[280px] flex-col justify-between rounded-[30px] bg-brand p-7 text-white shadow-pop md:w-[340px]">
                <span className="font-serif text-3xl italic">Your turn.</span>
                <div>
                  <div className="font-display text-[38px] font-extrabold leading-[0.92] tracking-[-0.045em]">This weekend, it could be you.</div>
                  <div className="mt-6"><StoreBadges height={44} /></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {pinned && (
          <div className="hidden items-center gap-5 px-12 pb-8 md:flex lg:px-20">
            <div className="h-[2px] flex-1 overflow-hidden rounded-full bg-ink/10">
              <motion.div style={{ scaleX: bar }} className="h-full origin-left bg-ink" />
            </div>
            <div className="font-serif text-xl italic text-ink-2">0{cur + 1} / 0{BEATS.length}</div>
          </div>
        )}
        {!pinned && <div className="mt-4 px-6 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-ink-3 md:hidden">Swipe through the night →</div>}
      </div>
    </section>
  )
}
