import { CITIES, PHOTOS, type City, type SampleEvent } from '@/constants'
import { templateImage } from '@/constants'
import { cardEvents } from './api'
import { cityStreet, type Area } from './area'
import { areaSlug } from './city'
import type { Crumb } from './seo'

// Occasion pages: /diwali, /mumbai/diwali, /mumbai/bandra/diwali and so on.
// The public API has no date-range filter, so events are matched here by
// date window around the occasion or by name ("Diwali card party").
// LUNAR DATES (Diwali, Holi) are a table per year: confirm each year.

export interface Occasion {
  slug: string
  name: string
  /** "Diwali night", used in sentences */
  night: string
  emoji: string
  /** Next dates as YYYY-MM-DD, earliest first. Fixed-date ones are computed. */
  dates: (year: number) => string | null
  /** Days before and after the date that count as "this occasion" */
  window: [number, number]
  keywords: string[]
  image: string
  /** Big one-liner under the name */
  heroLine: string
  /** What it is, on Gorave: two short paragraphs */
  what: string[]
  /** The signature things, each a hover word */
  signatures: { word: string; line: string; image: string }[]
  /** A typical night, four stops */
  stops: { time: string; title: string; detail: string; image: string }[]
  checklist: string[]
  hostLine: string
  /** App invite template that fits */
  template: string
  faq: { q: string; a: string }[]
}

const fixed = (mm: string, dd: string) => (y: number) => `${y}-${mm}-${dd}`
const table = (t: Record<number, string>) => (y: number) => t[y] ?? null

const safety = { q: 'Is it safe to go to a party with people I don’t know?', a: 'Every guest is phone-verified and 18+, hosts approve who comes on free nights, and the exact address only unlocks once you’re confirmed. SOS texts your location to up to 5 emergency contacts if you ever need it.' }

