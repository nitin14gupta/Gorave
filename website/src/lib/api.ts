import { EVENT_TYPES, SAMPLE_EVENTS, type SampleEvent } from '@/constants'

// Server-side client for the public API (server/routes/public.py). Responses
// are cached by Next for REVALIDATE seconds. If the API is unreachable (local
// dev without the server, or a build with no network) callers get `null` and
// fall back to sample content, so pages never fail to build.

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const REVALIDATE = 60

export interface PublicHost {
  name: string | null
  username: string | null
  avatar: string | null
  badges: string[]
  avg_rating: number | null
  review_count: number
}

export interface PublicEvent {
  id: string
  title: string
  event_type: string
  date_time: string
  end_time: string | null
  city: string | null
  area: string | null
  lat: number | null
  lng: number | null
  price_inr: number
  is_free: boolean
  join_mode: 'instant' | 'request'
  women_pct: number | null
  age_restriction: number
  capacity: number
  spots_left: number
  attendee_count: number
  cover_photos: string[]
  is_cancelled: boolean
  host: PublicHost
}

export interface PublicEventsQuery {
  city?: string
  type?: string
  area?: string
  when?: 'tonight' | 'weekend' | 'week'
  free?: boolean
  max_price?: number
  women_only?: boolean
  balanced?: boolean
  min_age?: number
  limit?: number
}

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: REVALIDATE }, signal: AbortSignal.timeout(4000) })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function fetchEvents(q: PublicEventsQuery = {}) {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null) params.set(k, String(v))
  return get<{ events: PublicEvent[]; total: number; has_more: boolean }>(`/public/events?${params}`)
}

export interface PublicEventDetail extends PublicEvent {
  description: string | null
  rules: string | null
  ratio: { women_pct: number; women_left: number; men_left: number; open_left: number } | null
  avg_rating: number | null
  review_count: number
}

export interface PublicHostProfile {
  name: string | null
  username: string
  avatar: string | null
  city: string | null
  badges: string[]
  hosted_count: number
  avg_rating: number | null
  review_count: number
  upcoming: PublicEvent[]
  places: { city: string; area: string | null; count: number }[]
  types: string[]
}

export interface PublicHostCard extends PublicHost {
  username: string
  city: string | null
  hosted_count: number
  upcoming_count: number
  areas: string[]
}

export const fetchHosts = (city: string, area?: string, limit = 24) =>
  get<{ hosts: PublicHostCard[]; total: number }>(`/public/hosts?${new URLSearchParams({ city, limit: String(limit), ...(area ? { area } : {}) })}`)

export interface PublicCity {
  name: string
  state: string
  upcoming_events: number
}

// Event ids are uuids; anything else 404s without a round trip.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const fetchEvent = (id: string) =>
  UUID.test(id) ? get<PublicEventDetail>(`/public/events/${encodeURIComponent(id)}`) : Promise.resolve(null)

export const fetchHost = (username: string) =>
  /^[a-z0-9_.]{2,40}$/i.test(username) ? get<PublicHostProfile>(`/public/hosts/${encodeURIComponent(username)}`) : Promise.resolve(null)

export const fetchCities = () => get<PublicCity[]>('/public/cities')

export interface PublicReviews {
  avg_rating: number | null
  review_count: number
  reviews: { rating: number; body: string; name: string; city: string | null; event_type: string; event_title: string }[]
}

export const fetchReviews = (limit = 4) => get<PublicReviews>(`/public/reviews?limit=${limit}`)

/** The API sends "2026-10-17 14:30:00+00"; make it strict ISO so every runtime parses it. */
export function parseApiDate(s: string) {
  return new Date(s.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
}

/** "Saturday, 18 October · 9 PM" in IST. */
export function longWhen(iso: string) {
  const d = parseApiDate(iso)
  const day = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' })
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).replace(':00', '').toUpperCase()
  return `${day} · ${time}`
}

// ── Adapters ──────────────────────────────────────────────────────────────

export const TYPE_LABEL: Record<string, string> = {
  house_party: 'House Party', rooftop: 'Rooftop', game_night: 'Game Night', dinner: 'Dinner Party', music: 'Music Night', other: 'Event',
}

function whenLabel(iso: string) {
  const d = parseApiDate(iso)
  const day = d.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' })
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).replace(':00', '').toUpperCase()
  return `${day} · ${time}`
}

/** Shapes an API event for the existing card components. */
export function toCardEvent(e: PublicEvent): SampleEvent {
  return {
    id: e.id,
    title: e.title,
    type: TYPE_LABEL[e.event_type] ?? 'Event',
    area: e.area ?? e.city ?? '',
    city: e.city ?? '',
    when: whenLabel(e.date_time),
    price: e.is_free ? 'Free' : `₹${e.price_inr.toLocaleString('en-IN')}`,
    photo: EVENT_TYPES.find(t => t.key === e.event_type)?.photo ?? 'party1',
    image: e.cover_photos[0],
    going: e.attendee_count,
    mix: e.women_pct == null ? undefined : e.women_pct >= 100 ? 'Women only' : e.women_pct <= 0 ? 'Men only' : `${e.women_pct}:${100 - e.women_pct}`,
    request: e.join_mode === 'request',
    hour: istHour(e.date_time),
    date: istDate(e.date_time),
    clock: parseApiDate(e.date_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
    spotsLeft: e.spots_left,
  }
}

/** IST calendar date as YYYY-MM-DD. */
export const istDate = (iso: string | Date) =>
  (typeof iso === 'string' ? parseApiDate(iso) : iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

/** IST start hour; 12 AM–5 AM count as 24–29 so a night sorts in order. */
function istHour(iso: string) {
  const h = Number(parseApiDate(iso).toLocaleString('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' })) % 24
  return h < 6 ? h + 24 : h
}

/** Live events for a query, or sample events matching it if the API is down. */
export async function cardEvents(q: PublicEventsQuery, sampleFilter: (e: SampleEvent) => boolean) {
  const res = await fetchEvents(q)
  if (res) return { events: res.events.map(toCardEvent), total: res.total, live: true }
  const events = SAMPLE_EVENTS.filter(sampleFilter)
  return { events, total: events.length, live: false }
}
