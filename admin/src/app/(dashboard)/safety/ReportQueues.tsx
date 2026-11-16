'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarX, UserX } from 'lucide-react'
import { useEventReportsQuery, useModerationMutation, useUserReportsQuery, type ModerationKind } from '@/hooks/useReports'
import { usePagination } from '@/hooks/usePagination'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FilterChip } from '@/components/ui/FilterChip'
import { ListShell } from '@/components/ui/ListShell'
import { Toolbar } from '@/components/ui/Toolbar'
import { useToastStore } from '@/store/toastStore'
import { formatDate, formatRelative } from '@/lib/formatters'
import type { EventReportItem, ReportStatus, UserReportItem } from '@/types/reports'

const label = (s: string) => s.replace(/_/g, ' ')

const OUTCOME: Record<string, { text: string; variant: 'danger' | 'warning' | 'neutral' }> = {
  dismissed: { text: 'Dismissed', variant: 'neutral' },
  warned: { text: 'Warned', variant: 'warning' },
  locked: { text: 'Locked', variant: 'danger' },
  cancelled: { text: 'Event cancelled', variant: 'danger' },
  host_locked: { text: 'Host locked', variant: 'danger' },
}

interface ActionDef {
  key: string
  label: string
  /** What the dialog asks and says. No `ask` means it runs straight away. */
  ask?: { title: string; description: string; reasonLabel: string; confirm: string }
  danger?: boolean
  done: string
}

/** A row of actions; anything that changes someone's account asks first, with a reason they'll see. */
function Actions({ kind, id, actions }: { kind: ModerationKind; id: string; actions: ActionDef[] }) {
  const [open, setOpen] = useState<ActionDef | null>(null)
  const act = useModerationMutation()
  const toast = useToastStore(s => s.show)
  const run = async (a: ActionDef, note?: string) => {
    try {
      await act.mutateAsync({ kind, id, decision: a.key, note })
      toast(a.done, 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'That didn’t work', 'error')
    }
  }
  return (
    <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
      {actions.map(a => (
        <Button
          key={a.key}
          size="sm"
          variant={a.danger ? 'destructive' : 'outline'}
          disabled={act.isPending}
          onClick={() => (a.ask ? setOpen(a) : run(a))}
        >
          {a.label}
        </Button>
      ))}
      {open?.ask ? (
        <ConfirmDialog
          open
          onOpenChange={o => !o && setOpen(null)}
          title={open.ask.title}
          description={open.ask.description}
          confirmLabel={open.ask.confirm}
          variant={open.danger ? 'destructive' : 'primary'}
          requireReason
          reasonLabel={open.ask.reasonLabel}
          onConfirm={note => run(open, note)}
        />
      ) : null}
    </div>
  )
}

function StatusFilter({ status, onChange }: { status: ReportStatus; onChange: (s: ReportStatus) => void }) {
  return (
    <Toolbar>
      <FilterChip label="Needs review" active={status === 'open'} onClick={() => onChange('open')} />
      <FilterChip label="Handled" active={status === 'done'} onClick={() => onChange('done')} />
    </Toolbar>
  )
}

function Outcome({ resolution, note, at }: { resolution: string | null; note: string | null; at: string | null }) {
  if (!resolution) return null
  const o = OUTCOME[resolution] ?? { text: resolution, variant: 'neutral' as const }
  return (
    <div className="flex flex-col gap-1">
      <Badge variant={o.variant} className="w-fit">{o.text}</Badge>
      {note ? <span className="max-w-[16rem] text-xs text-ink-primary">“{note}”</span> : null}
      {at ? <span className="text-xs text-ink-secondary">{formatDate(at)}</span> : null}
    </div>
  )
}

// ── People ──────────────────────────────────────────────────────────────────

