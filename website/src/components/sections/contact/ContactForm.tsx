'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { SUPPORT_EMAIL, helpHref } from '@/lib/help'
import { cn } from '@/lib/cn'

const EASE = [0.2, 0.8, 0.2, 1] as const

export interface ContactTopic {
  key: string
  label: string
  /** A help topic that often answers this already */
  help?: { slug: string; title: string; question: string; answer: string }
  urgent?: boolean
}

const MAX = 1200

/**
 * The form. Pick what it's about (a matching help answer slides in, in
 * case it already solves it), write a note, and Send opens your email app
 * with everything filled in, addressed to support. Nothing is stored here.
 */
export function ContactForm({ topics }: { topics: ContactTopic[] }) {
  const [topic, setTopic] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [reply, setReply] = useState('')
  const [msg, setMsg] = useState('')
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState(false)
  const t = topics.find(x => x.key === topic) ?? null
  const ready = !!t && msg.trim().length >= 10

  const subject = `${t?.label ?? 'Hello'}${name ? ` · ${name}` : ''}`
  const body = [msg.trim(), '', '---', name && `Name: ${name}`, reply && `Reply to: ${reply}`, 'Sent from gorave.in/contact'].filter(Boolean).join('\n')
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  function send(e: React.FormEvent) {
    e.preventDefault()
    if (!ready) return
    window.location.href = mailto
    setSent(true)
  }

  function copy() {
    navigator.clipboard?.writeText(`To: ${SUPPORT_EMAIL}\nSubject: ${subject}\n\n${body}`).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <div className="rounded-[34px] bg-white p-3 shadow-pop">
      <AnimatePresence mode="wait" initial={false}>
        {!sent ? (
          <motion.form key="form" onSubmit={send} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease: EASE }} className="p-4 md:p-6">
            <fieldset>
              <legend className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">What’s it about?</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {topics.map(x => (
                  <button
                    key={x.key}
                    type="button"
                    onClick={() => setTopic(x.key)}
                    aria-pressed={topic === x.key}
                    className={cn('relative rounded-full px-4 py-2 font-sans text-sm font-bold transition-colors duration-300', topic === x.key ? 'text-white' : 'bg-cream text-ink hover:bg-paper')}
                  >
                    {topic === x.key && <motion.span layoutId="contact-topic" className="absolute inset-0 rounded-full bg-brand" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
                    <span className="relative">{x.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* A matching answer, in case it already solves it */}
            <AnimatePresence initial={false}>
              {t?.urgent && (
                <motion.a
                  key="urgent"
                  href="tel:112"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 block overflow-hidden rounded-2xl bg-blush/80 px-4 py-3 font-sans text-sm font-bold text-blush-ink"
                >
                  In danger right now? Call 112 first, then write to us.
                </motion.a>
              )}
              {t?.help && (
                <motion.div key={t.key} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
                  <div className="mt-4 rounded-2xl bg-cream p-4">
                    <div className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-orange">Quick answer</div>
                    <p className="mt-1.5 font-display text-[17px] font-extrabold tracking-[-0.025em]">{t.help.question}</p>
                    <p className="mt-1 font-sans text-[15px] leading-relaxed text-ink-2">{t.help.answer}</p>
                    <Link href={helpHref(t.help.slug)} className="mt-2 inline-block font-sans text-sm font-bold text-ink">More in {t.help.title} →</Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Field label="Your name" value={name} onChange={setName} autoComplete="name" />
              <Field label="Email or phone, for our reply" value={reply} onChange={setReply} autoComplete="email" />
            </div>
            <label className="group relative mt-3 block rounded-2xl bg-cream px-4 pb-3 pt-7 transition-shadow focus-within:shadow-[0_0_0_2px_var(--color-orange)]">
              <span className={cn('pointer-events-none absolute left-4 font-sans font-bold text-ink-3 transition-all duration-300', msg ? 'top-2.5 text-[11px] uppercase tracking-[0.14em]' : 'top-5 text-[15px] group-focus-within:top-2.5 group-focus-within:text-[11px] group-focus-within:uppercase group-focus-within:tracking-[0.14em]')}>
                Your message
              </span>
              <textarea
                value={msg}
                onChange={e => setMsg(e.target.value.slice(0, MAX))}
                rows={5}
                className="w-full resize-none bg-transparent font-sans text-[16px] leading-relaxed text-ink outline-none"
              />
              <span className="absolute bottom-2.5 right-4 font-sans text-[11px] font-bold tabular-nums text-ink-3">{msg.length}/{MAX}</span>
            </label>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <p className="font-sans text-[13px] text-ink-3">Opens your email app, addressed to {SUPPORT_EMAIL}.</p>
              <button
                type="submit"
                disabled={!ready}
                className="group inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 font-sans text-[15px] font-bold text-white shadow-soft transition-[transform,opacity] duration-300 enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {ready ? 'Send it' : !t ? 'Pick a topic' : 'Write a little more'}
                <span aria-hidden className="transition-transform duration-500 group-enabled:group-hover:translate-x-1">→</span>
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div key="sent" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} className="p-6 text-center md:p-10">
            <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }} className="mx-auto grid size-16 place-items-center rounded-full bg-brand text-2xl text-white">✓</motion.div>
            <h3 className="mt-6 font-display text-[clamp(28px,3vw,40px)] font-extrabold tracking-[-0.045em]">Your email is ready.</h3>
            <p className="mx-auto mt-3 max-w-[380px] font-sans text-[16px] leading-relaxed text-ink-2">
              Your email app should have opened with everything filled in. Just press send there. Didn’t open?
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <button type="button" onClick={copy} className="rounded-full bg-ink px-5 py-3 font-sans text-sm font-bold text-cream">{copied ? 'Copied ✓' : 'Copy the message'}</button>
              <a href={mailto} className="rounded-full bg-cream px-5 py-3 font-sans text-sm font-bold">Try again</a>
              <button type="button" onClick={() => setSent(false)} className="rounded-full px-5 py-3 font-sans text-sm font-bold text-ink-3 hover:text-ink">Edit</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Field({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  return (
    <label className="group relative block rounded-2xl bg-cream px-4 pb-2.5 pt-6 transition-shadow focus-within:shadow-[0_0_0_2px_var(--color-orange)]">
      <span className={cn('pointer-events-none absolute left-4 font-sans font-bold text-ink-3 transition-all duration-300', value ? 'top-2 text-[11px] uppercase tracking-[0.14em]' : 'top-4 text-[15px] group-focus-within:top-2 group-focus-within:text-[11px] group-focus-within:uppercase group-focus-within:tracking-[0.14em]')}>
        {label}
      </span>
      <input value={value} onChange={e => onChange(e.target.value)} autoComplete={autoComplete} className="w-full bg-transparent font-sans text-[16px] text-ink outline-none" />
    </label>
  )
}
