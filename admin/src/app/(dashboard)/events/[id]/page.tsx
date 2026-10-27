'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  MapPin, Calendar, Users, Ban, Star, ShieldAlert, Clock, Inbox,
} from 'lucide-react'
import { useEventQuery, useCancelEventMutation } from '@/hooks/useEvents'
import { useTabParam } from '@/hooks/useTabParam'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { ImageSlider } from '@/components/ui/ImageSlider'
import { ImageModal } from '@/components/ui/ImageModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageHeader } from '@/components/ui/PageHeader'
import { DetailStatsRow, DetailStat } from '@/components/ui/DetailStats'
import { formatDate, formatInr } from '@/lib/formatters'
import { useToast } from '@/hooks/useToast'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { crowdLabel } from '@/lib/crowd'
import type { EventDetailInfo } from '@/types/event'

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()
  const { admin } = useAdminAuth()
  const isSuperAdmin = admin?.role === 'super_admin'
  const [cancelOpen, setCancelOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [tab, setTab] = useTabParam('attendees')

  const { data, isLoading } = useEventQuery(id)
  const cancelMutation = useCancelEventMutation(id)

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync()
      toast.success('Event cancelled and attendees refunded')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to cancel event')
    }
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const { event } = data
  const attendeeTotal = event.price_inr + event.platform_fee_inr

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'Events', href: '/events' }, { label: event.title }]}
        title={event.title}
        subtitle={`${formatDate(event.date_time)}${event.location_name ? ` · ${event.location_name}` : ''}`}
        actions={
          !event.is_cancelled && isSuperAdmin ? (
            <Button variant="destructive" onClick={() => setCancelOpen(true)}>
              <Ban className="h-4 w-4" /> Force-cancel event
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ImageSlider photos={event.cover_photos} aspect="4:5" className="mx-auto max-w-[360px]" onImageClick={() => setGalleryOpen(true)} />
        </div>
        <ImageModal
          photos={event.cover_photos}
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
        />

        <Card className="lg:col-span-2">
          <CardContent className="flex h-full flex-col justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {event.is_cancelled ? (
                  <Badge variant="danger">Cancelled</Badge>
                ) : (() => {
                  const now = new Date()
                  const start = new Date(event.date_time)
                  const end = event.end_time ? new Date(event.end_time) : start
                  if (now < start) return <Badge variant="success">Upcoming</Badge>
                  if (now > end) return <Badge variant="neutral">Past</Badge>
                  return <Badge variant="warning">Active now</Badge>
                })()}
                <Badge variant="neutral" className="capitalize">{event.event_type}</Badge>
                <Badge variant="neutral">{event.age_restriction}+</Badge>
                <Badge variant="neutral">{crowdLabel(event.women_pct)}</Badge>
                <Badge variant="neutral">{event.join_mode === 'request' ? 'Request to join' : 'Instant join'}</Badge>
                {event.join_mode === 'request' && event.pending_requests > 0 && (
                  <Badge variant="warning">{event.pending_requests} waiting for the host</Badge>
                )}
              </div>
              <p className="flex items-center gap-1.5 text-sm text-ink-secondary">
                <Calendar className="h-4 w-4" /> {formatDate(event.date_time)}
                {event.end_time && ` → ${formatDate(event.end_time)}`}
              </p>
              {event.location_name && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-secondary">
                  <MapPin className="h-4 w-4" /> {event.location_name}
                </p>
              )}
              <p className="mt-1 text-sm text-ink-secondary">
                Hosted by{' '}
                <Link href={`/users/${event.host_id}`} className="font-semibold text-ink-primary underline decoration-divider underline-offset-4 hover:decoration-ink-primary">
                  {event.host_name ?? 'Unknown'}
                </Link>
                {' · '}{event.host_phone}
              </p>
              {event.description && (
                <p className="mt-3 whitespace-pre-line text-sm text-ink-secondary">{event.description}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <DetailStatsRow>
        <DetailStat
          label="Attendees"
          value={`${data.attendees.length}/${event.capacity}`}
          icon={Users}
        />
        <DetailStat
          label="Women / Men / Other"
          value={`${event.gender_counts.women} / ${event.gender_counts.men} / ${event.gender_counts.other}`}
          icon={Users}
        />
        <DetailStat label="Waitlist" value={String(data.waitlist.length)} icon={Clock} />
        <DetailStat label="Requests waiting" value={String(event.pending_requests)} icon={Inbox} />
        <DetailStat label="Avg rating" value={event.avg_rating ? `${event.avg_rating} ★` : '—'} icon={Star} />
        <DetailStat label="Reports" value={String(data.reports.length)} icon={ShieldAlert} />
      </DetailStatsRow>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AddressCard event={event} />
        <CrowdCard event={event} />
      </div>

      <Card>
        <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Field label="Ticket price" value={event.is_free ? 'Free' : formatInr(event.price_inr)} />
          <Field label="Platform fee (attendee pays)" value={event.is_free ? '—' : formatInr(event.platform_fee_inr)} />
          <Field label="Attendee pays total" value={event.is_free ? 'Free' : formatInr(attendeeTotal)} />
          <Field label="Host commission (10%)" value={event.is_free ? '—' : formatInr(event.host_commission_inr)} />
          <Field label="Host receives" value={event.is_free ? '—' : formatInr(event.price_inr - event.host_commission_inr)} />
          <Field label="Platform profit / ticket" value={event.is_free ? '—' : formatInr(event.platform_profit_inr)} />
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="attendees">Attendees ({data.attendees.length})</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist ({data.waitlist.length})</TabsTrigger>
          <TabsTrigger value="requests">Requests ({data.requests.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({data.reviews.length})</TabsTrigger>
          <TabsTrigger value="reports">Reports ({data.reports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="attendees">
          <Card>
            <CardContent className="p-0">
              <Table>
                <THead><TR><TH>Name</TH><TH>Gender</TH><TH>Phone</TH><TH>Joined</TH><TH>Checked in</TH></TR></THead>
                <TBody>
                  {data.attendees.map((a) => (
                    <TR key={a.id}>
                      <TD><Link href={`/users/${a.user_id}`} className="hover:underline">{a.name ?? 'Unnamed'}</Link></TD>
                      <TD>{a.gender ?? '—'}</TD>
                      <TD>{a.phone}</TD>
                      <TD>{formatDate(a.joined_at)}</TD>
                      <TD>{a.checked_in_at ? formatDate(a.checked_in_at) : '—'}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waitlist">
          <Card>
            <CardContent className="p-0">
              <Table>
                <THead><TR><TH>Name</TH><TH>Phone</TH><TH>Joined queue</TH><TH>Offer expires</TH></TR></THead>
                <TBody>
                  {data.waitlist.map((w) => (
                    <TR key={w.id}>
                      <TD><Link href={`/users/${w.user_id}`} className="hover:underline">{w.name ?? 'Unnamed'}</Link></TD>
                      <TD>{w.phone}</TD>
                      <TD>{formatDate(w.joined_at)}</TD>
                      <TD>{w.offer_expires_at ? formatDate(w.offer_expires_at) : '—'}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardContent className="p-0">
              {data.requests.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-ink-secondary">
                  {event.join_mode === 'request' ? 'No join requests yet' : 'This event is instant join, so there are no requests'}
                </p>
              ) : (
                <Table>
                  <THead><TR><TH>Person</TH><TH>Status</TH><TH>Gender · age</TH><TH>City</TH><TH>Asked</TH><TH>Decided</TH><TH>Tries</TH></TR></THead>
                  <TBody>
                    {data.requests.map((r) => (
                      <TR key={r.id}>
                        <TD>
                          <Link href={`/users/${r.user_id}`} className="flex items-center gap-2.5 hover:underline">
                            {r.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.avatar} alt="" className="h-8 w-8 rounded-lg object-cover" />
                            ) : <span className="h-8 w-8 rounded-lg bg-surface-muted" />}
                            {r.name ?? 'Unnamed'}
                          </Link>
                        </TD>
                        <TD>
                          <Badge variant={r.status === 'requested' ? 'warning' : r.status === 'declined' ? 'danger' : 'neutral'}>
                            {r.status === 'requested' ? 'Waiting' : r.status}
                          </Badge>
                        </TD>
                        <TD>{[r.gender, r.age ? String(r.age) : null].filter(Boolean).join(' · ') || '—'}</TD>
                        <TD>{r.city ?? '—'}</TD>
                        <TD>{r.requested_at ? formatDate(r.requested_at) : '—'}</TD>
                        <TD>{r.decided_at ? formatDate(r.decided_at) : '—'}</TD>
                        <TD>{r.request_count}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <div className="flex flex-col gap-3">
            {data.reviews.length === 0 && <p className="text-sm text-ink-secondary">No reviews yet</p>}
            {data.reviews.map((r) => (
              <Card key={r.id}>
                <CardContent>
                  <div className="mb-1 flex items-center justify-between">
                    <Link href={`/users/${r.user_id}`} className="font-medium hover:underline">{r.name ?? 'Unnamed'}</Link>
                    <Badge variant="warning">{r.rating} ★</Badge>
                  </div>
                  {r.body && <p className="text-sm text-ink-secondary">{r.body}</p>}
                  <p className="mt-1 text-xs text-ink-secondary">{formatDate(r.created_at)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardContent className="p-0">
              <Table>
                <THead><TR><TH>Reported by</TH><TH>Reason</TH><TH>Description</TH><TH>Date</TH></TR></THead>
                <TBody>
                  {data.reports.map((r) => (
                    <TR key={r.id}>
                      <TD><Link href={`/users/${r.user_id}`} className="hover:underline">{r.name ?? 'Unnamed'}</Link></TD>
                      <TD className="capitalize">{r.reason.replace(/_/g, ' ')}</TD>
                      <TD>{r.description ?? '—'}</TD>
                      <TD>{formatDate(r.created_at)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Force-cancel this event?"
        description="All confirmed attendees will be notified and paid attendees refunded to their Gorave Wallet. This cannot be undone."
        confirmLabel="Cancel event"
        variant="destructive"
        onConfirm={handleCancel}
      />
    </div>
  )
}

/** Where it is. The exact lines are private in the app (guests see them once they're in). */
function AddressCard({ event }: { event: EventDetailInfo }) {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Address</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <Field label="City" value={event.city ?? '—'} />
        <Field label="Area" value={event.area ?? '—'} />
        <Field label="Address line 1" value={event.address_line1 ?? '—'} />
        <Field label="Address line 2" value={event.address_line2 ?? '—'} />
        <Field label="Pincode" value={event.pincode ?? '—'} />
        <Field
          label="Pin"
          value={event.location_lat != null && event.location_lng != null ? `${Number(event.location_lat).toFixed(5)}, ${Number(event.location_lng).toFixed(5)}` : '—'}
        />
      </CardContent>
    </Card>
  )
}

/** Who's in by gender, against the host's split (going plus held waitlist offers). */
function CrowdCard({ event }: { event: EventDetailInfo }) {
  const c = event.gender_counts
  const q = event.quota
  const rows = q
    ? [
        { label: 'Women', have: c.women, of: q.women },
        { label: 'Men', have: c.men, of: q.men },
        { label: 'Open spots', have: Math.max(0, c.women - q.women) + Math.max(0, c.men - q.men) + c.other, of: q.open },
      ]
    : [
        { label: 'Women', have: c.women, of: event.capacity },
        { label: 'Men', have: c.men, of: event.capacity },
        { label: 'Other / not said', have: c.other, of: event.capacity },
      ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Crowd mix · {crowdLabel(event.women_pct)}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="text-ink-secondary">{r.label}</span>
              <span className="font-semibold text-ink-primary">{r.have}{q ? ` of ${r.of}` : ''}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full rounded-full bg-ink-primary" style={{ width: `${r.of ? Math.min(100, (r.have / r.of) * 100) : 0}%` }} />
            </div>
          </div>
        ))}
        {event.ratio_left ? (
          <p className="text-xs text-ink-secondary">
            Room left: {event.ratio_left.women_left} for women, {event.ratio_left.men_left} for men ({event.ratio_left.open_left} open spots either can take).
          </p>
        ) : (
          <p className="text-xs text-ink-secondary">Open crowd: anyone can take any spot.</p>
        )}
      </CardContent>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-secondary">{label}</p>
      <p className="font-medium text-ink-primary">{value}</p>
    </div>
  )
}
