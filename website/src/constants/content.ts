import type { PhotoKey } from './media'

// Static content mirrors the app's real catalogue (client/src/constants:
// eventTypes, onboarding CITIES) so website pages and app filters line up.
// Sample events stand in until the public events API exists.

export interface EventType {
  key: string
  slug: string
  label: string
  blurb: string
  photo: PhotoKey
  tint: string
  ink: string
}

export const EVENT_TYPES: EventType[] = [
  { key: 'house_party', slug: 'house-parties', label: 'House Parties', blurb: 'Living rooms that turn into dance floors', photo: 'party1', tint: 'bg-blush', ink: 'text-blush-ink' },
  { key: 'rooftop', slug: 'rooftop-parties', label: 'Rooftops', blurb: 'Sunsets, skylines, one more song', photo: 'roof1', tint: 'bg-sky', ink: 'text-sky-ink' },
  { key: 'game_night', slug: 'game-nights', label: 'Game Nights', blurb: 'Catan, Mafia and friendly betrayal', photo: 'game1', tint: 'bg-sage', ink: 'text-sage-ink' },
  { key: 'dinner', slug: 'supper-clubs', label: 'Supper Clubs', blurb: 'Long tables, strangers, second helpings', photo: 'dine1', tint: 'bg-cream-deep', ink: 'text-ink' },
  { key: 'music', slug: 'gigs', label: 'Gigs & Jams', blurb: 'Living-room gigs and open circles', photo: 'gig1', tint: 'bg-blush', ink: 'text-blush-ink' },
  { key: 'other', slug: 'events', label: 'Everything else', blurb: 'Potlucks, swaps, garba, karaoke', photo: 'fr2', tint: 'bg-sage', ink: 'text-sage-ink' },
]

export interface City {
  name: string
  slug: string
  state: string
  /** Shown in the city hero, e.g. "19.07° N, 72.87° E" */
  coords: string
  areas: string[]
  photo: PhotoKey
}

export const CITIES: City[] = [
  { name: 'Mumbai', slug: 'mumbai', coords: '19.07° N, 72.87° E', state: 'Maharashtra', areas: ['Bandra', 'Khar', 'Andheri', 'Lower Parel', 'Powai', 'Juhu', 'Worli', 'Versova'], photo: 'roof2' },
  { name: 'Bangalore', slug: 'bangalore', coords: '12.97° N, 77.59° E', state: 'Karnataka', areas: ['Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Jayanagar'], photo: 'gig2' },
  { name: 'Delhi', slug: 'delhi', coords: '28.70° N, 77.10° E', state: 'Delhi NCR', areas: ['Hauz Khas', 'Connaught Place', 'GK', 'Saket', 'Vasant Kunj'], photo: 'neon' },
  { name: 'Pune', slug: 'pune', coords: '18.52° N, 73.85° E', state: 'Maharashtra', areas: ['Koregaon Park', 'Baner', 'Viman Nagar'], photo: 'party3' },
  { name: 'Hyderabad', slug: 'hyderabad', coords: '17.38° N, 78.48° E', state: 'Telangana', areas: ['Jubilee Hills', 'Banjara Hills'], photo: 'fest' },
  { name: 'Goa', slug: 'goa', coords: '15.29° N, 74.12° E', state: 'Goa', areas: ['Anjuna', 'Assagao', 'Panjim'], photo: 'roof4' },
  { name: 'Chennai', slug: 'chennai', coords: '13.08° N, 80.27° E', state: 'Tamil Nadu', areas: ['Adyar', 'Besant Nagar'], photo: 'dine3' },
  { name: 'Kolkata', slug: 'kolkata', coords: '22.57° N, 88.36° E', state: 'West Bengal', areas: ['Park Street', 'Salt Lake'], photo: 'gig4' },
]

export interface SampleEvent {
  id: string
  title: string
  type: string
  area: string
  city: string
  when: string
  price: string
  photo: PhotoKey
  going: number
  mix?: string
  request?: boolean
  /** Real cover photo URL (from the API); falls back to `photo` */
  image?: string
}

