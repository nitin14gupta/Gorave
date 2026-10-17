'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { AVATARS } from '@/constants'
import { useLiveEvent } from './LiveEvents'
import { cn } from '@/lib/cn'
import { InviteCard } from './InviteCard'

const pop = (delay: number) => ({
  initial: { opacity: 0, y: 14, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.6, delay, ease: [0.2, 0.8, 0.2, 1] as const },
})

export function Bubble({ children, me, name, avatar, delay = 0 }: { children: ReactNode; me?: boolean; name?: string; avatar?: number; delay?: number }) {
  return (
    <motion.div {...pop(delay)} className={cn('flex items-end gap-2', me && 'flex-row-reverse')}>
      {!me && avatar != null && (
        <Image src={AVATARS[avatar]} alt="" width={28} height={28} sizes="56px" className="size-7 rounded-full object-cover" />
      )}
      <div>
        {name && <div className="mb-0.5 ml-3 font-sans text-[11px] font-bold text-ink-3">{name}</div>}
        <div
          className={cn(
            'max-w-[260px] rounded-[22px] px-4 py-2.5 font-sans text-[15px] font-medium leading-snug shadow-[0_8px_20px_-14px_rgb(23_19_16/0.35)]',
            me ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-white text-ink',
          )}
        >
          {children}
        </div>
      </div>
    </motion.div>
  )
}

export function TypingDots({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div {...pop(delay)} className="inline-flex gap-1 rounded-[20px] bg-white px-3.5 py-3">
      {[0, 1, 2].map(i => (
        <span key={i} className="size-[7px] rounded-full bg-ink-3" style={{ animation: `typing 1.2s ${i * 0.15}s infinite` }} />
      ))}
    </motion.div>
  )
}

/** The hero's group-chat story — a plan forming, then the invite drops in. */
export function ChatThread() {
  const event = useLiveEvent(0)
  return (
    <div className="flex flex-col gap-2.5">
      <Bubble name="Riya" avatar={0} delay={0.5}>anyone free saturday??</Bubble>
      <Bubble name="Kabir" avatar={1} delay={0.9}>only if it&apos;s not another café</Bubble>
      <Bubble me delay={1.3}>found a rooftop thing in bandra 👀</Bubble>
      <motion.div {...pop(1.7)} className="self-end">
        <InviteCard event={event} tilt={-2} />
      </motion.div>
      <Bubble name="Riya" avatar={0} delay={2.2}>IN. requesting rn</Bubble>
      <TypingDots delay={2.6} />
    </div>
  )
}
