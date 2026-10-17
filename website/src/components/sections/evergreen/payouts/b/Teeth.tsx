import { cn } from '@/lib/cn'

const N = 26
const D = `M0 0 ${Array.from({ length: N }, (_, i) => `L${i * 20 + 10} 10 L${(i + 1) * 20} 0`).join(' ')} Z`

/** Zigzag paper edge. Fill follows currentColor; flip for a top edge. */
export function Teeth({ flip, className }: { flip?: boolean; className?: string }) {
  return (
    <svg viewBox={`0 0 ${N * 20} 10`} preserveAspectRatio="none" className={cn('block h-2.5 w-full', flip && 'rotate-180', className)} aria-hidden>
      <path d={D} fill="currentColor" />
    </svg>
  )
}
