'use client'

import { useState } from 'react'
import Link from 'next/link'
import * as Dialog from '@radix-ui/react-dialog'
import { ImageOff, MessageSquareWarning, ShieldAlert, X } from 'lucide-react'
import { useMessageContextQuery, useMessageReportsQuery, useModerationMutation, usePhotoReportsQuery } from '@/hooks/useReports'
import { usePagination } from '@/hooks/usePagination'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FilterChip } from '@/components/ui/FilterChip'
import { ListShell } from '@/components/ui/ListShell'
import { Toolbar } from '@/components/ui/Toolbar'
import { useToastStore } from '@/store/toastStore'
import { formatDate } from '@/lib/formatters'
import type { MessageReportItem, ReportStatus, Resolution } from '@/types/reports'

const label = (s: string) => s.replace(/_/g, ' ')

function StatusFilter({ status, onChange }: { status: ReportStatus; onChange: (s: ReportStatus) => void }) {
  return (
    <Toolbar>
      <FilterChip label="Needs review" active={status === 'open'} onClick={() => onChange('open')} />
      <FilterChip label="Handled" active={status === 'done'} onClick={() => onChange('done')} />
    </Toolbar>
  )
}

function Outcome({ resolution, at }: { resolution: Resolution; at: string | null }) {
  if (!resolution) return null
  return (
    <span className="flex flex-col gap-0.5">
      <Badge variant={resolution === 'removed' ? 'danger' : 'neutral'} className="w-fit capitalize">{resolution}</Badge>
      {at ? <span className="text-xs text-ink-secondary">{formatDate(at)}</span> : null}
    </span>
  )
}

