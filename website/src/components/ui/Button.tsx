import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Kind = 'primary' | 'ink' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const SIZES: Record<Size, string> = {
  sm: 'px-4 py-2.5 text-[13px]',
  md: 'px-5.5 py-3.5 text-[15px]',
  lg: 'px-7.5 py-4.5 text-[17px]',
}

function kindClass(kind: Kind, dark: boolean) {
  if (kind === 'primary') return 'btn-shine text-white shadow-[0_14px_30px_-12px_rgb(255_56_100/0.6)]'
  if (kind === 'ink') return dark ? 'bg-noir-ink text-ink' : 'bg-ink text-cream'
  return dark
    ? 'text-noir-ink shadow-[inset_0_0_0_1.5px_rgb(245_240_235/0.3)] hover:bg-white/5'
    : 'text-ink shadow-[inset_0_0_0_1.5px_rgb(23_19_16/0.18)] hover:bg-ink/[0.04]'
}

interface Props {
  href: string
  children: ReactNode
  kind?: Kind
  size?: Size
  dark?: boolean
  className?: string
}

export function Button({ href, children, kind = 'primary', size = 'md', dark = false, className }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2 whitespace-nowrap rounded-full font-sans font-bold',
        'transition-transform duration-300 ease-out-expo hover:-translate-y-px active:translate-y-0',
        SIZES[size],
        kindClass(kind, dark),
        className,
      )}
    >
      {children}
    </Link>
  )
}
