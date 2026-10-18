import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Underlined bold link with a sliding arrow. */
export function ProofLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn('group inline-flex items-center gap-2 font-sans text-[15px] font-bold text-ink', className)}>
      <span className="border-b-[1.5px] border-ink/25 pb-0.5 transition-colors group-hover:border-orange">{children}</span>
      <span aria-hidden className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">→</span>
    </Link>
  )
}