/** Remove (with a confirm) or keep. Used by both queues. */
function Decide({ kind, id, what }: { kind: 'messages' | 'photos'; id: string; what: string }) {
  const [confirm, setConfirm] = useState(false)
  const mutation = useModerationMutation()
  const toast = useToastStore((s) => s.show)
  const run = async (decision: 'remove' | 'keep') => {
    try {
      await mutation.mutateAsync({ kind, id, decision })
      toast(decision === 'remove' ? `${what} removed` : 'Reports closed, nothing removed', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'That didn’t work', 'error')
    }
  }
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="destructive" onClick={() => setConfirm(true)} disabled={mutation.isPending}>Remove</Button>
      <Button size="sm" variant="outline" onClick={() => run('keep')} disabled={mutation.isPending}>Keep</Button>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Remove this ${what.toLowerCase()}?`}
        description={kind === 'messages'
          ? 'It disappears for everyone in the chat, straight away. The sender is told it broke the community guidelines.'
          : 'It comes out of the album for everyone and the file is deleted. The person who added it is told why.'}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={() => run('remove')}
      />
    </div>
  )
}

// ── Album photos ────────────────────────────────────────────────────────────

export function PhotoReportsTab() {
  const [status, setStatus] = useState<ReportStatus>('open')
  const { page, pageSize, setPage, setPageSize } = usePagination(24)
  const { data, isLoading } = usePhotoReportsQuery(page, pageSize, status)
  const [zoom, setZoom] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <StatusFilter status={status} onChange={(s) => { setStatus(s); setPage(1) }} />
      <ListShell
        emptyIcon={ShieldAlert}
        isLoading={isLoading}
        empty={!isLoading && data?.items.length === 0}
        emptyLabel={status === 'open' ? 'No album photos waiting for review' : 'Nothing handled yet'}
        total={data?.total ?? 0}
        page={data?.page ?? 1}
        pageSize={data?.page_size ?? pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      >
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.items.map((p) => (
            <div key={p.id} className="flex flex-col overflow-hidden rounded-card border border-divider bg-surface">
              <button type="button" className="relative aspect-[4/5] w-full bg-surface-muted" onClick={() => p.url && setZoom(p.url)} disabled={!p.url}>
                {p.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.url} alt="Reported album photo" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full flex-col items-center justify-center gap-2 text-sm text-ink-secondary">
                    <ImageOff className="h-5 w-5" />{p.removed_at ? 'Already removed' : 'Preview unavailable'}
                  </span>
                )}
                {p.hidden_at && !p.removed_at ? <Badge variant="warning" className="absolute left-2 top-2">Hidden by reports</Badge> : null}
              </button>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="danger">{p.report_count} {p.report_count === 1 ? 'report' : 'reports'}</Badge>
                  <span className="text-xs text-ink-secondary">{formatDate(p.last_reported_at)}</span>
                </div>
                <p className="text-sm capitalize text-ink-primary">{p.reasons.map(label).join(', ')}</p>
                <p className="text-xs text-ink-secondary">
                  By <Link href={`/users/${p.uploader_id}`} className="hover:underline">{p.uploader_name ?? 'Unnamed'}</Link>
                  {' · '}<Link href={`/events/${p.event_id}`} className="hover:underline">{p.event_title}</Link>
                </p>
                <div className="mt-auto pt-1">
                  {status === 'open' ? <Decide kind="photos" id={p.id} what="Photo" /> : <Outcome resolution={p.resolution} at={p.resolved_at} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ListShell>

      <Dialog.Root open={!!zoom} onOpenChange={(o) => !o && setZoom(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] -translate-x-1/2 -translate-y-1/2">
            <Dialog.Title className="sr-only">Reported photo</Dialog.Title>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {zoom ? <img src={zoom} alt="Reported album photo" className="max-h-[90vh] max-w-[90vw] rounded-card object-contain" /> : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

// ── Messages ────────────────────────────────────────────────────────────────

function MessageBody({ type, content, url, unsent }: { type: string; content: string | null; url: string | null; unsent: boolean }) {
  if (unsent) return <span className="italic text-ink-secondary">Removed</span>
  if (url && (type === 'image' || type === 'gif')) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="Reported photo" className="max-h-48 rounded-lg object-cover" />
  }
  if (url && type === 'video') return <video src={url} controls className="max-h-48 rounded-lg" />
  if (url && type === 'voice') return <audio src={url} controls className="w-56" />
  if (type === 'text' || type === 'update') return <span className="whitespace-pre-wrap break-words">{content ?? '—'}</span>
  return <Badge variant="neutral" className="capitalize">{type}</Badge>
}

function ChatLabel({ r }: { r: MessageReportItem }) {
  if (r.chat_kind === 'event' && r.event_id) {
    return <Link href={`/events/${r.event_id}`} className="text-xs text-ink-secondary hover:underline">Group: {r.event_title}</Link>
  }
  return <span className="text-xs text-ink-secondary">1:1 chat</span>
}

function ContextDialog({ item, onClose }: { item: MessageReportItem | null; onClose: () => void }) {
  const { data, isLoading } = useMessageContextQuery(item?.message_id ?? null)
  return (
    <Dialog.Root open={!!item} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-glass-overlay backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-modal border border-divider bg-surface">
          <div className="flex items-start justify-between border-b border-divider p-5">
            <div>
              <Dialog.Title className="font-display text-xl font-bold text-ink-primary">In context</Dialog.Title>
              <Dialog.Description className="text-sm text-ink-secondary">The messages around the reported one. Only open this from a report.</Dialog.Description>
            </div>
            <Dialog.Close className="rounded-full p-1 text-ink-secondary hover:bg-surface-muted"><X className="h-4 w-4" /></Dialog.Close>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto p-5">
            {isLoading ? <p className="text-sm text-ink-secondary">Loading…</p> : data?.messages.map((m) => (
              <div key={m.id} className={m.reported ? 'rounded-lg border-[1.5px] border-destructive p-3' : 'px-3'}>
                <div className="mb-1 flex items-center gap-2 text-xs text-ink-secondary">
                  <span className="font-semibold text-ink-primary">{m.sender_name ?? 'Unnamed'}</span>
                  <span>{formatDate(m.sent_at)}</span>
                  {m.reported ? <Badge variant="danger">Reported</Badge> : null}
                </div>
                <div className="text-sm text-ink-primary">
                  {m.content_type === 'system' ? <span className="italic text-ink-secondary">{m.content}</span> : (
                    <MessageBody type={m.content_type} content={m.content} url={m.media_url} unsent={!!m.unsent_at} />
                  )}
                </div>
              </div>
            ))}
          </div>
          {item && !item.resolution ? (
            <div className="flex justify-end border-t border-divider p-4"><Decide kind="messages" id={item.message_id} what="Message" /></div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function MessageReportsTab() {
  const [status, setStatus] = useState<ReportStatus>('open')
  const { page, pageSize, setPage, setPageSize } = usePagination(20)
  const { data, isLoading } = useMessageReportsQuery(page, pageSize, status)
  const [open, setOpen] = useState<MessageReportItem | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <StatusFilter status={status} onChange={(s) => { setStatus(s); setPage(1) }} />
      <ListShell
        emptyIcon={MessageSquareWarning}
        isLoading={isLoading}
        empty={!isLoading && data?.items.length === 0}
        emptyLabel={status === 'open' ? 'No messages waiting for review' : 'Nothing handled yet'}
        total={data?.total ?? 0}
        page={data?.page ?? 1}
        pageSize={data?.page_size ?? pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      >
        <Table>
          <THead><TR><TH>Message</TH><TH>Sender</TH><TH>Reports</TH><TH>Last reported</TH><TH>{status === 'open' ? 'Decision' : 'Outcome'}</TH></TR></THead>
          <TBody>
            {data?.items.map((r) => (
              <TR key={r.message_id}>
                <TD className="max-w-sm">
                  <div className="flex flex-col gap-1">
                    <MessageBody type={r.message_content_type} content={r.message_content} url={r.media_url} unsent={!!r.unsent_at} />
                    <div className="flex items-center gap-3">
                      <ChatLabel r={r} />
                      <button type="button" onClick={() => setOpen(r)} className="text-xs font-semibold text-ink-primary hover:underline">See in context</button>
                    </div>
                  </div>
                </TD>
                <TD>
                  <Link href={`/users/${r.sender_id}`} className="hover:underline">
                    {r.sender_name ?? 'Unnamed'}<span className="block text-xs text-ink-secondary">{r.sender_phone}</span>
                  </Link>
                </TD>
                <TD>
                  <Badge variant="danger">{r.report_count}</Badge>
                  <span className="mt-1 block text-xs capitalize text-ink-secondary">{r.reasons.map(label).join(', ')}</span>
                  {r.descriptions.length ? <span className="mt-1 block max-w-[14rem] text-xs text-ink-secondary">“{r.descriptions[0]}”</span> : null}
                </TD>
                <TD>{formatDate(r.last_reported_at)}</TD>
                <TD>{status === 'open' ? <Decide kind="messages" id={r.message_id} what="Message" /> : <Outcome resolution={r.resolution} at={r.resolved_at} />}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </ListShell>
      <ContextDialog item={open} onClose={() => setOpen(null)} />
    </div>
  )
}