export const SAMPLE_EVENTS: SampleEvent[] = [
  { id: 'e1', title: 'Sunset Rooftop Sessions', type: 'Rooftop', area: 'Bandra West', city: 'Mumbai', when: 'Sat · 6 PM', price: '₹799', photo: 'roof1', going: 18, mix: '50:50' },
  { id: 'e2', title: 'Bollywood Retro Night', type: 'House Party', area: 'Khar West', city: 'Mumbai', when: 'Sun · 9 PM', price: 'Free', photo: 'party2', going: 12, mix: '50:50', request: true },
  { id: 'e3', title: 'Midnight Board Game Café', type: 'Game Night', area: 'Andheri West', city: 'Mumbai', when: 'Fri · 8 PM', price: 'Free', photo: 'game1', going: 9, request: true },
  { id: 'e4', title: "Chef's Table: Coastal Konkan", type: 'Supper Club', area: 'Lower Parel', city: 'Mumbai', when: 'Tue · 8 PM', price: '₹1,499', photo: 'dine2', going: 6 },
  { id: 'e5', title: 'Indie Gig at the Loft', type: 'Gig', area: 'Versova', city: 'Mumbai', when: 'Thu · 8 PM', price: '₹499', photo: 'gig3', going: 31 },
  { id: 'e6', title: "Girls' Night: Wine & Paint", type: 'House Party', area: 'Juhu', city: 'Mumbai', when: 'Sat · 7 PM', price: 'Free', photo: 'drinks', going: 8, mix: 'Women only', request: true },
  { id: 'e7', title: 'Indiranagar Sundowner', type: 'Rooftop', area: 'Indiranagar', city: 'Bangalore', when: 'Sat · 5 PM', price: '₹699', photo: 'roof4', going: 22, mix: '50:50' },
  { id: 'e8', title: 'Koramangala Ramen Night', type: 'Supper Club', area: 'Koramangala', city: 'Bangalore', when: 'Fri · 8 PM', price: '₹1,199', photo: 'dine3', going: 7 },
  { id: 'e9', title: 'HKV Karaoke Takeover', type: 'Gig', area: 'Hauz Khas', city: 'Delhi', when: 'Sat · 9 PM', price: '₹499', photo: 'neon', going: 19, mix: '50:50' },
  { id: 'e10', title: 'CP Heritage Dinner Walk', type: 'Supper Club', area: 'Connaught Place', city: 'Delhi', when: 'Sun · 7 PM', price: 'Free', photo: 'dine1', going: 11, request: true },
  { id: 'e11', title: 'Koregaon Park Deep House', type: 'Gig', area: 'Koregaon Park', city: 'Pune', when: 'Sat · 9 PM', price: '₹799', photo: 'gig4', going: 40, mix: '50:50' },
  { id: 'e12', title: 'Baner Potluck & Pictionary', type: 'Game Night', area: 'Baner', city: 'Pune', when: 'Fri · 7 PM', price: 'Free', photo: 'fr1', going: 9, request: true },
]

export const BROWSE_CITIES = ['Mumbai', 'Bangalore', 'Delhi', 'Pune'] as const

// ⚠️ PLACEHOLDER — not real reviews. Replace with genuine user quotes (with
// permission) and the live store rating before launch; showing invented
// testimonials or ratings publicly is misleading.
export const TESTIMONIALS = [
  { quote: 'The best events come to me via this app.', name: 'Aditi', city: 'Mumbai' },
  { quote: 'Hosted my first rooftop. 40 strangers, zero chaos.', name: 'Kabir', city: 'Bangalore' },
  { quote: 'Women-only nights are a game changer.', name: 'Neha', city: 'Pune' },
]

export const APP_RATING = { score: '4.9', count: '12k+ ratings' }

// ── City-page posters ─────────────────────────────────────────────────
// City-agnostic flyer set; the area line is filled per city at render time,
// so every city page shows "its own" posters from the same artwork.
export type PosterDef =
  | { kind: 'template'; name: string }
  | { kind: 'photo'; photo: PhotoKey; title: string; when: string; big?: boolean }
  | { kind: 'type'; bg: string; ink: string; title: string; when: string }

export const POSTERS: PosterDef[] = [
  { kind: 'template', name: 'retro' },
  { kind: 'photo', photo: 'party1', title: 'house party', when: 'Sat 9 PM' },
  { kind: 'type', bg: '#C8F25C', ink: '#171310', title: 'game|night', when: 'Fri 8 PM' },
  { kind: 'template', name: 'nightout' },
  { kind: 'photo', photo: 'roof1', title: 'ROOFTOP', when: 'Sat sunset', big: true },
  { kind: 'type', bg: '#FF3864', ink: '#FFF1E6', title: 'retro|bolly|wood', when: 'Sun 9 PM' },
  { kind: 'template', name: 'houseparty' },
  { kind: 'photo', photo: 'dine2', title: 'supper club', when: 'Tue 8 PM' },
  { kind: 'type', bg: '#171310', ink: '#FF6B35', title: 'silent|disco', when: 'Sat 10 PM' },
  { kind: 'template', name: 'beack' },
  { kind: 'photo', photo: 'gig3', title: 'LOFT GIG', when: 'Thu 8 PM', big: true },
  { kind: 'type', bg: '#DCE6F2', ink: '#131E2A', title: 'mafia &|momos', when: 'Fri 9 PM' },
  { kind: 'template', name: 'halloween' },
  { kind: 'photo', photo: 'drinks', title: "girls' night", when: 'Women only' },
  { kind: 'type', bg: '#FFB830', ink: '#2B1418', title: 'garba|night', when: 'Sat 7 PM' },
  { kind: 'template', name: 'christmas' },
]

/** A night's timeline — areas are filled per city. Drives "After dark" + "Now boarding". */
export const NIGHT_SLOTS = [
  { hour: 18, title: 'Sunset Rooftop Sessions', vibe: 'Rooftop', price: '₹799', status: 'Book', poster: 4 },
  { hour: 19, title: "Girls' Night: Wine & Paint", vibe: 'Women only', price: 'Free', status: 'Request', poster: 13 },
  { hour: 20, title: 'Midnight Board Game Café', vibe: 'Game night', price: 'Free', status: 'Request', poster: 2 },
  { hour: 21, title: 'Indie Gig at the Loft', vibe: 'Gig', price: '₹499', status: 'Few left', poster: 10 },
  { hour: 22, title: 'Bollywood Retro Night', vibe: 'House party', price: 'Free', status: 'Request', poster: 5 },
  { hour: 23, title: 'Silent Disco on the Terrace', vibe: 'Rooftop', price: '₹599', status: 'Book', poster: 8 },
  { hour: 25, title: 'After-party Jam Circle', vibe: 'Gig', price: 'Free', status: 'Request', poster: 0 },
]
