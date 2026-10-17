import type { Metadata } from 'next'
import Link from 'next/link'
import { CITIES } from '@/constants'
import { CROWDS } from '@/lib/crowd'
import { crowdPageData } from '@/lib/crowdPage'
import { cn } from '@/lib/cn'
import { CrowdPageView } from '@/components/sections/crowd/CrowdPageView'
import { CROWD_VARIANTS, type CrowdVariant } from '@/components/sections/crowd/types'

export const metadata: Metadata = { title: 'Crowd page lab', robots: { index: false, follow: false } }

// Internal: compare crowd-page variants (India hub or a city) before locking CROWD_VARIANT.
export default async function CrowdLab({ searchParams }: PageProps<'/lab/crowd'>) {
  const sp = await searchParams
  const v = (CROWD_VARIANTS as readonly string[]).includes(String(sp.v)) ? (sp.v as CrowdVariant) : 'a'
  const crowd = CROWDS.find(c => c.slug === sp.crowd) ?? CROWDS[0]
  const city = CITIES.find(c => c.slug === sp.city)
  const data = await crowdPageData(crowd, city)
  const href = (p: { v?: string; crowd?: string; city?: string | null }) => {
    const c = p.city === undefined ? city?.slug : p.city
    return `/lab/crowd?v=${p.v ?? v}&crowd=${p.crowd ?? crowd.slug}${c ? `&city=${c}` : ''}`
  }
  const pill = (on: boolean) => cn('rounded-full px-3 py-1.5 font-sans text-xs font-bold', on ? 'bg-cream text-ink' : 'text-noir-ink-2 hover:text-cream')

  return (
    <>
      <CrowdPageView {...data} variant={v} />
      <details className="group fixed bottom-5 left-5 z-[60] max-w-[calc(100vw-40px)] rounded-[22px] bg-ink/90 p-2.5 text-cream shadow-pop backdrop-blur">
        <summary className="cursor-pointer list-none rounded-full px-3 py-1.5 font-sans text-xs font-bold [&::-webkit-details-marker]:hidden">
          Lab · {v.toUpperCase()} · {crowd.label} · {city?.name ?? 'India'} <span className="ml-1 inline-block transition-transform group-open:rotate-180">▴</span>
        </summary>
        <div className="mt-2 flex max-w-[400px] flex-col gap-2">
          <div className="px-2 pt-1 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-noir-ink-2">Variant</div>
          <div className="flex gap-1">
            {CROWD_VARIANTS.map(k => <Link key={k} href={href({ v: k })} scroll={false} className={pill(k === v)}>{k.toUpperCase()}</Link>)}
          </div>
          <div className="px-2 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-noir-ink-2">Crowd</div>
          <div className="flex flex-wrap gap-1">
            {CROWDS.map(c => <Link key={c.slug} href={href({ crowd: c.slug })} scroll={false} className={pill(c.slug === crowd.slug)}>{c.label}</Link>)}
          </div>
          <div className="px-2 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-noir-ink-2">Place</div>
          <div className="flex flex-wrap gap-1">
            <Link href={href({ city: null })} scroll={false} className={pill(!city)}>India</Link>
            {CITIES.slice(0, 4).map(c => <Link key={c.slug} href={href({ city: c.slug })} scroll={false} className={pill(c.slug === city?.slug)}>{c.name}</Link>)}
          </div>
        </div>
      </details>
    </>
  )
}
