import Link from 'next/link'
import { FOOTER_COLUMNS } from '@/constants'
import { Logo } from '@/components/ui/Logo'
import { StoreBadges } from '@/components/ui/atoms'
import { Parallax } from '@/components/motion/Parallax'

export function SiteFooter() {
  return (
    <footer id="site-footer" className="overflow-hidden bg-noir px-6 pt-20 md:px-20">
      <div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-14 lg:flex-row">
        <div className="max-w-[340px]">
          <Logo dark size={30} />
          <p className="mt-4 font-sans text-[15px] leading-relaxed text-noir-ink-2">
            House parties, rooftops, game nights and dinner parties, hosted by real people in your city. Built for Gen-Z India.
          </p>
          <div className="mt-5"><StoreBadges dark /></div>
        </div>
        <div className="grid grid-cols-2 gap-x-16 gap-y-10 sm:grid-cols-4">
          {FOOTER_COLUMNS.map(col => (
            <div key={col.heading}>
              <div className="mb-3.5 font-sans text-xs font-bold uppercase tracking-[0.12em] text-noir-ink">{col.heading}</div>
              <ul>
                {col.links.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="block py-1.5 font-sans text-[15px] text-noir-ink-2 transition-colors hover:text-noir-ink">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <Parallax offset={-60}>
        <div aria-hidden className="mt-16 select-none text-center font-display text-[clamp(120px,22vw,320px)] font-extrabold leading-[0.78] tracking-[-0.07em] text-brand">
          gorave
        </div>
      </Parallax>
    </footer>
  )
}
