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
  areas: string[]
  photo: PhotoKey
}

export const CITIES: City[] = [
  { name: 'Mumbai', slug: 'mumbai', areas: ['Bandra', 'Khar', 'Andheri', 'Lower Parel', 'Powai'], photo: 'roof2' },
  { name: 'Bangalore', slug: 'bangalore', areas: ['Indiranagar', 'Koramangala', 'HSR'], photo: 'gig2' },
  { name: 'Delhi', slug: 'delhi', areas: ['Hauz Khas', 'CP', 'GK'], photo: 'neon' },
  { name: 'Pune', slug: 'pune', areas: ['Koregaon Park', 'Baner', 'Viman Nagar'], photo: 'party3' },
  { name: 'Hyderabad', slug: 'hyderabad', areas: ['Jubilee Hills', 'Banjara Hills'], photo: 'fest' },
  { name: 'Goa', slug: 'goa', areas: ['Anjuna', 'Assagao', 'Panjim'], photo: 'roof4' },
  { name: 'Chennai', slug: 'chennai', areas: ['Adyar', 'Besant Nagar'], photo: 'dine3' },
  { name: 'Kolkata', slug: 'kolkata', areas: ['Park Street', 'Salt Lake'], photo: 'gig4' },
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
