'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BadgeCheck } from 'lucide-react'
import { useDecideVerificationMutation, useHostVerificationsQuery } from '@/hooks/useHostVerifications'
import { usePagination } from '@/hooks/usePagination'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FilterChip } from '@/components/ui/FilterChip'
import { ListShell } from '@/components/ui/ListShell'
import { PageHeader } from '@/components/ui/PageHeader'
import { Toolbar } from '@/components/ui/Toolbar'
import { useToastStore } from '@/store/toastStore'
import { formatDate, formatRelative } from '@/lib/formatters'
import type { HostVerificationItem, Match, VerificationStatus } from '@/types/verification'

const TABS: { key: VerificationStatus; label: string }[] = [
  { key: 'review', label: 'Waiting' },
  { key: 'verified', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'failed', label: 'Failed check' },
]

const FAILURES: Record<string, string> = {
  invalid_pan: 'No such PAN',
  not_person: 'Business PAN, not a person',
  underage: 'Under 18',
  already_used: 'PAN already used on another account',
  unreadable: 'PAN record had no name',
}

const MATCH: Record<Match, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  match: { label: 'Match', variant: 'success' },
  partial: { label: 'Partly', variant: 'warning' },
  mismatch: { label: 'Mismatch', variant: 'danger' },
  unknown: { label: 'Missing', variant: 'neutral' },
}

const gender = (g: string | null) => (g ? ({ M: 'Male', F: 'Female', T: 'Transgender' } as Record<string, string>)[g.slice(0, 1).toUpperCase()] ?? g : null)
const dob = (d: string | null) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null)
const age = (d: string | null) => {
  if (!d) return null
  const b = new Date(d), t = new Date()
  return t.getFullYear() - b.getFullYear() - (t < new Date(t.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0)
}

export default function HostVerificationPage() {
  const [status, setStatus] = useState<VerificationStatus>('review')
  const { page, pageSize, setPage, setPageSize } = usePagination(10)
  const { data, isLoading } = useHostVerificationsQuery(status, page, pageSize)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'Host ID' }]}
        title="Host ID"
        subtitle="Every new host's PAN, checked with the Income Tax records. Compare it with their profile, then approve or reject. They get a push either way."
      />
      <Toolbar>
        {TABS.map(t => <FilterChip key={t.key} label={t.label} active={status === t.key} onClick={() => { setStatus(t.key); setPage(1) }} />)}
      </Toolbar>
      <ListShell
        emptyIcon={BadgeCheck}
        isLoading={isLoading}
        empty={!isLoading && data?.items.length === 0}
        emptyLabel={status === 'review' ? 'Nobody waiting. New requests show up here.' : 'Nothing here yet'}
        total={data?.total ?? 0}
        page={data?.page ?? 1}
        pageSize={data?.page_size ?? pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      >
        <div className="flex flex-col gap-4 p-4">
          {data?.items.map(v => <Request key={v.id} v={v} />)}
        </div>
      </ListShell>
    </div>
  )
}

function Row({ label, profile, pan, match, note }: { label: string; profile: React.ReactNode; pan: React.ReactNode; match?: Match; note?: string | null }) {
  return (
    <tr className="border-t border-divider align-top">
      <td className="py-2.5 pr-4 text-sm text-ink-secondary">{label}</td>
      <td className="py-2.5 pr-4 text-sm text-ink-primary">{profile ?? '—'}</td>
      <td className="py-2.5 pr-4 text-sm font-semibold text-ink-primary">
        {pan ?? '—'}
        {note ? <span className="mt-0.5 block text-xs font-normal text-ink-secondary">{note}</span> : null}
      </td>
      <td className="py-2.5">{match ? <Badge variant={MATCH[match].variant}>{MATCH[match].label}</Badge> : null}</td>
    </tr>
  )
}

/** "14 Feb 2006 · 20 yrs", red when under 18. */
function Birthday({ d }: { d: string | null }) {
  if (!d) return null
  const years = age(d) ?? 0
  return <span className={years < 18 ? 'font-semibold text-destructive' : undefined}>{dob(d)} · {years} yrs</span>
}

/** PANs often carry a middle name the profile skips. Say so, so a match doesn't look odd. */
function nameNote(profile: string | null, pan: string | null, match?: Match) {
  const words = (s: string | null) => (s ?? '').toLowerCase().replace(/[^a-z ]/g, ' ').split(' ').filter(w => w.length > 1)
  const mine = words(profile), theirs = words(pan)
  if (match === 'match' && theirs.length > mine.length) return 'PAN has a middle name'
  if (match === 'partial' && mine.length === 1) return 'Profile has a first name only'
  return null
}

