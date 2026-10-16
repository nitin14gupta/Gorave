import type { Metadata } from 'next'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { HostPageA } from '@/components/sections/host/HostPageA'
import { HostPageB } from '@/components/sections/host/HostPageB'

export const metadata: Metadata = { title: 'Host page lab', robots: { index: false, follow: false } }

const VARIANTS = [
  { k: 'a', label: 'A · First party' },
  { k: 'b', label: 'B · Backstage' },
] as const

// Internal: compare host-page designs before locking HOST_VARIANT in /host.
export default async function HostLab({ searchParams }: PageProps<'/lab/host'>) {
  const sp = await searchParams
  const v = sp.v === 'b' ? 'b' : 'a'

  return (
    <>
      {v === 'a' ? <HostPageA /> : <HostPageB />}
      <div className="fixed bottom-5 left-5 z-[60] flex flex-col gap-2 rounded-[22px] bg-ink/90 p-2.5 text-cream shadow-pop backdrop-blur">
        <div className="px-2 pt-1 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-noir-ink-2">Variant</div>
        <div className="flex gap-1">
          {VARIANTS.map(x => (
            <Link
              key={x.k}
              href={`/lab/host?v=${x.k}`}
              scroll={false}
              className={cn('rounded-full px-3 py-1.5 font-sans text-xs font-bold', x.k === v ? 'bg-cream text-ink' : 'text-noir-ink-2 hover:text-cream')}
            >
              {x.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
