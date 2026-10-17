import { CITIES, type City } from '@/constants'
import { areaSlug } from './city'

// Neighbourhood pages (/mumbai/bandra). Each area gets a short, honest
// profile — the general character people know it for, never claims about
// specific venues or numbers. Everything else on the page is templated.

export interface AreaProfile {
  /** One line, reads after the area name: "Bandra — ___" */
  line: string
  /** A sentence or two on what a night out here feels like */
  vibe: string
  /** Three short things the area is known for */
  knownFor: [string, string, string]
  /** Mood words used by the word-reveal section */
  moods: [string, string, string]
}

const P = (line: string, vibe: string, knownFor: [string, string, string], moods: [string, string, string]): AreaProfile => ({ line, vibe, knownFor, moods })

export const AREA_PROFILES: Record<string, AreaProfile> = {
  // Mumbai
  'mumbai/bandra': P('the suburb that never quite goes to bed', 'Old cottages, sea-facing promenades and apartments where the living room is always a little too small for the party. Bandra does house parties like nowhere else.', ['Sea-facing promenades', 'Old village lanes', 'Late-night food runs'], ['artsy', 'buzzing', 'by the sea']),
  'mumbai/khar': P('Bandra’s quieter, cosier neighbour', 'Leafy lanes, rooftop terraces and the kind of apartment gatherings that start at dinner and end at sunrise.', ['Rooftop terraces', 'Leafy residential lanes', 'Small, close crowds'], ['cosy', 'leafy', 'easy-going']),
  'mumbai/andheri': P('big, busy and full of people who just moved here', 'Studios, startups and a lot of flatmates — Andheri’s nights are game nights, gigs and parties where half the room are new friends.', ['Flatmate parties', 'Creative crowd', 'Easy metro access'], ['young', 'restless', 'social']),
  'mumbai/lower-parel': P('mill-district lofts, now the city’s after-work living room', 'Converted mills and high-rises with views — rooftops and dinner parties for the after-work crowd.', ['Converted mill lofts', 'High-rise views', 'After-work plans'], ['sleek', 'after-work', 'skyline']),
  'mumbai/powai': P('the lakeside neighbourhood with its own little world', 'Around the lake it’s calmer than the rest of the city — perfect for game nights, potlucks and long balcony conversations.', ['The lake', 'Tower balconies', 'Tight-knit circles'], ['calm', 'lakeside', 'friendly']),
  'mumbai/juhu': P('beach sunsets and long evenings', 'Evenings start by the sea and drift into terraces and living rooms — Juhu nights are slow, warm and late.', ['Beach sunsets', 'Bungalow terraces', 'Slow late nights'], ['breezy', 'golden', 'unhurried']),
  'mumbai/worli': P('sea-link views and sky-high terraces', 'High floors, sea views and dinner parties where the skyline does half the hosting.', ['Sea-link views', 'High-floor terraces', 'Dinner parties'], ['polished', 'glittering', 'seaside']),
  'mumbai/versova': P('the creative coast of Mumbai', 'Actors, writers and musicians in walk-up flats — Versova does gigs, jams and living-room screenings.', ['Living-room gigs', 'Creative crowd', 'Coastal lanes'], ['indie', 'musical', 'bohemian']),
  // Bangalore
  'bangalore/indiranagar': P('Bangalore’s favourite night-out neighbourhood', 'Tree-lined roads and homes with terraces — the house parties here have playlists people talk about for weeks.', ['Tree-lined avenues', 'Terrace parties', 'Great playlists'], ['lively', 'leafy', 'musical']),
  'bangalore/koramangala': P('where the startup crowd unwinds', 'Flats full of founders and flatmates — game nights, potlucks and parties that spill onto the balcony.', ['Startup crowd', 'Flatmate parties', 'Balcony hangs'], ['young', 'buzzing', 'social']),
  'bangalore/hsr-layout': P('wide roads, new friends', 'Newer apartments and a crowd that just moved to the city — the easiest place in Bangalore to meet people.', ['New-in-town crowd', 'Apartment parties', 'Game nights'], ['fresh', 'friendly', 'easy']),
  'bangalore/whitefield': P('the tech east, with its own weekend', 'Gated communities and clubhouses — Whitefield’s nights are dinner parties, game nights and rooftop sundowners.', ['Community gatherings', 'Rooftop sundowners', 'Weekend plans'], ['relaxed', 'spacious', 'community']),
  'bangalore/jayanagar': P('old Bangalore, warm and unhurried', 'Classic homes, green parks and gatherings that feel like family dinners — just with new people.', ['Old-Bangalore homes', 'Green parks', 'Dinner gatherings'], ['warm', 'classic', 'homely']),
  // Delhi
  'delhi/hauz-khas': P('ruins, lakes and the city’s liveliest lanes', 'Medieval ruins next to rooftop terraces — Hauz Khas nights have a backdrop no other neighbourhood can match.', ['Historic ruins', 'Rooftop terraces', 'Lively lanes'], ['historic', 'lively', 'arty']),
  'delhi/connaught-place': P('the heart of the city, in a circle', 'Colonnades and central apartments — CP is where friends from every corner of Delhi can meet in the middle.', ['Central location', 'Colonial colonnades', 'Easy to reach'], ['central', 'classic', 'buzzing']),
  'delhi/gk': P('South Delhi terraces and long winter nights', 'Bungalows, barsatis and winter terraces with heaters on — GK knows how to host.', ['Barsati rooftops', 'Winter terrace nights', 'Dinner parties'], ['cosy', 'south delhi', 'warm']),
  'delhi/saket': P('easygoing, central-south and always up for plans', 'Apartments near everything — Saket does game nights, birthdays and Sunday afternoon gatherings.', ['Apartment gatherings', 'Game nights', 'Sunday plans'], ['easy', 'friendly', 'social']),
  'delhi/vasant-kunj': P('green, spacious and quietly social', 'Wide sectors and big balconies — dinner parties and slow evenings with the Aravalli breeze.', ['Green sectors', 'Big balconies', 'Dinner parties'], ['green', 'spacious', 'calm']),
  // Pune
  'pune/koregaon-park': P('banyan trees and Pune’s most social lanes', 'Old bungalows under huge trees — Koregaon Park evenings are garden parties, gigs and late dinners.', ['Banyan-lined lanes', 'Garden gatherings', 'Late dinners'], ['leafy', 'artsy', 'social']),
  'pune/baner': P('new Pune, fast friends', 'Fresh apartments and a young crowd — Baner’s weekends are rooftop parties and game nights.', ['New apartments', 'Young crowd', 'Rooftop weekends'], ['young', 'fresh', 'buzzing']),
  'pune/viman-nagar': P('close to the airport, closer to the party', 'Students and professionals side by side — easy-going house parties with people from everywhere.', ['Mixed crowd', 'House parties', 'Easy weekends'], ['easy', 'diverse', 'friendly']),
  // Hyderabad
  'hyderabad/jubilee-hills': P('hillside homes and terrace nights', 'Rock-studded hills, big terraces and parties with the whole city glittering below.', ['Hillside terraces', 'City views', 'Big gatherings'], ['grand', 'glittering', 'warm']),
  'hyderabad/banjara-hills': P('Hyderabad’s classic going-out neighbourhood', 'Leafy roads and long dinners — Banjara Hills does dinner parties and late-night biryani runs.', ['Dinner parties', 'Leafy roads', 'Late biryani runs'], ['classic', 'foodie', 'easy']),
  // Goa
  'goa/anjuna': P('the coast where the night is the main event', 'Palm groves, old houses and music that drifts across the fields — Anjuna has always done the long night out.', ['Palm-grove parties', 'Music under the stars', 'Sunset starts'], ['free', 'musical', 'coastal']),
  'goa/assagao': P('Goa’s gentle, gorgeous village', 'Portuguese villas, quiet lanes and long-table dinners that run late into the night.', ['Portuguese villas', 'Long-table dinners', 'Quiet lanes'], ['gentle', 'stylish', 'slow']),
  'goa/panjim': P('the little capital with old-world charm', 'Colourful Latin-quarter houses and balconies — Panjim does intimate gigs and dinner parties.', ['Latin-quarter lanes', 'Balcony evenings', 'Intimate gigs'], ['charming', 'colourful', 'intimate']),
  // Chennai
  'chennai/adyar': P('green, breezy and close to the sea', 'Tree-shaded streets near the river and the beach — Adyar gatherings are warm, musical and well fed.', ['Tree-shaded streets', 'Music at home', 'Great home food'], ['breezy', 'musical', 'warm']),
  'chennai/besant-nagar': P('Bessie — beach walks and late conversations', 'Evenings by Elliot’s beach that move into terraces and living rooms.', ['Beach evenings', 'Terrace hangs', 'Late conversations'], ['seaside', 'easy', 'young']),
  // Kolkata
  'kolkata/park-street': P('Kolkata’s grand old going-out street', 'Old buildings, music history and a city that loves a long adda — Park Street nights are timeless.', ['Live-music heritage', 'Old-world buildings', 'Long addas'], ['timeless', 'musical', 'grand']),
  'kolkata/salt-lake': P('planned sectors, warm hosts', 'Quiet sectors and big hearts — Salt Lake does dinners, quiz nights and adda that goes past midnight.', ['Quiz & game nights', 'Home dinners', 'Midnight adda'], ['warm', 'quiet', 'clever']),
}