export const OCCASIONS: Occasion[] = [
  {
    slug: 'halloween',
    name: 'Halloween',
    night: 'Halloween night',
    emoji: '🎃',
    dates: fixed('10', '31'),
    window: [3, 1],
    keywords: ['halloween', 'spooky', 'costume'],
    image: templateImage('halloween'),
    heroLine: 'Costumes, fake blood and a living room nobody will recognise by midnight.',
    what: [
      'Halloween in India has gone from a few themed bar nights to a proper house-party weekend. Someone dims the lights, someone goes all out on a costume, and the playlist gets a little spooky.',
      'On Gorave, hosts list their Halloween nights a week or two out. Free ones are request-to-join, paid ones book instantly, and you only get the address once you’re in.',
    ],
    signatures: [
      { word: 'costumes', line: 'Low effort or full prosthetics, both welcome.', image: PHOTOS.party2 },
      { word: 'dim lights', line: 'Fairy lights, candles, one red bulb.', image: PHOTOS.neon },
      { word: 'scary playlists', line: 'Thriller at least twice.', image: PHOTOS.gig2 },
      { word: 'pumpkin everything', line: 'Or a very convincing orange substitute.', image: PHOTOS.drinks },
    ],
    stops: [
      { time: '8 PM', title: 'Costume reveal', detail: 'Everyone pretends they didn’t try that hard.', image: PHOTOS.party2 },
      { time: '9:30 PM', title: 'Lights down', detail: 'Candles on, ghost stories optional.', image: PHOTOS.neon },
      { time: '11 PM', title: 'Best costume vote', detail: 'Rigged, every time.', image: PHOTOS.party3 },
      { time: '1 AM', title: 'Make-up comes off', detail: 'Mostly.', image: PHOTOS.sceneBite },
    ],
    checklist: ['A costume, or at least a mask', 'Make-up remover for later', 'Your QR ticket ready', 'A plan to get home'],
    hostLine: 'Use the app’s Halloween invite, set a costume rule in the house rules, and let the crowd do the rest.',
    template: 'halloween',
    faq: [
      { q: 'When are Halloween parties on Gorave?', a: 'Mostly the weekend closest to 31 October and on the night itself. This page shows anything listed around Halloween, plus nights with Halloween in the name.' },
      { q: 'Do I have to wear a costume?', a: 'Check the house rules on the listing. Plenty of hosts make it optional; some go strict.' },
      safety,
    ],
  },
  {
    slug: 'diwali',
    name: 'Diwali',
    night: 'Diwali night',
    emoji: '🪔',
    dates: table({ 2026: '2026-11-08', 2027: '2027-10-29' }),
    window: [5, 2],
    keywords: ['diwali', 'deepavali', 'card party', 'teen patti', 'festive'],
    image: PHOTOS.sceneLiving,
    heroLine: 'Diyas on the balcony, cards on the floor and far too many sweets.',
    what: [
      'Diwali is the season of house parties. Before and after the big night, homes open up for card parties, festive dinners and long evenings with people you only see once a year, or people you’ve just met.',
      'On Gorave, Diwali nights are hosted by real people in their homes. Request to join the free ones, book the paid ones instantly, and the address unlocks once you’re in.',
    ],
    signatures: [
      { word: 'diyas', line: 'Every ledge, every window.', image: PHOTOS.sceneLiving },
      { word: 'card parties', line: 'Low stakes, high drama.', image: PHOTOS.game1 },
      { word: 'mithai', line: 'You will be offered a third piece.', image: PHOTOS.dine3 },
      { word: 'new outfits', line: 'The one you bought for exactly this.', image: PHOTOS.party1 },
    ],
    stops: [
      { time: '7 PM', title: 'Diyas lit', detail: 'Rangoli at the door, shoes off inside.', image: PHOTOS.sceneDoor },
      { time: '8:30 PM', title: 'Cards come out', detail: 'Someone explains the rules, nobody listens.', image: PHOTOS.game1 },
      { time: '10 PM', title: 'Dinner and mithai', detail: 'Home food, too much of it.', image: PHOTOS.dine1 },
      { time: '12 AM', title: 'Rooftop lights', detail: 'The whole city sparkling below.', image: PHOTOS.sceneRoof },
    ],
    checklist: ['Something festive to wear', 'A box of sweets for the host', 'Your QR ticket ready', 'Check your city’s firecracker rules'],
    hostLine: 'Diyas, a deck of cards and your living room. List a free card night or a paid festive dinner and keep 90% of every ticket.',
    template: 'houseparty',
    faq: [
      { q: 'When are Diwali parties on Gorave?', a: 'Through the Diwali week, especially the days around the main night. This page shows anything listed around Diwali, plus nights with Diwali or card party in the name.' },
      { q: 'Are Diwali card parties allowed?', a: 'Hosts run their own nights and follow local laws. Friendly games with no real money are the norm; real-money gambling isn’t something to list on Gorave.' },
      safety,
    ],
  },
  {
    slug: 'christmas',
    name: 'Christmas',
    night: 'Christmas night',
    emoji: '🎄',
    dates: fixed('12', '25'),
    window: [3, 1],
    keywords: ['christmas', 'xmas', 'secret santa'],
    image: templateImage('christmas'),
    heroLine: 'Secret Santa, plum cake and a tree that leans slightly to the left.',
    what: [
      'Christmas in Indian cities is a long, warm week: midnight mass for some, Secret Santa for most, and house parties that start with cake and end with carols nobody knows the second verse of.',
      'On Gorave, hosts list Christmas dinners, Secret Santa nights and rooftop parties. Free ones are request-to-join; paid ones book instantly.',
    ],
    signatures: [
      { word: 'Secret Santa', line: 'Budget agreed, budget ignored.', image: PHOTOS.party3 },
      { word: 'plum cake', line: 'Somebody’s aunt’s recipe.', image: PHOTOS.dine2 },
      { word: 'fairy lights', line: 'Up since November, honestly.', image: PHOTOS.sceneLiving },
      { word: 'carols', line: 'The first verse, loudly.', image: PHOTOS.gig1 },
    ],
    stops: [
      { time: '7 PM', title: 'Gifts under the tree', detail: 'Labels face down, obviously.', image: PHOTOS.party3 },
      { time: '8:30 PM', title: 'Christmas dinner', detail: 'Roast, biryani, or both.', image: PHOTOS.dine1 },
      { time: '10 PM', title: 'Secret Santa', detail: 'Someone guesses theirs in four seconds.', image: PHOTOS.fr1 },
      { time: '12 AM', title: 'Carols on the balcony', detail: 'Neighbours permitting.', image: PHOTOS.sceneRoof },
    ],
    checklist: ['A Secret Santa gift, if it’s that kind of night', 'Something red or green', 'Your QR ticket ready', 'A plan to get home'],
    hostLine: 'Use the app’s Christmas invite, set the Secret Santa budget in the house rules, and open your door.',
    template: 'christmas',
    faq: [
      { q: 'When are Christmas parties on Gorave?', a: 'Christmas Eve, Christmas Day and the days around them. This page shows anything listed around Christmas, plus nights with Christmas or Secret Santa in the name.' },
      { q: 'Do I need to bring a gift?', a: 'Only if the listing says it’s a Secret Santa night. The house rules will say the budget.' },
      safety,
    ],
  },
  {
    slug: 'new-years-eve',
    name: 'New Year’s Eve',
    night: 'New Year’s Eve',
    emoji: '🥂',
    dates: fixed('12', '31'),
    window: [1, 1],
    keywords: ['new year', 'nye', '31st', 'countdown'],
    image: PHOTOS.fest,
    heroLine: 'The countdown, a rooftop, and people you’ll text on the 1st.',
    what: [
      'New Year’s Eve is the one night everyone has plans, and the night clubs charge the most for them. A house party is the better bet: a real countdown, your own playlist and nobody shouting over a cover charge.',
      'On Gorave, hosts list NYE house parties and rooftop countdowns across the city. They fill up early, so book or request a few days out.',
    ],
    signatures: [
      { word: 'the countdown', line: 'Ten seconds, shouted.', image: PHOTOS.fest },
      { word: 'rooftops', line: 'The best seat for the fireworks.', image: PHOTOS.roof2 },
      { word: 'confetti', line: 'You’ll find it in March.', image: PHOTOS.gig2 },
      { word: 'resolutions', line: 'Made at 12:01, broken by 12:30.', image: PHOTOS.drinks },
    ],
    stops: [
      { time: '9 PM', title: 'Doors', detail: 'QR check-in, the playlist warming up.', image: PHOTOS.sceneDoor },
      { time: '11 PM', title: 'Up to the roof', detail: 'Best spot for the fireworks.', image: PHOTOS.roof1 },
      { time: '12 AM', title: 'The countdown', detail: 'Ten, nine, everyone a beat early.', image: PHOTOS.fest },
      { time: '2 AM', title: 'First breakfast of the year', detail: 'Maggi, mostly.', image: PHOTOS.sceneBite },
    ],
    checklist: ['Book early, NYE fills fast', 'Your QR ticket ready', 'A ride home planned (surge is real)', 'Phone charged for midnight'],
    hostLine: 'NYE nights fill fastest. List a paid countdown from ₹99, set your capacity, and keep 90% of every ticket.',
    template: 'nightout',
    faq: [
      { q: 'When should I book a New Year’s Eve party?', a: 'Early. NYE nights fill faster than any other. Paid ones book instantly; free ones need the host to accept you, so request a few days ahead.' },
      { q: 'How do I get home after NYE?', a: 'Plan it before you go: cabs surge after midnight. Share your plan with a friend, and set up SOS in the app so one tap texts your location to your emergency contacts.' },
      safety,
    ],
  },
  {
    slug: 'valentines-day',
    name: 'Valentine’s Day',
    night: 'Valentine’s night',
    emoji: '💌',
    dates: fixed('02', '14'),
    window: [2, 1],
    keywords: ['valentine', 'galentine', 'singles', 'date night'],
    image: PHOTOS.dine2,
    heroLine: 'Singles mixers, galentine’s dinners and anti-Valentine’s nights. Pick your side.',
    what: [
      'Valentine’s doesn’t have to be a table for two. Around the 14th, hosts throw singles mixers, galentine’s dinners for the group chat, and loud anti-Valentine’s house parties.',
      'On Gorave you can see the crowd mix before you go, including women-only and 50:50 nights, so you know exactly what kind of room you’re walking into.',
    ],
    signatures: [
      { word: 'singles mixers', line: 'Name tags, optional courage.', image: PHOTOS.fr2 },
      { word: 'galentine’s', line: 'The group chat, in person.', image: PHOTOS.drinks },
      { word: 'long dinners', line: 'Strangers by starters, friends by dessert.', image: PHOTOS.dine2 },
      { word: 'anti-Valentine’s', line: 'Breakup playlist, full volume.', image: PHOTOS.party2 },
    ],
    stops: [
      { time: '7 PM', title: 'Arrive, awkwardly', detail: 'Everyone pretends they came for the food.', image: PHOTOS.sceneDoor },
      { time: '8 PM', title: 'Ice-breakers', detail: 'Someone suggests a game. It works.', image: PHOTOS.game1 },
      { time: '9:30 PM', title: 'Dinner', detail: 'The table gets louder by the course.', image: PHOTOS.dine1 },
      { time: '11 PM', title: 'Numbers swapped', detail: 'Or at least Instagrams.', image: PHOTOS.fr1 },
    ],
    checklist: ['Check the crowd mix on the listing', 'Something you feel great in', 'Your QR ticket ready', 'A plan to get home'],
    hostLine: 'Singles mixer or galentine’s dinner? Set the crowd mix, women-only or 50:50, and let the room take care of itself.',
    template: 'retro',
    faq: [
      { q: 'Are there singles events on Valentine’s Day?', a: 'Hosts list singles mixers, galentine’s and anti-Valentine’s nights around the 14th. Check the crowd mix on each listing: women-only, 50:50 and more.' },
      { q: 'Can I go alone?', a: 'Plenty of people do, especially to singles nights. Check the host’s rating and the crowd mix first.' },
      safety,
    ],
  },
  {
    slug: 'holi',
    name: 'Holi',
    night: 'Holi',
    emoji: '🎨',
    dates: table({ 2027: '2027-03-22', 2028: '2028-03-11' }),
    window: [2, 1],
    keywords: ['holi', 'colour', 'color', 'rang'],
    image: PHOTOS.fest,
    heroLine: 'Gulal on the terrace, thandai in hand, and clothes you’ll never wear again.',
    what: [
      'Holi is the one day a year getting covered in colour by strangers is the whole point. The best ones happen on terraces and in building compounds, with music, water and food that keeps coming.',
      'On Gorave, hosts list Holi mornings and afternoons on rooftops and in homes. Most start early, so check the time on the listing.',
    ],
    signatures: [
      { word: 'gulal', line: 'Every colour, mostly pink.', image: PHOTOS.fest },
      { word: 'terraces', line: 'The only place big enough.', image: PHOTOS.roof4 },
      { word: 'thandai', line: 'Ask what’s in it.', image: PHOTOS.drinks },
      { word: 'old white tees', line: 'Never white again.', image: PHOTOS.party1 },
    ],
    stops: [
      { time: '10 AM', title: 'First colour', detail: 'Someone always goes for the face.', image: PHOTOS.fest },
      { time: '12 PM', title: 'Music and water', detail: 'The terrace becomes a dance floor.', image: PHOTOS.roof4 },
      { time: '2 PM', title: 'Food', detail: 'Gujiya, chaat, more gujiya.', image: PHOTOS.dine3 },
      { time: '4 PM', title: 'The long shower', detail: 'Pink until Tuesday.', image: PHOTOS.sceneLiving },
    ],
    checklist: ['Clothes you can lose', 'Oil your hair and skin first', 'Your QR ticket ready', 'A towel and a change of clothes'],
    hostLine: 'Got a terrace? List a Holi afternoon: free with request-to-join, or paid from ₹99 with the colours sorted.',
    template: 'houseparty',
    faq: [
      { q: 'When are Holi parties on Gorave?', a: 'On Holi and the days around it, usually mornings and afternoons. This page shows anything listed around Holi, plus nights with Holi in the name.' },
      { q: 'Are colours provided?', a: 'Check the listing and house rules. Many hosts include colours; some ask you to bring your own.' },
      safety,
    ],
  },
]

