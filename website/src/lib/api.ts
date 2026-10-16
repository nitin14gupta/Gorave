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

export const fetchEvent = (id: string) => get<PublicEvent & { description: string | null; rules: string | null }>(`/public/events/${encodeURIComponent(id)}`)

// ── Adapters ──────────────────────────────────────────────────────────────

export const TYPE_LABEL: Record<string, string> = {
  house_party: 'House Party', rooftop: 'Rooftop', game_night: 'Game Night', dinner: 'Supper Club', music: 'Gig', other: 'Event',
}

function whenLabel(iso: string) {
  const d = new Date(iso)
  const day = d.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' })
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: d.getMinutes() ? '2-digit' : undefined, timeZone: 'Asia/Kolkata' }).replace(':00', '').toUpperCase()
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
  }
}

/** Live events for a query, or sample events matching it if the API is down. */
export async function cardEvents(q: PublicEventsQuery, sampleFilter: (e: SampleEvent) => boolean) {
  const res = await fetchEvents(q)
  if (res) return { events: res.events.map(toCardEvent), total: res.total, live: true }
  const events = SAMPLE_EVENTS.filter(sampleFilter)
  return { events, total: events.length, live: false }
}
