'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { PHOTOS, type PhotoKey } from '@/constants'
import { Button } from '@/components/ui/Button'
import { AvatarStack } from '@/components/ui/atoms'
import { ChatThread } from '@/components/ui/Chat'
import { SplitWords } from '@/components/motion/Reveal'
import { Float, Parallax } from '@/components/motion/Parallax'

const EASE = [0.2, 0.8, 0.2, 1] as const

function PhotoPill({ photo, width, rotate, delay }: { photo: PhotoKey; width: number; rotate: number; delay: number }) {
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE, delay }}
      className="relative mx-[0.08em] inline-block h-[0.78em] overflow-hidden rounded-full align-middle shadow-soft"
      style={{ width: `${width}em`, rotate: `${rotate}deg`, translate: '0 -0.07em' }}
    >
      <Image src={PHOTOS[photo]} alt="" fill sizes="340px" priority className="object-cover" />
    </motion.span>
  )
}

function Polaroid({ photo, label, rotate, className, delay }: { photo: PhotoKey; label: string; rotate: number; className: string; delay: number }) {
  return (
    <Parallax offset={-120} className={className}>
      <Float rotate={rotate} delay={delay}>
        <div className="rounded-md bg-white p-2.5 pb-9 shadow-pop">
          <div className="relative h-[190px] w-[170px]">
            <Image src={PHOTOS[photo]} alt="" fill sizes="340px" className="object-cover" />
          </div>
          <div className="absolute inset-x-0 bottom-2 text-center font-serif text-[17px] italic text-ink-2">{label}</div>
        </div>
      </Float>
    </Parallax>
  )
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream px-6 pb-24 pt-32 md:px-20 md:pt-36">
      <div className="mx-auto grid max-w-[1280px] items-center gap-10 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
            {/* <Eyebrow>Live in Mumbai, Bangalore, Delhi + 5 more</Eyebrow> */}
          </motion.div>

          <h1 className="mt-6 font-display text-[clamp(52px,6.6vw,100px)] font-extrabold leading-[0.98] tracking-[-0.055em] text-ink">
            <SplitWords text="Parties" delay={0.1} />
            <PhotoPill photo="party1" width={1.35} rotate={-4} delay={0.35} />
            <SplitWords text="are better" delay={0.25} />
            <br />
            <SplitWords text="with" delay={0.45} />
            <PhotoPill photo="fr1" width={1.15} rotate={3} delay={0.6} />
            <SplitWords text="your people." delay={0.55} className="text-brand" />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.8 }}
            className="mb-8 mt-7 max-w-[560px] font-sans text-xl leading-relaxed text-ink-2"
          >
            House parties, rooftops, game nights and dinner parties, hosted by real people near you. One link for the invite, the guest list and the door.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.95 }}
            className="flex flex-wrap gap-3"
          >
            <Button href="/mumbai" size="lg">Find a party</Button>
            <Button href="/host" kind="ghost" size="lg">Host one free</Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.15 }}
            className="mt-8 flex flex-wrap gap-x-5 gap-y-2 font-sans text-sm font-bold text-ink-3"
          >
            <span>18+ only</span><span aria-hidden>·</span><span>Phone-verified guests</span><span aria-hidden>·</span><span>UPI payments</span>
          </motion.div>
        </div>

        <div className="relative hidden h-[680px] lg:block">
          <Polaroid photo="roof1" label="bandra, sat" rotate={-8} className="absolute -left-5 top-2.5" delay={0} />
          <Polaroid photo="game1" label="mafia night" rotate={7} className="absolute -right-8 bottom-5" delay={1.5} />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.3 }}
            className="absolute left-[70px] top-[70px] w-[380px] rounded-[36px] bg-paper/85 p-5.5 shadow-pop backdrop-blur-md"
          >
            <div className="mb-3.5 flex items-center gap-2.5 border-b border-line pb-3.5">
              <AvatarStack n={3} size={26} ringClass="ring-paper" />
              <div className="font-display text-base font-extrabold">the sat plan</div>
            </div>
            <ChatThread />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
