'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Users, MapPin, ImageOff, CalendarDays, Inbox } from 'lucide-react'
import { useEventsQuery, useEventCitiesQuery } from '@/hooks/useEvents'
import { usePagination } from '@/hooks/usePagination'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { FilterChip } from '@/components/ui/FilterChip'
import { PageHeader } from '@/components/ui/PageHeader'
import { Toolbar } from '@/components/ui/Toolbar'
import { ListShell } from '@/components/ui/ListShell'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { formatDate, formatInr } from '@/lib/formatters'
import { crowdLabel } from '@/lib/crowd'

const TABS = [
  { value: 'active', label: 'Active' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

const ALL = 'all'
const JOIN_MODES = [
  { value: ALL, label: 'Any way in' },
  { value: 'request', label: 'Request to join' },
  { value: 'instant', label: 'Instant' },
]
const CROWDS = [
  { value: ALL, label: 'Any crowd' },
  { value: 'open', label: 'Open crowd' },
  { value: 'mixed', label: 'Set ratio' },
  { value: 'women', label: 'Women only' },
  { value: 'men', label: 'Men only' },
]

export default function EventsPage() {
  const [status, setStatus] = useState<string>('active')
  const [q, setQ] = useState('')
  const [city, setCity] = useState(ALL)
  const [joinMode, setJoinMode] = useState(ALL)
  const [crowd, setCrowd] = useState(ALL)
  const { page, pageSize, setPage, setPageSize } = usePagination(12)
  const cities = useEventCitiesQuery().data?.items ?? []

  const { data, isLoading } = useEventsQuery({
    status, q, page, pageSize,
    city: city === ALL ? undefined : city,
    joinMode: joinMode === ALL ? undefined : joinMode,
    crowd: crowd === ALL ? undefined : crowd,
  })
  const reset = () => setPage(1)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'Events' }]}
        title="Events"
        subtitle={data ? `${data.total.toLocaleString()} ${status} events` : 'Loading…'}
      />

      <Toolbar>
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <FilterChip key={t.value} label={t.label} active={status === t.value} onClick={() => { setStatus(t.value); reset() }} />
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-secondary" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); reset() }} placeholder="Search by title or host" className="w-64 pl-9" />
        </div>
      </Toolbar>

      <div className="flex flex-wrap gap-2">
        <Select value={city} onValueChange={(v) => { setCity(v); reset() }}>
          <SelectTrigger className="min-w-[160px]"><SelectValue placeholder="City" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All cities</SelectItem>
            {cities.map((c) => <SelectItem key={c.city} value={c.city}>{c.city} · {c.count}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={joinMode} onValueChange={(v) => { setJoinMode(v); reset() }}>
          <SelectTrigger className="min-w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>{JOIN_MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={crowd} onValueChange={(v) => { setCrowd(v); reset() }}>
          <SelectTrigger className="min-w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>{CROWDS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <ListShell
        emptyIcon={CalendarDays}
        isLoading={isLoading}
        empty={!isLoading && data?.items.length === 0}
        emptyLabel={`No ${status} events`}
        total={data?.total ?? 0}
        page={data?.page ?? 1}
        pageSize={data?.page_size ?? pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        skeletonCount={6}
        skeletonHeight="h-[420px]"
        grid
        card={false}
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.items.map((e) => (
            <Link key={e.id} href={`/events/${e.id}`} className="group">
              <Card className="overflow-hidden transition-transform duration-300 group-hover:-translate-y-1">
                {/* Event posters are 4:5 in the app */}
                <div className="relative aspect-[4/5] w-full bg-surface-muted">
                  {e.cover_photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.cover_photos[0].url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-ink-secondary"><ImageOff className="h-8 w-8" /></div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    {e.is_cancelled && <Badge variant="danger">Cancelled</Badge>}
                    {e.join_mode === 'request' && e.pending_requests > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-0.5 font-sans text-xs font-bold text-white">
                        <Inbox className="h-3 w-3" /> {e.pending_requests} waiting
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-x-3 bottom-3 text-white">
                    <h3 className="line-clamp-2 font-display text-lg font-extrabold leading-tight">{e.title}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-white/85">
                      <MapPin className="h-3 w-3" /> {[e.area, e.city].filter(Boolean).join(', ') || 'No area'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 p-4">
                  <p className="text-xs text-ink-secondary">{formatDate(e.date_time)} · by {e.host_name ?? 'Unknown'}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="neutral">{e.join_mode === 'request' ? 'Request' : 'Instant'}</Badge>
                    <Badge variant="neutral">{crowdLabel(e.women_pct)}</Badge>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1 text-xs text-ink-secondary"><Users className="h-3.5 w-3.5" /> {e.attendee_count}/{e.capacity}</span>
                    <span className="text-sm font-semibold text-ink-primary">{e.is_free ? 'Free' : formatInr(e.price_inr + e.platform_fee_inr)}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </ListShell>
    </div>
  )
}