export interface Area {
  name: string
  slug: string
  city: City
  profile: AreaProfile
  /** Other areas in the same city */
  neighbours: string[]
}

export function getArea(citySlug: string, slug: string): Area | undefined {
  const city = CITIES.find(c => c.slug === citySlug)
  const name = city?.areas.find(a => areaSlug(a) === slug)
  if (!city || !name) return undefined
  const profile = AREA_PROFILES[`${city.slug}/${slug}`] ?? P(
    `a neighbourhood in ${city.name}`,
    `House parties, rooftops and game nights hosted by people who live in ${name}.`,
    ['House parties', 'Rooftops', 'Game nights'],
    ['local', 'social', 'warm'],
  )
  return { name, slug, city, profile, neighbours: city.areas.filter(a => a !== name) }
}

export const allAreaParams = () => CITIES.flatMap(c => c.areas.map(a => ({ city: c.slug, facet: areaSlug(a) })))

export function areaFaq(area: Area) {
  const { name, city } = area
  return [
    { q: `Are there house parties in ${name}?`, a: `Yes — hosts in and around ${name} list house parties, rooftops, game nights and dinner parties on Gorave. Free ones are request-to-join; paid ones book instantly with UPI.` },
    { q: `Will I see the exact address in ${name}?`, a: `Not until you’re confirmed. Before that you only see “${name}, ${city.name}” and an approximate area on the map. Confirmed guests get the full address and a QR ticket.` },
    { q: `Can I host in ${name}?`, a: 'Yes. Listing is free and takes a few minutes in the app. You can run 2 free-entry events a month; on paid events (from ₹99) you keep 90% of every ticket.' },
    { q: `Is it safe to go to a party in ${name} alone?`, a: 'Every guest is phone-verified and 18+, hosts approve who comes, and SOS shares your live location with up to 5 emergency contacts. Many people go solo — check the host’s reviews and the crowd mix before you request.' },
  ]
}

