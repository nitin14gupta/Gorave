'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Unlock, Mic, ShieldAlert, Wallet, CalendarDays, MessageSquare, Heart, Banknote, Clock, Star } from 'lucide-react'
import { useUserQuery, useUserPayoutQuery, useLockUserMutation, useUnlockUserMutation } from '@/hooks/useUsers'
import { useTabParam } from '@/hooks/useTabParam'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { HostBadge } from '@/components/ui/HostBadge'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ImageModal } from '@/components/ui/ImageModal'
import { PageHeader } from '@/components/ui/PageHeader'
import { DetailStatsRow, DetailStat } from '@/components/ui/DetailStats'
import { formatDate, formatInr, formatRelative } from '@/lib/formatters'
import { useToast } from '@/hooks/useToast'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { crowdLabel } from '@/lib/crowd'
import type { UserDetail } from '@/types/user'

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()
  const { admin } = useAdminAuth()
  const isSuperAdmin = admin?.role === 'super_admin'
  const [lockDialogOpen, setLockDialogOpen] = useState(false)
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false)
  const [tab, setTab] = useTabParam('profile')

  const { data, isLoading } = useUserQuery(id)
  const lockMutation = useLockUserMutation(id)
  const unlockMutation = useUnlockUserMutation(id)

  const handleLock = async (reason?: string) => {
    try {
      await lockMutation.mutateAsync(reason)
      toast.success('User locked')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to lock user')
    }
  }

  const handleUnlock = async () => {
    try {
      await unlockMutation.mutateAsync()
      toast.success('User unlocked')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to unlock user')
    }
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const { user } = data

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'Users', href: '/users' }, { label: user.name ?? 'Unnamed' }]}
        title={user.name ?? 'Unnamed'}
        subtitle={`${user.username ? `@${user.username} · ` : ''}${user.country_code}${user.phone} · ${user.city ?? 'No city set'}`}
        actions={
          isSuperAdmin ? (
            user.is_locked ? (
              <Button variant="outline" onClick={() => setUnlockDialogOpen(true)}>
                <Unlock className="h-4 w-4" /> Unlock account
              </Button>
            ) : (
              <Button variant="destructive" onClick={() => setLockDialogOpen(true)}>
                <Lock className="h-4 w-4" /> Lock account
              </Button>
            )
          ) : undefined
        }
      />

      <Card>
        <CardContent className="flex items-center gap-4">
          <Avatar src={data.photos[0]?.url} name={user.name} size={56} />
          <div>
            <div className="flex items-center gap-2">
              <HostBadge tier={user.host_badges[0]} size={20} />
              {user.is_locked ? (
                <Badge variant="danger">Locked</Badge>
              ) : user.is_deleted ? (
                <Badge variant="neutral">Deleted</Badge>
              ) : (
                <Badge variant="success">Active</Badge>
              )}
            </div>
            {user.is_locked && user.locked_reason && (
              <p className="mt-1 text-xs text-destructive">
                Locked {formatDate(user.locked_at)} — {user.locked_reason}
              </p>
            )}
            {user.is_deleted && (
              <p className="mt-1 text-xs text-ink-secondary">
                Requested deletion {formatDate(user.deleted_at)}
                {user.purge_at && <> — permanently erased {formatRelative(user.purge_at)} (on {formatDate(user.purge_at)})</>}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <DetailStatsRow>
        <DetailStat label="Wallet balance" value={formatInr(user.wallet_balance)} icon={Wallet} />
        <DetailStat label="Hosted events" value={String(data.hosted_events.length)} icon={CalendarDays} />
        <DetailStat label="Host rating" value={user.host_avg_rating ? `${user.host_avg_rating} ★ · ${data.reviews_received.length}` : '—'} icon={Star} />
        <DetailStat label="Reports received" value={String(data.reports_received.length + data.message_reports_received.length)} icon={ShieldAlert} />
        <DetailStat label="Member since" value={formatRelative(user.created_at)} icon={Clock} />
      </DetailStatsRow>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="payout">Payout</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="support">Support & Feedback</TabsTrigger>
          <TabsTrigger value="vibes">Vibe Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab data={data} />
        </TabsContent>
        <TabsContent value="events">
          <EventsTab data={data} />
        </TabsContent>
        <TabsContent value="reviews">
          <ReviewsTab data={data} />
        </TabsContent>
        <TabsContent value="wallet">
          <WalletTab data={data} />
        </TabsContent>
        <TabsContent value="payout">
          {isSuperAdmin ? (
            <PayoutTab userId={id} isHostOnboarded={user.is_host_onboarding_finished} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-sm text-ink-secondary">
                Only super admins can view decrypted payout details.
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="safety">
          <SafetyTab data={data} />
        </TabsContent>
        <TabsContent value="support">
          <SupportTab data={data} />
        </TabsContent>
        <TabsContent value="vibes">
          <VibesTab data={data} />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={lockDialogOpen}
        onOpenChange={setLockDialogOpen}
        title="Lock this account?"
        description="The user will be logged out immediately and notified of the reason."
        confirmLabel="Lock account"
        variant="destructive"
        requireReason
        reasonLabel="Reason (shown to the user)"
        onConfirm={(reason) => handleLock(reason)}
      />
      <ConfirmDialog
        open={unlockDialogOpen}
        onOpenChange={setUnlockDialogOpen}
        title="Unlock this account?"
        description="The user will be able to log in again."
        confirmLabel="Unlock account"
        onConfirm={() => handleUnlock()}
      />
    </div>
  )
}

function ProfileTab({ data }: { data: UserDetail }) {
  const { user, photos } = data
  const [modalIndex, setModalIndex] = useState<number | null>(null)
  const photoSlides = photos.map((p) => ({ url: p.url, position: p.position }))

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <Field label="DOB" value={user.dob ? formatDate(user.dob) : '—'} />
          <Field label="Gender" value={user.gender ?? '—'} />
          <Field label="Bio" value={user.bio ?? '—'} full />
          <Field label="Interests" value={user.interests.join(', ') || '—'} full />
          <Field label="Badges" value={user.badges.join(', ') || '—'} full />
          <Field label="Host tier" value={user.host_badges[0] ?? 'None'} />
          <Field label="Profile complete" value={user.profile_complete ? 'Yes' : 'No'} />
          <Field label="Host onboarding" value={user.is_host_onboarding_finished ? 'Finished' : 'Not finished'} />
          <Field label="Host agreement" value={user.host_agreement_accepted_at ? `Signed ${formatDate(user.host_agreement_accepted_at)}${user.has_signature ? '' : ' (no signature on file)'}` : 'Not signed'} />
          <Field label="Safety agreement" value={user.safety_agreement_accepted_at ? `Accepted ${formatDate(user.safety_agreement_accepted_at)}` : 'Not accepted'} />
          <Field label="Emergency contacts" value={String(user.emergency_contacts_count)} />
          <Field label="City" value={user.city ?? '—'} />
          <Field label="Joined" value={formatDate(user.created_at)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-4 w-4" /> Voice intro
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.voice_url ? (
            <audio controls src={user.voice_url} className="w-full" />
          ) : (
            <p className="text-sm text-ink-secondary">No voice intro recorded</p>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Photos ({photos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <p className="text-sm text-ink-secondary">No photos uploaded</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {photos.map((p, i) => (
                <button key={p.id} onClick={() => setModalIndex(i)} className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt=""
                    className="aspect-square w-full rounded-lg object-cover transition-opacity hover:opacity-80"
                  />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ImageModal
        photos={photoSlides}
        initialIndex={modalIndex ?? 0}
        open={modalIndex !== null}
        onOpenChange={(open) => !open && setModalIndex(null)}
      />
    </div>
  )
}

const STATUS_LABEL: Record<string, string> = {
  going: 'Going', waitlist: 'Waitlist', requested: 'Requested', declined: 'Declined', expired: 'Expired', cancelled: 'Cancelled',
}

function statusVariant(st: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (st === 'going') return 'success'
  if (st === 'requested' || st === 'waitlist') return 'warning'
  if (st === 'declined') return 'danger'
  return 'neutral'
}

function EventsTab({ data }: { data: UserDetail }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Hosted ({data.hosted_events.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR><TH>Event</TH><TH>Date</TH><TH>Crowd</TH><TH>Price</TH><TH>Status</TH></TR>
            </THead>
            <TBody>
              {data.hosted_events.map((e) => (
                <TR key={e.id}>
                  <TD>
                    <Link href={`/events/${e.id}`} className="flex items-center gap-2.5 hover:underline">
                      {e.cover_photos[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.cover_photos[0].url} alt="" className="h-10 w-8 shrink-0 rounded-md object-cover" />
                      ) : <span className="h-10 w-8 shrink-0 rounded-md bg-surface-muted" />}
                      <span>
                        <span className="block">{e.title}</span>
                        <span className="block text-xs text-ink-secondary">{[e.area, e.city].filter(Boolean).join(', ')}</span>
                      </span>
                    </Link>
                  </TD>
                  <TD>{formatDate(e.date_time)}</TD>
                  <TD>
                    <span className="block">{crowdLabel(e.women_pct)}</span>
                    {e.join_mode === 'request' ? <span className="block text-xs text-ink-secondary">Request · {e.pending_requests} waiting</span> : null}
                  </TD>
                  <TD>{e.price_inr === 0 ? 'Free' : formatInr(e.price_inr)}</TD>
                  <TD>{e.is_cancelled ? <Badge variant="danger">Cancelled</Badge> : <Badge variant="success">Live</Badge>}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Going, requested and waitlisted ({data.joined_events.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR><TH>Event</TH><TH>Date</TH><TH>Status</TH><TH>Checked in</TH></TR>
            </THead>
            <TBody>
              {data.joined_events.map((e) => (
                <TR key={e.id}>
                  <TD><Link href={`/events/${e.id}`} className="hover:underline">{e.title}</Link></TD>
                  <TD>{formatDate(e.date_time)}</TD>
                  <TD>
                    <Badge variant={statusVariant(e.status)}>{STATUS_LABEL[e.status] ?? e.status}</Badge>
                    {e.status === 'requested' && e.requested_at ? <span className="mt-1 block text-xs text-ink-secondary">asked {formatDate(e.requested_at)}</span> : null}
                    {(e.status === 'declined' || e.status === 'expired') && e.decided_at ? <span className="mt-1 block text-xs text-ink-secondary">{formatDate(e.decided_at)}</span> : null}
                  </TD>
                  <TD>{e.checked_in_at ? formatDate(e.checked_in_at) : '—'}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function ReviewsTab({ data }: { data: UserDetail }) {
  const list = (rows: UserDetail['reviews_received'], showReviewer: boolean) =>
    rows.length === 0 ? (
      <p className="px-5 py-8 text-center text-sm text-ink-secondary">None yet</p>
    ) : (
      <div className="flex flex-col divide-y divide-divider">
        {rows.map((r) => (
          <div key={r.id} className="px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <Link href={`/events/${r.event_id}`} className="font-medium hover:underline">{r.event_title}</Link>
              <Badge variant="neutral">{r.rating} ★</Badge>
            </div>
            {showReviewer && r.user_id ? (
              <p className="mt-0.5 text-xs text-ink-secondary">by <Link href={`/users/${r.user_id}`} className="hover:underline">{r.name ?? 'Unnamed'}</Link></p>
            ) : null}
            {r.body ? <p className="mt-2 text-sm text-ink-secondary">{r.body}</p> : null}
            <p className="mt-1 text-xs text-ink-disabled">{formatDate(r.created_at)}</p>
          </div>
        ))}
      </div>
    )
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-4 w-4" /> On nights they hosted ({data.reviews_received.length})</CardTitle></CardHeader>
        <CardContent className="p-0">{list(data.reviews_received, true)}</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>They wrote ({data.reviews_given.length})</CardTitle></CardHeader>
        <CardContent className="p-0">{list(data.reviews_given, false)}</CardContent>
      </Card>
    </div>
  )
}

function WalletTab({ data }: { data: UserDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-4 w-4" /> Balance: {formatInr(data.user.wallet_balance)}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <THead>
            <TR><TH>Type</TH><TH>Source</TH><TH>Amount</TH><TH>Description</TH><TH>Date</TH></TR>
          </THead>
          <TBody>
            {data.wallet_transactions.map((t) => (
              <TR key={t.id}>
                <TD className="capitalize">{t.type}</TD>
                <TD className="capitalize">{t.source.replace(/_/g, ' ')}</TD>
                <TD className={t.type === 'debit' ? 'text-destructive' : 'text-offer-green'}>
                  {t.type === 'debit' ? '-' : '+'}{formatInr(t.amount_inr)}
                </TD>
                <TD>{t.description ?? '—'}</TD>
                <TD>{formatDate(t.created_at)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function PayoutTab({ userId, isHostOnboarded }: { userId: string; isHostOnboarded: boolean }) {
  const { data, isLoading } = useUserPayoutQuery(userId)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-4 w-4" /> Payout details
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : !data?.payout_method ? (
          <div className="flex flex-col gap-1">
            <p className="text-sm text-ink-secondary">No payout details on file.</p>
            <p className="text-xs text-ink-secondary">
              {isHostOnboarded
                ? 'Host onboarding is marked finished but no payout method is saved — worth a closer look.'
                : 'Host onboarding not completed — this user is not yet eligible to host events.'}
            </p>
          </div>
        ) : data.payout_method === 'upi' ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Method" value="UPI" />
            <Field label="UPI ID" value={data.upi_id_masked ?? '—'} />
            <Field label="Last updated" value={data.updated_at ? formatDate(data.updated_at) : '—'} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Method" value="Bank transfer" />
            <Field label="Account holder" value={data.bank_masked?.account_holder_name ?? '—'} />
            <Field label="Account number" value={data.bank_masked?.account_number_masked ?? '—'} />
            <Field label="IFSC code" value={data.bank_masked?.ifsc_code ?? '—'} />
            <Field label="Bank name" value={data.bank_masked?.bank_name ?? '—'} />
            <Field label="Last updated" value={data.updated_at ? formatDate(data.updated_at) : '—'} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SafetyTab({ data }: { data: UserDetail }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> Reports received ({data.reports_received.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead><TR><TH>Reported by</TH><TH>Reason</TH><TH>Date</TH></TR></THead>
            <TBody>
              {data.reports_received.map((r) => (
                <TR key={r.id}><TD>{r.reporter_id ? <Link href={`/users/${r.reporter_id}`} className="hover:underline">{r.reporter_name}</Link> : r.reporter_name}</TD><TD>{r.reason}</TD><TD>{formatDate(r.created_at)}</TD></TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reports filed ({data.reports_filed.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead><TR><TH>Against</TH><TH>Reason</TH><TH>Date</TH></TR></THead>
            <TBody>
              {data.reports_filed.map((r) => (
                <TR key={r.id}><TD>{r.reported_id ? <Link href={`/users/${r.reported_id}`} className="hover:underline">{r.reported_name}</Link> : r.reported_name}</TD><TD>{r.reason}</TD><TD>{formatDate(r.created_at)}</TD></TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Their messages reported ({data.message_reports_received.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead><TR><TH>Reported by</TH><TH>Reason</TH><TH>Details</TH><TH>Date</TH></TR></THead>
            <TBody>
              {data.message_reports_received.map((r) => (
                <TR key={r.id}>
                  <TD><Link href={`/users/${r.reporter_id}`} className="hover:underline">{r.reporter_name ?? 'Unnamed'}</Link></TD>
                  <TD className="capitalize">{r.reason.replace(/_/g, ' ')}</TD>
                  <TD>{r.description ?? '—'}</TD>
                  <TD>{formatDate(r.created_at)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blocked by this user ({data.blocked_by_user.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead><TR><TH>User</TH><TH>Date</TH></TR></THead>
            <TBody>
              {data.blocked_by_user.map((b) => (
                <TR key={b.id}><TD>{b.name}</TD><TD>{formatDate(b.created_at)}</TD></TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blocked this user ({data.blocked_the_user.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead><TR><TH>User</TH><TH>Date</TH></TR></THead>
            <TBody>
              {data.blocked_the_user.map((b) => (
                <TR key={b.id}><TD>{b.name}</TD><TD>{formatDate(b.created_at)}</TD></TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function SupportTab({ data }: { data: UserDetail }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Support requests ({data.support_requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {data.support_requests.length === 0 && <p className="text-sm text-ink-secondary">None</p>}
          {data.support_requests.map((s) => (
            <div key={s.id} className="border border-divider p-3 text-sm rounded-input">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium">{s.topic}</span>
                <Badge variant={s.status === 'open' ? 'warning' : 'neutral'}>{s.status}</Badge>
              </div>
              <p className="text-ink-secondary">{s.message}</p>
              <p className="mt-1 text-xs text-ink-secondary">{formatDate(s.created_at)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>App feedback ({data.app_feedback.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {data.app_feedback.length === 0 && <p className="text-sm text-ink-secondary">None</p>}
          {data.app_feedback.map((f) => (
            <div key={f.id} className="border border-divider p-3 text-sm rounded-input">
              <p className="text-ink-secondary">{f.text}</p>
              <p className="mt-1 text-xs text-ink-secondary">{formatDate(f.created_at)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function VibesTab({ data }: { data: UserDetail }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-4 w-4" /> Sent ({data.vibe_requests_sent.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead><TR><TH>To</TH><TH>Status</TH><TH>Date</TH></TR></THead>
            <TBody>
              {data.vibe_requests_sent.map((v) => (
                <TR key={v.id}><TD>{v.name}</TD><TD className="capitalize">{v.status}</TD><TD>{formatDate(v.created_at)}</TD></TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Received ({data.vibe_requests_received.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead><TR><TH>From</TH><TH>Status</TH><TH>Date</TH></TR></THead>
            <TBody>
              {data.vibe_requests_received.map((v) => (
                <TR key={v.id}><TD>{v.name}</TD><TD className="capitalize">{v.status}</TD><TD>{formatDate(v.created_at)}</TD></TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : undefined}>
      <p className="text-xs text-ink-secondary">{label}</p>
      <p className="text-ink-primary">{value}</p>
    </div>
  )
}
