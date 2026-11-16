'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LockOpen } from 'lucide-react'
import { useAppealsQuery, useDecideAppealMutation } from '@/hooks/useAppeals'
import { usePagination } from '@/hooks/usePagination'
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
import type { AppealItem, AppealStatus } from '@/types/appeals'

const TABS: { key: AppealStatus; label: string }[] = [
  { key: 'review', label: 'Waiting' },
  { key: 'unlocked', label: 'Unlocked' },
  { key: 'denied', label: 'Kept locked' },
]

export default function AppealsPage() {
  const [status, setStatus] = useState<AppealStatus>('review')
  const { page, pageSize, setPage, setPageSize } = usePagination(10)
  const { data, isLoading } = useAppealsQuery(status, page, pageSize)
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'Appeals' }]}
        title="Appeals"
        subtitle="Locked accounts asking to come back. Compare the live selfie with their profile photos, read their side, then decide. Keeping it locked is final."
      />
      <Toolbar>
        {TABS.map(t => <FilterChip key={t.key} label={t.label} active={status === t.key} onClick={() => { setStatus(t.key); setPage(1) }} />)}
      </Toolbar>
      <ListShell
        emptyIcon={LockOpen}
        isLoading={isLoading}
        empty={!isLoading && data?.items.length === 0}
        emptyLabel={status === 'review' ? 'No appeals waiting' : 'Nothing here yet'}
        total={data?.total ?? 0}
        page={data?.page ?? 1}
        pageSize={data?.page_size ?? pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      >
        <div className="flex flex-col gap-4 p-4">
          {data?.items.map(a => <Appeal key={a.id} a={a} />)}
        </div>
      </ListShell>
    </div>
  )
}

function Appeal({ a }: { a: AppealItem }) {
  const [denying, setDenying] = useState(false)
  const decide = useDecideAppealMutation()
  const toast = useToastStore(s => s.show)
  const run = async (decision: 'unlock' | 'deny', note?: string) => {
    try {
      await decide.mutateAsync({ id: a.id, decision, note })
      toast(decision === 'unlock' ? `${a.name ?? 'They'} can use Gorave again` : 'Kept locked. They’ve been told.', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'That didn’t work', 'error')
    }
  }

  return (
    <Card className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto]">
      {/* The faces: live selfie next to what's on their profile. */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Selfie vs profile</div>
        <div className="flex gap-2">
          <div className="relative aspect-[3/4] w-36 shrink-0 overflow-hidden rounded-card bg-surface-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {a.selfie_url ? <img src={a.selfie_url} alt="Live selfie" className="h-full w-full object-cover" /> : null}
            <Badge className="absolute left-2 top-2">Live selfie</Badge>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-2 content-start">
            {a.photos.slice(0, 4).map(url => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="Profile photo" className="aspect-square w-full rounded-lg object-cover" />
            ))}
          </div>
        </div>
        <Link href={`/users/${a.user_id}`} className="mt-3 block font-semibold text-ink-primary hover:underline">
          {a.name ?? 'Unnamed'}{a.username ? <span className="ml-1 text-xs font-normal text-ink-secondary">@{a.username}</span> : null}
        </Link>
        <div className="text-xs text-ink-secondary">{a.phone}{a.city ? ` · ${a.city}` : ''} · joined {formatDate(a.joined_at)}</div>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Why it was locked</div>
          <p className="mt-1 text-sm text-ink-primary">{a.lock_reason ?? '—'}</p>
          <p className="mt-1 text-xs text-ink-secondary">
            {a.locked_by_name ? `By ${a.locked_by_name}` : 'Locked'}{a.locked_at ? ` · ${formatDate(a.locked_at)}` : ''}
            {' · '}{a.report_count} {a.report_count === 1 ? 'report' : 'reports'} on this person
          </p>
          {a.recent_reports.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {a.recent_reports.map((r, i) => <Badge key={i} variant="danger" className="capitalize">{r.replace(/_/g, ' ')}</Badge>)}
            </div>
          ) : null}
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Their side · sent {formatRelative(a.created_at)}</div>
          <p className="mt-1 text-sm font-semibold text-ink-primary">{a.reason_label}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink-primary">“{a.message}”</p>
        </div>
        {a.reviewed_at ? (
          <p className="text-xs text-ink-secondary">
            {a.status === 'unlocked' ? 'Unlocked' : 'Kept locked'} by {a.reviewed_by_name ?? 'an admin'} · {formatDate(a.reviewed_at)}
            {a.review_note ? <span className="mt-1 block text-sm text-ink-primary">“{a.review_note}”</span> : null}
          </p>
        ) : null}
      </div>

      {a.status === 'review' ? (
        <div className="flex flex-row gap-2 lg:flex-col">
          <Button onClick={() => run('unlock')} disabled={decide.isPending}>Unlock</Button>
          <Button variant="outline" onClick={() => setDenying(true)} disabled={decide.isPending}>Keep locked</Button>
          <ConfirmDialog
            open={denying}
            onOpenChange={setDenying}
            title="Keep this account locked?"
            description="This is final: they can't appeal again. They'll see your reason."
            confirmLabel="Keep locked"
            variant="destructive"
            requireReason
            reasonLabel="Reason (they'll see this)"
            onConfirm={note => run('deny', note)}
          />
        </div>
      ) : null}
    </Card>
  )
}