export const getOccasion = (slug: string) => OCCASIONS.find(o => o.slug === slug)

/** The next date of an occasion on or after `from` (YYYY-MM-DD), or null if unknown. */
export function nextDate(o: Occasion, from: string) {
  const y = Number(from.slice(0, 4))
  for (const yr of [y, y + 1, y + 2]) {
    const d = o.dates(yr)
    if (!d) continue
    const end = shift(d, o.window[1])
    if (end >= from) return d
  }
  return null
}

export const shift = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export const todayIST = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10)

/** Days from `from` to `to` (both YYYY-MM-DD). */
export const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400e3)

export interface OccasionPlace {
  name: string
  href: string
  count: number
  image: string
}

export interface OccasionProps {
  occasion: Omit<Occasion, 'dates'>
  /** Next date (YYYY-MM-DD) and the window around it */
  date: string | null
  windowStart: string | null
  windowEnd: string | null
  place: { kind: 'india' | 'city' | 'area'; name: string; city?: City; area?: Area }
  events: SampleEvent[]
  /** True when no event matched the occasion and these are upcoming nights instead */
  fallback: boolean
  places: OccasionPlace[]
  others: { slug: string; name: string; emoji: string; date: string | null; image: string; href: string }[]
  crumbs: Crumb[]
}

