import { Button } from '@/components/ui/Button'
import { Eyebrow, H2 } from '@/components/ui/atoms'

const CARDS = [
  ['Every guest is verified', "Phone-verified and 18+ only. Hosts see who's asking before they accept."],
  ['Addresses stay private', 'Only confirmed guests get the exact location. Everyone else sees the area.'],
  ['SOS in one tap', 'Shares your live location with your emergency contacts, even in the background.'],
  ['Reviewed hosts', 'Guests rate every event. Hosts earn badges from Rising to Legend.'],
]

/**
 * Noir section — the one place the site looks like the app. The cards are
 * sticky at stepped offsets, so they stack on top of each other as you scroll.
 */
export function Safety() {
  return (
    <section className="bg-noir px-6 py-28 text-noir-ink md:px-20 md:py-32">
      <div className="mx-auto grid max-w-[1280px] items-start gap-16 lg:grid-cols-2">
        <div className="lg:sticky lg:top-32">
          <Eyebrow dark>Safety, built in</Eyebrow>
          <H2 dark className="mb-5 mt-3.5 !text-[clamp(48px,5.6vw,80px)]">Go out.<br /><span className="text-brand">Feel safe.</span></H2>
          <p className="max-w-[440px] font-sans text-lg leading-relaxed text-noir-ink-2">
            Strangers become friends faster when everyone&apos;s real. That&apos;s the point of Gorave.
          </p>
          <div className="mt-8"><Button href="/safety" kind="ghost" dark>How we keep events safe</Button></div>
        </div>
        <div className="flex flex-col gap-4">
          {CARDS.map(([title, body], i) => (
            <div
              key={title}
              className="flex gap-5 rounded-[28px] bg-noir-2 p-7 shadow-[0_0_0_1px_rgb(255_255_255/0.06)] lg:sticky"
              style={{ top: `${128 + i * 22}px`, marginLeft: `${i * 18}px` }}
            >
              <div className="font-serif text-[34px] italic leading-none text-orange">0{i + 1}</div>
              <div>
                <h3 className="font-display text-2xl font-extrabold">{title}</h3>
                <p className="mt-1.5 font-sans text-base leading-relaxed text-noir-ink-2">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
