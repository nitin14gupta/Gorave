import type { Metadata } from 'next'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { GuidesHubA } from '@/components/sections/guides/GuidesHubA'
import { GuidesHubB } from '@/components/sections/guides/GuidesHubB'

export const metadata: Metadata = { title: 'Guides hub lab', robots: { index: false, follow: false } }

const VARIANTS = [
  { key: 'a', label: 'A · Magazine' },
  { key: 'b', label: 'B · Playbook' },
] as const

// Internal: compare the two /host/guides designs before locking GUIDES_VARIANT.
export default async function GuidesLab({ searchParams }: PageProps<'/lab/guides'>) {
  const sp = await searchParams
  const v = sp.v === 'b' ? 'b' : 'a'

  return (
    <>
      {v === 'a' ? <GuidesHubA /> : <GuidesHubB />}
      <div className="fixed bottom-5 left-5 z-[60] flex flex-col gap-2 rounded-[22px] bg-ink/90 p-2.5 text-cream shadow-pop backdrop-blur">
        <div className="px-2 pt-1 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-noir-ink-2">Variant</div>
        <div className="flex gap-1">
          {VARIANTS.map(x => (
            <Link
              key={x.key}
              href={`/lab/guides?v=${x.key}`}
              scroll={false}
              className={cn('rounded-full px-3 py-1.5 font-sans text-xs font-bold', x.key === v ? 'bg-cream text-ink' : 'text-noir-ink-2 hover:text-cream')}
            >
              {x.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
