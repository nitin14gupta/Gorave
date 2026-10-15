import Image from 'next/image'
import { BRAND, PHOTOS, type PhotoKey } from '@/constants'

interface Notice {
  title: string
  body: string
  time: string
}

const DEFAULT_NOTICES: Notice[] = [
  { title: 'Sunset Rooftop Sessions', body: 'Starts in 2 hours. Exact address unlocked, tap for directions.', time: 'now' },
  { title: "You're in!", body: 'Your request for Bollywood Retro Night was accepted. Ticket ready.', time: '2h ago' },
]

/** iOS-style lock screen for showing Gorave reminders inside a <Phone>. */
export function LockScreen({ wallpaper = 'roof1', notices = DEFAULT_NOTICES }: { wallpaper?: PhotoKey; notices?: Notice[] }) {
  return (
    <div className="relative h-full w-full font-sans text-white">
      <Image src={PHOTOS[wallpaper]} alt="" fill sizes="400px" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/55" />
      <div className="relative flex h-full flex-col items-center pt-[22%]">
        <div className="text-[11px] font-bold opacity-85">Saturday, 18 October</div>
        <div className="font-display text-[56px] font-bold leading-none tracking-tight">4:02</div>
        <div className="mt-auto flex w-full flex-col gap-2 px-2.5 pb-[18%]">
          {notices.map(n => (
            <div key={n.title} className="flex gap-2.5 rounded-[18px] bg-white/22 p-2.5 backdrop-blur-xl">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-ink">
                <Image src={BRAND.logoLight} alt="" width={20} height={20} className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between text-[10px] opacity-80"><span className="font-bold uppercase tracking-wide">Gorave</span><span>{n.time}</span></div>
                <div className="text-[12px] font-bold leading-tight">{n.title}</div>
                <div className="text-[11px] leading-snug opacity-90">{n.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
