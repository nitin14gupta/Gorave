import Image from 'next/image'
import { BRAND } from '@/constants'
import { cn } from '@/lib/cn'

/**
 * Desktop "scan to download" card. The QR is the site's ticket artwork,
 * shown as a visual; the store links themselves live on the badges.
 */
export function ScanCard({ className, tilt = 0 }: { className?: string; tilt?: number }) {
  return (
    <div
      className={cn('hidden items-center gap-4 rounded-[22px] bg-white p-3 pr-5 shadow-soft transition-transform duration-500 ease-out-expo hover:-translate-y-1 hover:rotate-0 lg:inline-flex', className)}
      style={{ rotate: `${tilt}deg` }}
    >
      <div className="relative size-[92px] shrink-0 rounded-[14px] bg-[#F7F3EC] p-2">
        <Image src="/img/ticket-qr.svg" alt="" width={228} height={228} unoptimized className="block size-full" />
        <span className="absolute left-1/2 top-1/2 flex size-[26px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[7px] bg-[#F7F3EC]">
          <Image src={BRAND.logoDark} alt="" width={20} height={20} className="size-[18px]" />
        </span>
      </div>
      <div className="font-sans">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">On a computer?</div>
        <div className="mt-1 font-display text-lg font-extrabold leading-tight tracking-[-0.02em] text-ink">Scan with your<br />phone camera</div>
      </div>
    </div>
  )
}
