import { NIGHT_SLOTS, POSTERS, type PosterDef, type SampleEvent } from '@/constants'

// The flyers and the night's timeline that the city-page sections animate.
// Built from real events (API) — photo flyers carry the real title, time and
// area. With no events (API down) it falls back to the app's invite templates
// only, so no invented event names ever show up as listings.

export interface NightSlot {
  hour: number
  title: string
  vibe: string
  price: string
  status: string
  /** Index into the kit's posters */
  poster: number
  area?: string
  href?: string
  date?: string
  clock?: string
}

export interface CityKit {
  posters: PosterDef[]
  slots: NightSlot[]
}

const TEMPLATES = POSTERS.filter(p => p.kind === 'template')

export function buildCityKit(events: SampleEvent[]): CityKit {
  const real = events.filter(e => e.image).slice(0, 12)
  if (!real.length) {
    return {
      posters: TEMPLATES,
      slots: NIGHT_SLOTS.map((s, i) => ({ ...s, poster: i % TEMPLATES.length })),
    }
  }
  // Interleave: two real flyers, then one app template, so the stack still shows the templates off.
  const posters: PosterDef[] = []
  const posterOf = new Map<string, number>()
  let t = 0
  real.forEach((e, i) => {
    posterOf.set(e.id, posters.length)
    posters.push({ kind: 'photo', photo: e.photo, image: e.image, title: e.title, when: e.when, place: e.area, big: e.title.length < 14 })
    if (i % 2 === 1) posters.push(TEMPLATES[t++ % TEMPLATES.length])
  })

  const slots: NightSlot[] = real
    .filter(e => e.hour !== undefined)
    .sort((a, b) => (a.hour ?? 0) - (b.hour ?? 0))
    .map(e => ({
      hour: e.hour!,
      title: e.title,
      vibe: e.mix === 'Women only' ? 'Women only' : e.type,
      price: e.price,
      status: e.spotsLeft !== undefined && e.spotsLeft <= 3 ? 'Few left' : e.request ? 'Request' : 'Book',
      poster: posterOf.get(e.id) ?? 0,
      area: e.area,
      href: `/e/${e.id}`,
      date: e.date,
      clock: e.clock,
    }))
  return { posters, slots: slots.length ? slots : NIGHT_SLOTS.map((s, i) => ({ ...s, poster: i % posters.length })) }
}