// Generated imagery (OpenArt, Nano Banana 2) — one blue-hour street per city
// plus six scenes shared by every neighbourhood. Files live in public/img/areas.
export const cityStreet = (citySlug: string) => `/img/areas/city-${citySlug}.webp`

export const AREA_SCENES = {
  building: '/img/areas/building.webp',
  chai: '/img/areas/chai.webp',
  rooftop: '/img/areas/rooftop.webp',
  livingroom: '/img/areas/livingroom.webp',
  latebite: '/img/areas/latebite.webp',
  doorway: '/img/areas/doorway.webp',
} as const

/** A typical night in the neighbourhood — the stops used by "the walk" sections. */
export const NIGHT_WALK = [
  { time: '7:30 PM', title: 'Chai on the corner', detail: 'Everyone meets somewhere before the address unlocks.', image: AREA_SCENES.chai },
  { time: '9:00 PM', title: 'Up on the roof', detail: 'Sundowners turn into the first song.', image: AREA_SCENES.rooftop },
  { time: '11:00 PM', title: 'The living room', detail: 'Shoes off, music up, new friends.', image: AREA_SCENES.livingroom },
  { time: '1:30 AM', title: 'The late bite', detail: 'Nobody goes straight home.', image: AREA_SCENES.latebite },
] as const
