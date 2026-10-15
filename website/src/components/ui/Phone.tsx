import type { ReactNode } from 'react'

/** Minimal device frame for product screens. */
export function Phone({ children, width = 300, className }: { children: ReactNode; width?: number; className?: string }) {
  return (
    <div
      className={className}
      style={{
        width, height: width * 2.05, borderRadius: width * 0.16, padding: width * 0.035,
        background: '#0c0c0c', boxShadow: '0 40px 90px -30px rgb(23 19 16 / 0.55)', flexShrink: 0,
      }}
    >
      <div className="relative h-full w-full overflow-hidden bg-noir" style={{ borderRadius: width * 0.13 }}>
        <div className="absolute left-1/2 top-2.5 z-10 h-6 -translate-x-1/2 rounded-full bg-black" style={{ width: width * 0.32 }} />
        {children}
      </div>
    </div>
  )
}
