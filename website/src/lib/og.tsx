import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { getArea } from './area'
import { getCity } from './city'
import { getCrowd } from './crowd'
import { getTypeStory } from './eventType'
import { getOccasion } from './occasion'
import { getPrice } from './price'
import { getTime } from './time'

// Share cards (Open Graph + X/Twitter) for every page, drawn in the brand:
// cream, the G mark, a Cabinet Grotesk headline with an Instrument Serif
// italic line in orange, trust chips and a gradient ticket. Swap in real
// artwork later by adding an image file next to the route instead.

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_TYPE = 'image/png'

export interface OgCard {
  kicker: string
  title: string
  accent?: string
  chips?: string[]
  emoji?: string
}

const font = (f: string) => readFile(join(process.cwd(), 'src/app/fonts', f))

async function instrumentItalic(): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap', { headers: { 'User-Agent': 'Mozilla/4.0' } })).text()
    const url = css.match(/src: url\((.+?)\)/)?.[1]
    return url ? await (await fetch(url)).arrayBuffer() : null
  } catch {
    return null
  }
}

export async function ogImage({ kicker, title, accent, chips = ['Verified 18+', 'Address after you’re in', 'UPI tickets'], emoji }: OgCard) {
  const [extrabold, bold, satoshi, serif, mark] = await Promise.all([
    font('CabinetGrotesk-Extrabold.otf'),
    font('CabinetGrotesk-Bold.otf'),
    font('Satoshi-Bold.otf'),
    instrumentItalic(),
    readFile(join(process.cwd(), 'public/img/black-icon.png')),
  ])
  const logo = `data:image/png;base64,${mark.toString('base64')}`
  const long = title.length > 26

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#f1e9d8', padding: 64, position: 'relative', fontFamily: 'Satoshi' }}>
        {/* Gradient ticket, tilted, bottom right */}
        <div style={{ position: 'absolute', right: -40, bottom: -60, width: 420, height: 300, borderRadius: 40, background: 'linear-gradient(135deg, #ff6b35, #ff3864)', transform: 'rotate(-12deg)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 44, color: 'white' }}>
          <div style={{ fontSize: 22, letterSpacing: 4, opacity: 0.85, fontFamily: 'Satoshi' }}>ADMIT ONE</div>
          <div style={{ fontSize: 64, fontFamily: 'Cabinet', fontWeight: 800, letterSpacing: -3, marginTop: 8 }}>{emoji ?? 'gorave.in'}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} width={52} height={52} alt="" />
            <div style={{ fontFamily: 'Cabinet', fontWeight: 800, fontSize: 40, letterSpacing: -2, color: '#171310' }}>gorave</div>
          </div>

          <div style={{ display: 'flex', marginTop: 54 }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3, color: '#4a423a', textTransform: 'uppercase', background: 'white', padding: '10px 20px', borderRadius: 999 }}>{kicker}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 26, maxWidth: 820 }}>
            <div style={{ fontFamily: 'Cabinet', fontWeight: 800, fontSize: long ? 88 : 108, lineHeight: 0.92, letterSpacing: long ? -4 : -5, color: '#171310' }}>{title}</div>
            {accent && (
              <div style={{ fontFamily: serif ? 'Instrument' : 'Cabinet', fontStyle: serif ? 'italic' : 'normal', fontWeight: serif ? 400 : 700, fontSize: long ? 76 : 92, lineHeight: 1, letterSpacing: -2, color: '#ff6b35', marginTop: 6 }}>
                {accent}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
            {chips.map(c => (
              <div key={c} style={{ fontSize: 22, fontWeight: 700, color: '#171310', background: 'rgba(255,255,255,.7)', padding: '10px 18px', borderRadius: 999 }}>{c}</div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Cabinet', data: extrabold, weight: 800 },
        { name: 'Cabinet', data: bold, weight: 700 },
        { name: 'Satoshi', data: satoshi, weight: 700 },
        ...(serif ? [{ name: 'Instrument', data: serif, style: 'italic' as const, weight: 400 as const }] : []),
      ],
    },
  )
}

/** The card for any /[city], /[city]/[facet] or /[city]/[facet]/[sub] URL. */
export function ogForPath(a: string, b?: string, c?: string): OgCard {
  const city = getCity(a)
  const label = (slug: string) => {
    const occ = getOccasion(slug)
    if (occ) return { kicker: 'Occasion', title: occ.name, emoji: occ.emoji }
    const price = getPrice(slug)
    if (price) return { kicker: 'Budget', title: price.slug === 'free-events' ? 'Free nights' : 'Under ₹500' }
    const time = getTime(slug)
    if (time) return { kicker: 'When', title: time.label }
    const crowd = getCrowd(slug)
    if (crowd) return { kicker: 'Who it’s for', title: `${crowd.label} nights` }
    const story = getTypeStory(slug)
    if (story) return { kicker: 'Kind of night', title: story.plural }
    if (slug === 'hosts') return { kicker: 'People', title: 'The hosts' }
    return null
  }
  if (!b) {
    if (city) return { kicker: `${city.state} · ${city.areas.length} neighbourhoods`, title: city.name, accent: 'after dark.' }
    const l = label(a)
    return l ? { ...l, accent: 'across India.' } : { kicker: 'Gorave', title: 'House parties', accent: 'near you.' }
  }
  if (!city) return { kicker: 'Gorave', title: 'House parties', accent: 'near you.' }
  const area = getArea(a, b)
  if (!c) {
    if (area) return { kicker: `Neighbourhood · ${city.name}`, title: area.name, accent: `${area.profile.line}.`.slice(0, 40) }
    const l = label(b)
    return l ? { ...l, kicker: `${l.kicker} · ${city.name}`, accent: `in ${city.name}.` } : { kicker: city.name, title: city.name }
  }
  const l = label(c)
  const where = area?.name ?? city.name
  return l ? { ...l, kicker: `${l.kicker} · ${city.name}`, accent: `in ${where}.` } : { kicker: city.name, title: where }
}