const PERSON_ACTIONS: ActionDef[] = [
  { key: 'dismiss', label: 'Dismiss', done: 'Reports closed, nothing done' },
  {
    key: 'warn', label: 'Warn',
    ask: { title: 'Send a warning?', description: 'They get it as a notification and a push. Use it for a first problem.', reasonLabel: 'Message (they’ll see this)', confirm: 'Send warning' },
    done: 'Warning sent',
  },
  {
    key: 'lock', label: 'Lock account', danger: true,
    ask: { title: 'Lock this account?', description: 'They’re signed out and can’t use Gorave. They can appeal once.', reasonLabel: 'Reason (they’ll see this)', confirm: 'Lock account' },
    done: 'Account locked',
  },
]

export function PeopleReportsTab() {
  const [status, setStatus] = useState<ReportStatus>('open')
  const { page, pageSize, setPage, setPageSize } = usePagination(10)
  const { data, isLoading } = useUserReportsQuery(page, pageSize, status)
  return (
    <div className="flex flex-col gap-4">
      <StatusFilter status={status} onChange={s => { setStatus(s); setPage(1) }} />
      <ListShell
        emptyIcon={UserX}
        isLoading={isLoading}
        empty={!isLoading && data?.items.length === 0}
        emptyLabel={status === 'open' ? 'No reported people waiting' : 'Nothing handled yet'}
        total={data?.total ?? 0}
        page={data?.page ?? 1}
        pageSize={data?.page_size ?? pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      >
        <div className="flex flex-col gap-3 p-4">
          {data?.items.map((r: UserReportItem) => (
            <Card key={r.user_id} className="grid gap-5 p-5 lg:grid-cols-[240px_minmax(0,1fr)_auto]">
              <div className="flex flex-col gap-1.5">
                <Link href={`/users/${r.user_id}`} className="flex items-center gap-3 hover:underline">
                  <Avatar src={r.avatar} name={r.name} size={44} />
                  <span>
                    <span className="block font-semibold text-ink-primary">{r.name ?? 'Unnamed'}</span>
                    {r.username ? <span className="block text-xs text-ink-secondary">@{r.username}</span> : null}
                  </span>
                </Link>
                <span className="text-xs text-ink-secondary">{r.phone}{r.city ? ` · ${r.city}` : ''} · joined {formatDate(r.joined_at)}</span>
                <div className="flex flex-wrap gap-1">
                  {r.is_locked ? <Badge variant="danger">Locked</Badge> : null}
                  {r.id_verified ? <Badge variant="success">ID verified</Badge> : null}
                  {r.hosted_count ? <Badge>Hosted {r.hosted_count}</Badge> : null}
                  {r.past_actions ? <Badge variant="warning">{r.past_actions} past {r.past_actions === 1 ? 'action' : 'actions'}</Badge> : null}
                </div>
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="danger">{r.report_count} {r.report_count === 1 ? 'report' : 'reports'}</Badge>
                  <span className="text-xs text-ink-secondary">last {formatRelative(r.last_reported_at)}</span>
                </div>
                <div className="flex flex-wrap gap-1">{r.reasons.map(x => <Badge key={x} className="capitalize">{label(x)}</Badge>)}</div>
                <span className="text-xs text-ink-secondary">From {r.reporter_names.filter(Boolean).join(', ')}</span>
              </div>
              {status === 'open'
                ? <Actions kind="users" id={r.user_id} actions={PERSON_ACTIONS} />
                : <Outcome resolution={r.resolution} note={r.resolution_note} at={r.resolved_at} />}
            </Card>
          ))}
        </div>
      </ListShell>
    </div>
  )
}

// ── Events ──────────────────────────────────────────────────────────────────

const EVENT_ACTIONS = (cancelled: boolean): ActionDef[] => [
  { key: 'dismiss', label: 'Dismiss', done: 'Reports closed, nothing done' },
  {
    key: 'warn', label: 'Warn host',
    ask: { title: 'Warn the host?', description: 'For fixable problems: wrong details, misleading photos, house rules.', reasonLabel: 'Message to the host', confirm: 'Send warning' },
    done: 'Host warned',
  },
  ...(cancelled ? [] : [{
    key: 'cancel', label: 'Cancel event', danger: true,
    ask: { title: 'Cancel this event?', description: 'Every guest is refunded and told. The host is told why.', reasonLabel: 'Reason (the host sees this)', confirm: 'Cancel event' },
    done: 'Event cancelled, guests refunded',
  } as ActionDef]),
  {
    key: 'lock-host', label: 'Cancel and lock host', danger: true,
    ask: { title: 'Cancel and lock the host?', description: 'For scams and danger. The event is cancelled with full refunds, and the host is locked (they can appeal once).', reasonLabel: 'Reason (the host sees this)', confirm: 'Cancel and lock' },
    done: 'Event cancelled and host locked',
  },
]

export function EventReportsTab() {
  const [status, setStatus] = useState<ReportStatus>('open')
  const { page, pageSize, setPage, setPageSize } = usePagination(10)
  const { data, isLoading } = useEventReportsQuery(page, pageSize, status)
  return (
    <div className="flex flex-col gap-4">
      <StatusFilter status={status} onChange={s => { setStatus(s); setPage(1) }} />
      <ListShell
        emptyIcon={CalendarX}
        isLoading={isLoading}
        empty={!isLoading && data?.items.length === 0}
        emptyLabel={status === 'open' ? 'No reported events waiting' : 'Nothing handled yet'}
        total={data?.total ?? 0}
        page={data?.page ?? 1}
        pageSize={data?.page_size ?? pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      >
        <div className="flex flex-col gap-3 p-4">
          {data?.items.map((e: EventReportItem) => (
            <Card key={e.event_id} className="grid gap-5 p-5 lg:grid-cols-[240px_minmax(0,1fr)_auto]">
              <div className="flex flex-col gap-1.5">
                {e.cover?.startsWith('http') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.cover} alt="" className="aspect-[4/5] w-24 rounded-lg object-cover" />
                ) : null}
                <Link href={`/events/${e.event_id}`} className="font-semibold text-ink-primary hover:underline">{e.title}</Link>
                <span className="text-xs text-ink-secondary">
                  {formatDate(e.date_time)}{e.area ? ` · ${e.area}` : ''}{e.city ? `, ${e.city}` : ''} · {e.going} going · {e.price_inr ? `₹${e.price_inr}` : 'Free'}
                </span>
                <span className="text-xs text-ink-secondary">
                  Host <Link href={`/users/${e.host_id}`} className="font-medium text-ink-primary hover:underline">{e.host_name ?? 'Unnamed'}</Link> · {e.host_phone}
                </span>
                <div className="flex flex-wrap gap-1">
                  {e.is_cancelled ? <Badge variant="danger">Cancelled</Badge> : null}
                  {e.host_locked ? <Badge variant="danger">Host locked</Badge> : null}
                  {e.host_verified ? <Badge variant="success">Host ID verified</Badge> : <Badge variant="warning">Host not verified</Badge>}
                </div>
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="danger">{e.report_count} {e.report_count === 1 ? 'report' : 'reports'}</Badge>
                  <span className="text-xs text-ink-secondary">last {formatRelative(e.last_reported_at)}</span>
                </div>
                <div className="flex flex-wrap gap-1">{e.reasons.map(x => <Badge key={x} className="capitalize">{label(x)}</Badge>)}</div>
                {e.descriptions.slice(0, 3).map(d => <p key={d} className="text-sm text-ink-primary">“{d}”</p>)}
              </div>
              {status === 'open'
                ? <Actions kind="events" id={e.event_id} actions={EVENT_ACTIONS(e.is_cancelled)} />
                : <Outcome resolution={e.resolution} note={e.resolution_note} at={e.resolved_at} />}
            </Card>
          ))}
        </div>
      </ListShell>
    </div>
  )
}
