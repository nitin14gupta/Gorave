'use client'

import Image from 'next/image'
import { useState } from 'react'
import { OUT_CATEGORIES, outGuideHref, type OutGuide } from '@/lib/goingOut'
import { HoverPreviewList } from '@/components/ui/HoverPreviewList'
import { cn } from '@/lib/cn'
import { Head, guidePhoto } from '../kit'

/**
 * Chapter 01, the shelf. Every going-out guide as the homepage hover list,
 * filtered by a row of category tabs; a cover follows your cursor.
 */
export function Shelf({ guides }: { guides: OutGuide[] }) {
  const [cat, setCat] = useState<string>('All')
  const cats = ['All', ...OUT_CATEGORIES.filter(c => guides.some(g => g.category === c))]
  const list = cat === 'All' ? guides : guides.filter(g => g.category === cat)
  const rows = list.map(g => ({
    key: g.slug,
    href: outGuideHref(g),
    label: g.title,
    aside: `${g.readMinutes} min`,
    preview: (
      <div className="relative size-full">
        <Image src={guidePhoto(g)} alt="" fill sizes="320px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <p className="absolute inset-x-4 bottom-4 font-sans text-[13px] font-bold leading-snug text-white">{g.dek}</p>
      </div>
    ),
  }))

  return (
    <section className="bg-paper px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <Head n="01" label="The shelf" title="Every guide," serif="one shelf." />
          <div className="flex flex-wrap gap-2">
            {cats.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={cn('rounded-full px-4 py-2 font-sans text-sm font-bold transition-colors duration-300', c === cat ? 'bg-ink text-cream' : 'bg-white text-ink shadow-soft hover:bg-cream')}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-12">
          <HoverPreviewList key={cat} rows={rows} />
        </div>
      </div>
    </section>
  )
}
