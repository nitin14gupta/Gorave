'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * A person's photo that falls back to their initial on the brand gradient when
 * there's no photo or it fails to load (e.g. a file missing from storage).
 * Fills its (relative, sized) parent.
 */
export function AvatarImage({ src, name, sizes, className, initialClassName }: { src: string | null | undefined; name: string; sizes: string; className?: string; initialClassName?: string }) {
  const [broken, setBroken] = useState(false)
  if (!src || broken) {
    return (
      <span className={cn('grid size-full place-items-center bg-brand font-display font-extrabold text-white', initialClassName ?? 'text-xl')}>
        {name.trim()[0]?.toUpperCase() ?? '?'}
      </span>
    )
  }
  return <Image src={src} alt={name} fill sizes={sizes} className={cn('object-cover', className)} onError={() => setBroken(true)} />
}
