import Image from 'next/image'
import { PHOTOS, templateImage, type PosterDef } from '@/constants'
import { cn } from '@/lib/cn'

interface Props {
  poster: PosterDef
  /** Area shown on photo/type flyers — makes the same artwork local to each city */
  area?: string
  width?: number
  height?: number
  radius?: number
  className?: string
}

/** An event flyer: the app's real invite template, a photo flyer or a type flyer. */
export function Poster({ poster, area, width = 220, height = 290, radius = 16, className }: Props) {
  const box = cn('relative shrink-0 overflow-hidden bg-tile', className)
  const style = { width, height, borderRadius: radius }
  const sub = [area, 'when' in poster ? poster.when : null].filter(Boolean).join(' · ')

  if (poster.kind === 'template') {
    return (
      <div className={box} style={style}>
        <Image src={templateImage(poster.name)} alt="" fill sizes={`${width * 2}px`} className="object-cover" draggable={false} />
      </div>
    )
  }

  if (poster.kind === 'photo') {
    return (
      <div className={box} style={style}>
        <Image src={PHOTOS[poster.photo]} alt="" fill sizes={`${width * 2}px`} className="object-cover" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 from-30% to-black/65" />
        <div className="absolute inset-x-3.5 bottom-3.5 text-white">
          <div className="font-display font-extrabold leading-[0.9] tracking-[-0.04em]" style={{ fontSize: width * (poster.big ? 0.2 : 0.13) }}>{poster.title}</div>
          {sub && <div className="mt-1.5 font-sans text-[11px] font-bold opacity-85">{sub}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(box, 'flex flex-col justify-between p-4')} style={{ ...style, background: poster.bg, color: poster.ink }}>
      <div className="font-sans text-[11px] font-bold uppercase tracking-[0.12em] opacity-70">gorave presents</div>
      <div className="font-display font-extrabold leading-[0.86] tracking-[-0.05em]" style={{ fontSize: width * 0.19 }}>
        {poster.title.split('|').map(line => <span key={line} className="block">{line}</span>)}
      </div>
      {sub && <div className="font-sans text-[11px] font-bold">{sub}</div>}
    </div>
  )
}
