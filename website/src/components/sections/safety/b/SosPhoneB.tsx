'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { SOS_CONTACTS } from '@/lib/safety'
import { Chapter } from '@/components/ui/atoms'
import { Phone } from '@/components/ui/Phone'
import { EventDetailScreen } from '@/components/ui/AppScreens'
import { cn } from '@/lib/cn'

const EASE = [0.2, 0.8, 0.2, 1] as const
const STEPS = [
  { title: 'You’re at the party', body: 'SOS sits one tap away for the whole night.', ms: 2200 },
  { title: 'Tap SOS', body: 'One tap starts sharing your live location.', ms: 1800 },
  { title: 'Your five contacts get it', body: 'Up to five people you chose, all at once.', ms: 2800 },
  { title: 'It keeps sharing', body: 'Even with the app in the background.', ms: 0 },
]

/**
 * Chapter 04 — the button. A phone plays the SOS flow once as it scrolls
 * into view: the party screen, the tap, five contacts ticking in, then live
 * sharing in the background. Tap any step to jump to it, or replay.
 */
export function SosPhoneB() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.5 })
  const [step, setStep] = useState(0)
  const last = STEPS.length - 1

  useEffect(() => {
    if (!inView || step >= last) return
    const t = setTimeout(() => setStep(s => s + 1), STEPS[step].ms)
    return () => clearTimeout(t)
  }, [inView, step, last])

  return (
    <section className="overflow-hidden bg-noir-2 px-6 py-24 text-noir-ink md:px-20 md:py-32">
      <div ref={ref} className="mx-auto grid max-w-[1180px] items-center gap-16 lg:grid-cols-[1fr_auto]">
        <div>
          <Chapter n="04" title="The button" dark />
          <h2 className="mt-4 font-display text-[clamp(44px,5.6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            If you need help,<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-brand">it&apos;s one tap.</span>
          </h2>
          <ol className="mt-10 grid max-w-[480px] gap-2">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={cn('w-full rounded-2xl px-5 py-4 text-left transition-colors duration-300', i === step ? 'bg-noir-3' : 'hover:bg-noir-3/50')}
                >
                  <div className="flex items-baseline gap-3">
                    <span className={cn('font-serif text-xl italic', i <= step ? 'text-orange' : 'text-noir-ink-2/50')}>0{i + 1}</span>
                    <span className={cn('font-display text-xl font-extrabold tracking-[-0.03em]', i === step ? 'text-noir-ink' : 'text-noir-ink-2')}>{s.title}</span>
                  </div>
                  <div className={cn('ml-9 overflow-hidden font-sans text-[15px] text-noir-ink-2 transition-all duration-500', i === step ? 'mt-1 max-h-12 opacity-100' : 'max-h-0 opacity-0')}>{s.body}</div>
                  {i === step && s.ms > 0 && inView && (
                    <div className="ml-9 mt-3 h-[2px] overflow-hidden rounded-full bg-white/10">
                      <motion.div key={step} className="h-full origin-left bg-brand" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: s.ms / 1000, ease: 'linear' }} />
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex items-center gap-4 font-sans text-sm text-noir-ink-2">
            <button type="button" onClick={() => setStep(0)} className="rounded-full bg-noir-3 px-4 py-2 font-bold text-noir-ink transition-colors hover:bg-noir">↺ Replay</button>
            A demo of the app — nothing is sent.
          </div>
        </div>

        <div className="mx-auto">
          <Phone width={290}>
            <Screen step={step} />
          </Phone>
        </div>
      </div>
    </section>
  )
}

function Screen({ step }: { step: number }) {
  return (
    <div className="relative h-full font-sans text-noir-ink">
      {/* the party, underneath everything */}
      <motion.div className="absolute inset-0" animate={{ scale: step >= 1 ? 0.94 : 1, opacity: step >= 1 ? 0.35 : 1, filter: step >= 1 ? 'blur(3px)' : 'blur(0px)' }} transition={{ duration: 0.6, ease: EASE }}>
        <EventDetailScreen cta="Checked in ✓" />
      </motion.div>

      {/* SOS button */}
      <motion.div
        className="absolute right-3.5 top-12 z-10"
        animate={step === 1 ? { scale: [1, 0.85, 1.08, 1] } : { scale: step >= 2 ? 0 : 1 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="relative grid size-14 place-items-center rounded-full bg-coral font-display text-sm font-extrabold text-white shadow-pop">
          {step === 1 && (
            <motion.span className="absolute inset-0 rounded-full border-2 border-coral" initial={{ scale: 1, opacity: 0.9 }} animate={{ scale: 2.4, opacity: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.2 }} />
          )}
          SOS
        </div>
      </motion.div>

      <AnimatePresence>
        {step === 1 && (
          <motion.div
            key="sending"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="absolute inset-x-4 top-1/2 z-10 -translate-y-1/2 rounded-3xl bg-noir-3 p-5 text-center"
          >
            <div className="font-display text-lg font-extrabold">Sharing your location…</div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full origin-left bg-coral" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.5, ease: 'easeInOut' }} />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="contacts"
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="absolute inset-x-0 bottom-0 z-10 rounded-t-[28px] bg-noir-3 p-4"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <div className="font-display text-lg font-extrabold">SOS sent</div>
            <div className="text-[11px] text-noir-ink-2">Live location shared with</div>
            <div className="mt-3 grid gap-1.5">
              {SOS_CONTACTS.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, ease: EASE, delay: 0.2 + i * 0.32 }}
                  className="flex items-center gap-2.5 rounded-xl bg-noir-2 px-3 py-2"
                >
                  <span className="grid size-7 place-items-center rounded-full bg-noir font-display text-xs font-extrabold">{c.name[0]}</span>
                  <span className="flex-1 text-[13px] font-bold">{c.name}</span>
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.4 + i * 0.32 }} className="grid size-5 place-items-center rounded-full bg-green text-[11px] font-bold text-noir">✓</motion.span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="live"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-10 bg-[#141414]"
          >
            <svg viewBox="0 0 280 560" className="absolute inset-0 size-full" aria-hidden>
              {[90, 200, 330, 450].map(y => <path key={y} d={`M0 ${y} C90 ${y + 20} 190 ${y - 20} 280 ${y + 6}`} stroke="#262626" strokeWidth={10} fill="none" />)}
              {[70, 160, 230].map(x => <path key={x} d={`M${x} 0 C${x + 10} 200 ${x - 14} 380 ${x + 4} 560`} stroke="#262626" strokeWidth={8} fill="none" />)}
              <motion.circle cx={150} cy={270} fill="#00C48C" initial={{ r: 0, opacity: 0.5 }} animate={{ r: 70, opacity: 0.12 }} transition={{ duration: 1.2, ease: EASE }} />
              <circle cx={150} cy={270} r={9} fill="#00C48C" stroke="#111" strokeWidth={3} />
            </svg>
            <motion.div
              initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
              className="absolute inset-x-3 top-11 rounded-2xl bg-green px-3.5 py-3 text-noir"
            >
              <div className="text-[13px] font-bold">Sharing live location</div>
              <div className="text-[11px] opacity-80">With 5 contacts · keeps going in the background</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