const inArea = (e: SampleEvent, name: string) => e.area.toLowerCase().startsWith(name.toLowerCase())

export async function occasionPageData(o: Occasion, city?: City, area?: Area): Promise<OccasionProps> {
  const scopeCity = area?.city ?? city
  const today = todayIST()
  const date = nextDate(o, today)
  const windowStart = date ? shift(date, -o.window[0]) : null
  const windowEnd = date ? shift(date, o.window[1]) : null
  const { events: pool } = await cardEvents(
    { ...(scopeCity ? { city: scopeCity.name } : {}), limit: 100 },
    e => !scopeCity || e.city === scopeCity.name,
  )
  const matches = (e: SampleEvent) =>
    o.keywords.some(k => e.title.toLowerCase().includes(k)) || (!!e.date && !!windowStart && !!windowEnd && e.date >= windowStart && e.date <= windowEnd)
  const scoped = area ? pool.filter(e => inArea(e, area.name)) : pool
  const hits = scoped.filter(matches)
  const fallback = hits.length === 0
  const events = (fallback ? scoped.length ? scoped : pool : hits).slice(0, 10)

  const tierHits = pool.filter(matches)
  let places: OccasionPlace[]
  if (!scopeCity) {
    places = CITIES.map(c => ({ name: c.name, href: `/${c.slug}/${o.slug}`, count: tierHits.filter(e => e.city === c.name).length, image: cityStreet(c.slug) }))
  } else {
    const names = area ? area.neighbours : scopeCity.areas
    places = names.map(n => ({ name: n, href: `/${scopeCity.slug}/${areaSlug(n)}/${o.slug}`, count: tierHits.filter(e => inArea(e, n)).length, image: cityStreet(scopeCity.slug) }))
  }

  const base = area ? `/${scopeCity!.slug}/${area.slug}` : scopeCity ? `/${scopeCity.slug}` : ''
  const others = OCCASIONS.filter(x => x.slug !== o.slug)
    .map(x => ({ slug: x.slug, name: x.name, emoji: x.emoji, date: nextDate(x, today), image: x.image, href: `${base}/${x.slug}` }))
    .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))

  const crumbs: Crumb[] = [{ label: 'Home', href: '/' }]
  if (scopeCity) crumbs.push({ label: scopeCity.name, href: `/${scopeCity.slug}` })
  if (area) crumbs.push({ label: area.name, href: `/${scopeCity!.slug}/${area.slug}` })
  crumbs.push({ label: o.name, href: `${base}/${o.slug}` })

  const { dates: _d, ...occasion } = o
  void _d
  return {
    occasion, date, windowStart, windowEnd,
    place: area ? { kind: 'area', name: area.name, city: scopeCity, area } : scopeCity ? { kind: 'city', name: scopeCity.name, city: scopeCity } : { kind: 'india', name: 'India' },
    events, fallback, places, others, crumbs,
  }
}

export const occasionParamsCity = () => CITIES.flatMap(c => OCCASIONS.map(o => ({ city: c.slug, facet: o.slug })))
