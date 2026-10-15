import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Badge options', robots: { index: false, follow: false } }

// Internal design lab — compare generated host-badge directions before one
// gets cut into per-tier assets for the app + site.
const OPTIONS = [
  { file: 'a-enamel-pins.png', name: 'A · Enamel pins', note: 'Premium, collectible, closest to "earned". Gold + brand gradient.', bg: 'bg-cream' },
  { file: 'b-holo-stickers.png', name: 'B · Holo stickers', note: 'Most Gen-Z / playful. Great for shareable profile flex.', bg: 'bg-cream' },
  { file: 'c-clay-3d.png', name: 'C · Soft 3D clay', note: 'Friendly, Apple-emoji feel. Reads well small in the app.', bg: 'bg-cream' },
  { file: 'd-neon.png', name: 'D · Neon signs', note: 'Nightlife energy. Only works on dark (app) surfaces.', bg: 'bg-noir' },
]

export default function BadgeLab() {
  return (
    <main className="min-h-screen bg-paper px-6 pb-24 pt-36 md:px-20">
      <h1 className="font-display text-6xl font-extrabold tracking-display">Host badge options</h1>
      <p className="mt-3 max-w-2xl font-sans text-lg text-ink-2">
        Same four tiers in each set — Rising (sparkler) · Established (disco ball) · Elite (champagne) · Legend (winged crown).
      </p>
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {OPTIONS.map(o => (
          <figure key={o.file} className={`overflow-hidden rounded-[32px] ${o.bg} shadow-soft`}>
            <Image src={`/img/badges/options/${o.file}`} alt={o.name} width={1360} height={1360} sizes="(max-width: 768px) 100vw, 50vw" className="h-auto w-full" />
            <figcaption className="bg-white p-5">
              <div className="font-display text-2xl font-extrabold">{o.name}</div>
              <div className="font-sans text-ink-2">{o.note}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  )
}
