import { useId, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Chapter } from '@/components/ui/atoms'

// Shared stationery for variant B ("Postcards"): paper grain, perforated
// stamps, postmark rings, washi tape and a hand-drawn circle.

const GRAIN_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .09  0 0 0 0 .07  0 0 0 0 .06  0 0 0 .09 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`

/** Static paper texture laid over a section. */
export function Grain({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{ backgroundImage: `url("data:image/svg+xml;utf8,${GRAIN_SVG}")` }}
    />
  )
}

/** Perforated stamp edge: holes along the border only (content-box stays solid). */
export function perforation(hole = 4, step = 12): CSSProperties {
  const m = `linear-gradient(#000 0 0) content-box, radial-gradient(circle ${hole}px at ${step / 2}px ${step / 2}px, #0000 96%, #000) -${step / 2}px -${step / 2}px / ${step}px ${step}px`
  return { padding: step / 2 + 2, WebkitMask: m, mask: m }
}

export function Stamp({ children, className, innerClassName, style }: { children: ReactNode; className?: string; innerClassName?: string; style?: CSSProperties }) {
  return (
    <div className={cn('drop-shadow-[0_10px_14px_rgb(23_19_16/0.18)]', className)} style={style}>
      <div className={cn('bg-white', innerClassName)} style={perforation()}>
        {children}
      </div>
    </div>
  )
}

/** Circular postmark with text running round the ring. */
export function Postmark({ top, bottom, center, className, color = 'currentColor' }: { top: string; bottom?: string; center?: ReactNode; className?: string; color?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 120 120" className={cn('overflow-visible', className)} aria-hidden>
      <defs>
        <path id={`pt${id}`} d="M 18 60 A 42 42 0 0 1 102 60" />
        <path id={`pb${id}`} d="M 14 60 A 46 46 0 0 0 106 60" />
      </defs>
      <g fill="none" stroke={color} strokeWidth="1.6">
        <circle cx="60" cy="60" r="56" />
        <circle cx="60" cy="60" r="33" strokeWidth="1.1" />
      </g>
      <g fill={color} style={{ fontFamily: 'var(--font-satoshi), sans-serif', fontWeight: 700, letterSpacing: '0.18em' }}>
        <text fontSize="9.5">
          <textPath href={`#pt${id}`} startOffset="50%" textAnchor="middle">{top.toUpperCase()}</textPath>
        </text>
        {bottom && (
          <text fontSize="8">
            <textPath href={`#pb${id}`} startOffset="50%" textAnchor="middle" dominantBaseline="hanging">{bottom.toUpperCase()}</textPath>
          </text>
        )}
      </g>
      {center && (
        <foreignObject x="27" y="27" width="66" height="66">
          <div className="flex size-full items-center justify-center text-center font-serif text-[15px] italic leading-none" style={{ color }}>{center}</div>
        </foreignObject>
      )}
    </svg>
  )
}

/** Wavy cancellation lines that sit beside a postmark. */
export const WAVES = [
  'M0 8 C 15 0, 30 16, 45 8 S 75 0, 90 8 S 120 16, 135 8 S 165 0, 180 8',
  'M0 24 C 15 16, 30 32, 45 24 S 75 16, 90 24 S 120 32, 135 24 S 165 16, 180 24',
  'M0 40 C 15 32, 30 48, 45 40 S 75 32, 90 40 S 120 48, 135 40 S 165 32, 180 40',
]

/** A strip of semi-transparent washi tape. */
export function Tape({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute h-7 w-24 bg-[#f3dca9]/75 shadow-[0_1px_2px_rgb(23_19_16/0.12)]', className)}
      style={{
        maskImage: 'linear-gradient(90deg, transparent 0 3px, #000 3px calc(100% - 3px), transparent 0)',
        ...style,
      }}
    />
  )
}

/** Loose, hand-drawn ellipse (viewBox 200×70). */
export const SCRIBBLE = 'M14 38 C 8 16, 62 5, 108 7 C 156 9, 194 20, 191 38 C 188 57, 132 66, 88 63 C 42 60, 6 52, 12 30 C 15 20, 34 12, 52 10'

export const SPRING = { type: 'spring', stiffness: 60, damping: 16, mass: 1 } as const

/** The one postcard shadow used everywhere on this page. */
export const CARD_SHADOW = 'shadow-[0_1px_0_rgb(23_19_16/0.05),0_30px_60px_-30px_rgb(23_19_16/0.42)]'

/** Chapter opener + heading, one rhythm for every section. */
export function SectionHead({ n, label, title, serif, aside, className }: { n: string; label: string; title: ReactNode; serif?: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-10 gap-y-5', className)}>
      <div className="max-w-[860px]">
        <Chapter n={n} title={label} />
        <h2 className="mt-4 font-display text-[clamp(40px,5vw,76px)] font-extrabold leading-[0.92] tracking-[-0.055em] text-ink">
          {title}
          {serif && <> <span className="font-serif font-normal italic tracking-[-0.03em]">{serif}</span></>}
        </h2>
      </div>
      {aside && <div className="max-w-[320px] pb-1.5 font-serif text-xl italic leading-snug text-ink-3">{aside}</div>}
    </div>
  )
}

// Deckled paper edges, precomputed, deterministic jagged lines (viewBox 1440×24).
function edgePath(seed: number, amp: number) {
  let s = seed * 7919
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280
  const pts: string[] = []
  const n = 160
  for (let i = 0; i <= n; i++) {
    const y = 3 + amp * (0.25 + 0.45 * rnd() + 0.3 * (0.5 + 0.5 * Math.sin(i / (5 + seed) + seed)))
    pts.push(`${((i / n) * 1440).toFixed(1)} ${y.toFixed(2)}`)
  }
  return `M0 0 L${pts.join(' L')} L1440 0 Z`
}
const EDGES = [1, 2, 3, 4, 5, 6].map((seed, i) => edgePath(seed, i % 2 ? 12 : 17))

/**
 * The torn bottom edge of the section above, laid over the top of this one so
 * the page reads as stacked sheets. `from` is the colour of the section above.
 */
export function Deckle({ from, seed = 0 }: { from: 'paper' | 'cream'; seed?: number }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 24"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[14px] w-full md:h-[20px]"
      style={{ filter: 'drop-shadow(0 2px 1.5px rgb(23 19 16 / 0.07))' }}
    >
      <path d={EDGES[seed % EDGES.length]} fill={from === 'paper' ? 'var(--color-paper)' : 'var(--color-cream)'} />
    </svg>
  )
}