function Request({ v }: { v: HostVerificationItem }) {
  const [rejecting, setRejecting] = useState(false)
  const decide = useDecideVerificationMutation()
  const toast = useToastStore(s => s.show)
  const run = async (decision: 'approve' | 'reject', reason?: string) => {
    try {
      await decide.mutateAsync({ id: v.id, decision, reason })
      toast(decision === 'approve' ? `${v.profile_name ?? 'They'} can host now` : 'Rejected, they’ve been told why', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'That didn’t work', 'error')
    }
  }
  const m = v.matches

  return (
    <Card className="grid gap-6 p-5 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
      <div className="flex flex-col gap-2">
        <Link href={`/users/${v.user_id}`} className="flex items-center gap-3 hover:underline">
          <Avatar src={v.avatar} name={v.profile_name} size={48} />
          <span>
            <span className="block font-semibold text-ink-primary">{v.profile_name ?? 'Unnamed'}</span>
            {v.username ? <span className="block text-xs text-ink-secondary">@{v.username}</span> : null}
          </span>
        </Link>
        <div className="text-xs text-ink-secondary">{v.phone}{v.city ? ` · ${v.city}` : ''}</div>
        <div className="text-xs text-ink-secondary">Joined {formatDate(v.joined_at)}</div>
        <div className="text-xs text-ink-secondary">Sent {formatRelative(v.created_at)}{v.attempts > 1 ? ` · attempt ${v.attempts}` : ''}</div>
      </div>

      <div className="min-w-0">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-secondary">
              <th className="pb-2 font-semibold" />
              <th className="pb-2 font-semibold">Profile</th>
              <th className="pb-2 font-semibold">PAN record</th>
              <th className="pb-2 font-semibold" />
            </tr>
          </thead>
          <tbody>
            <Row label="Name" profile={v.profile_name} pan={v.full_name} match={m?.name} note={nameNote(v.profile_name, v.full_name, m?.name)} />
            <Row label="Date of birth" profile={v.profile_dob ? <Birthday d={v.profile_dob} /> : null} pan={v.dob ? <Birthday d={v.dob} /> : null} match={m?.dob} />
            <Row label="Gender" profile={gender(v.profile_gender)} pan={gender(v.gender)} match={m?.gender} />
          </tbody>
        </table>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-secondary">
          {v.id_masked ? <span>PAN {v.id_masked}</span> : null}
          {v.masked_aadhaar ? <span>Aadhaar {v.masked_aadhaar}</span> : null}
          {v.aadhaar_linked != null ? <span>{v.aadhaar_linked ? 'Aadhaar linked' : 'Aadhaar not linked'}</span> : null}
          {v.state ? <span>{v.state}</span> : null}
          {v.category && v.category !== 'person' ? <span className="font-semibold text-destructive">Category: {v.category}</span> : null}
        </div>
        {v.status === 'failed' && v.failure_reason ? <p className="mt-3 text-sm font-semibold text-destructive">{FAILURES[v.failure_reason] ?? v.failure_reason}</p> : null}
        {v.review_note ? <p className="mt-3 text-sm text-ink-primary">“{v.review_note}”</p> : null}
        {v.reviewed_at ? <p className="mt-1 text-xs text-ink-secondary">{v.status === 'verified' ? 'Approved' : 'Rejected'} by {v.reviewed_by_name ?? 'an admin'} · {formatDate(v.reviewed_at)}</p> : null}
      </div>

      {v.status === 'review' ? (
        <div className="flex flex-row gap-2 lg:flex-col">
          <Button onClick={() => run('approve')} disabled={decide.isPending}>Approve</Button>
          <Button variant="outline" onClick={() => setRejecting(true)} disabled={decide.isPending}>Reject</Button>
          <ConfirmDialog
            open={rejecting}
            onOpenChange={setRejecting}
            title="Reject this PAN?"
            description="They’ll get a notification with your reason and can try again."
            confirmLabel="Reject"
            variant="destructive"
            requireReason
            reasonLabel="Reason (they’ll see this)"
            onConfirm={reason => run('reject', reason)}
          />
        </div>
      ) : null}
    </Card>
  )
}
