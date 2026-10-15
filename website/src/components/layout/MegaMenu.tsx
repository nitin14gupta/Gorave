'use client'

import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { PHOTOS, type MegaMenuDef } from '@/constants'

const EASE = [0.2, 0.8, 0.2, 1] as const

/**
 * Apple-style panel: the shell animates its size with `layout` while the
 * menu content cross-fades, so moving from Events → Cities morphs rather than
 * closing and reopening.
 */
export function MegaMenu({ menu, onNavigate }: { menu: MegaMenuDef | null; onNavigate: () => void }) {
  return (
    <AnimatePresence>
      {menu && (
        <motion.div
          key="panel"
          layout
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.35, ease: EASE, layout: { duration: 0.4, ease: EASE } }}
          className="mt-3 w-[min(980px,calc(100vw-32px))] overflow-hidden rounded-[32px] bg-paper/95 shadow-[0_0_0_1px_rgb(23_19_16/0.06),0_40px_90px_-40px_rgb(23_19_16/0.5)] backdrop-blur-2xl"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={menu.key}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="grid grid-cols-[1fr_1fr_1fr_260px] gap-7 p-7"
            >
              {menu.columns.map(col => (
                <div key={col.heading}>
                  <div className="mb-3 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">{col.heading}</div>
                  <ul>
                    {col.links.map(l => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          onClick={onNavigate}
                          className="block py-1.5 font-display text-[17px] font-bold text-ink transition-colors hover:text-orange"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <Link href={menu.feature.href} onClick={onNavigate} className="group relative min-h-[220px] overflow-hidden rounded-[22px]">
                <Image src={PHOTOS[menu.feature.photo]} alt="" fill sizes="520px" className="object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.06]" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent from-40% to-black/70" />
                <div className="absolute bottom-3.5 left-4 text-white">
                  <div className="font-sans text-xs opacity-85">{menu.feature.caption}</div>
                  <div className="font-display text-xl font-extrabold">{menu.feature.title}</div>
                </div>
              </Link>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
