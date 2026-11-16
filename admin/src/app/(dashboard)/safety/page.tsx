'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShieldAlert, Search } from 'lucide-react'
import {
  useBlocksQuery, useAdminActivityQuery,
} from '@/hooks/useReports'
import { usePagination } from '@/hooks/usePagination'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Input } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { Toolbar } from '@/components/ui/Toolbar'
import { ListShell } from '@/components/ui/ListShell'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatDate } from '@/lib/formatters'
import { ACTION_LABELS, targetHref } from '@/lib/auditLog'
import { MessageReportsTab, PhotoReportsTab } from './ModerationTabs'
import { EventReportsTab, PeopleReportsTab } from './ReportQueues'

export default function SafetyPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'Safety' }]}
        title="Safety"
        subtitle="Reported messages and album photos to review, plus reports and blocks across the platform."
      />

      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="photos">Album photos</TabsTrigger>
          <TabsTrigger value="users">People</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="blocks">Blocks</TabsTrigger>
          <TabsTrigger value="activity">Admin Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="users"><PeopleReportsTab /></TabsContent>
        <TabsContent value="events"><EventReportsTab /></TabsContent>
        <TabsContent value="messages"><MessageReportsTab /></TabsContent>
        <TabsContent value="photos"><PhotoReportsTab /></TabsContent>
        <TabsContent value="blocks"><BlocksTab /></TabsContent>
        <TabsContent value="activity"><AdminActivityTab /></TabsContent>
      </Tabs>
    </div>
  )
}

function AdminActivityTab() {
  const [q, setQ] = useState('')
  const [action, setAction] = useState('')
  const { page, pageSize, setPage, setPageSize } = usePagination(20)
  const { data, isLoading } = useAdminActivityQuery(page, pageSize, { q, action })

  return (
    <div className="flex flex-col gap-4">
      <Toolbar>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-secondary" />
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            placeholder="Search by admin name or email"
            className="w-64 pl-9"
          />
        </div>
        <Select value={action || 'all'} onValueChange={(v) => { setAction(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All actions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Toolbar>

      <ListShell
        emptyIcon={ShieldAlert}
        isLoading={isLoading}
        empty={!isLoading && data?.items.length === 0}
        emptyLabel="No admin activity matches this filter"
        total={data?.total ?? 0}
        page={data?.page ?? 1}
        pageSize={data?.page_size ?? pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      >
        <Table>
          <THead><TR><TH>Admin</TH><TH>Action</TH><TH>Detail</TH><TH>Date</TH></TR></THead>
          <TBody>
            {data?.items.map((a) => {
              const href = targetHref(a.target_type, a.target_id)
              return (
                <TR key={a.id}>
                  <TD>{a.admin_name ?? a.admin_email}</TD>
                  <TD>
                    {href ? (
                      <Link href={href} className="hover:underline">{ACTION_LABELS[a.action] ?? a.action}</Link>
                    ) : (
                      ACTION_LABELS[a.action] ?? a.action
                    )}
                  </TD>
                  <TD>{a.detail ?? '—'}</TD>
                  <TD>{formatDate(a.created_at)}</TD>
                </TR>
              )
            })}
          </TBody>
        </Table>
      </ListShell>
    </div>
  )
}

function BlocksTab() {
  const { page, pageSize, setPage, setPageSize } = usePagination(20)
  const { data, isLoading } = useBlocksQuery(page, pageSize)

  return (
    <ListShell
      emptyIcon={ShieldAlert}
      isLoading={isLoading}
      empty={!isLoading && data?.items.length === 0}
      emptyLabel="No blocks"
      total={data?.total ?? 0}
      page={data?.page ?? 1}
      pageSize={data?.page_size ?? pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
    >
      <Table>
        <THead><TR><TH>Blocked by</TH><TH>Blocked user</TH><TH>Date</TH></TR></THead>
        <TBody>
          {data?.items.map((b) => (
            <TR key={b.id}>
              <TD>
                <Link href={`/users/${b.blocker_id}`} className="hover:underline">
                  {b.blocker_name ?? 'Unnamed'}<span className="block text-xs text-ink-secondary">{b.blocker_phone}</span>
                </Link>
              </TD>
              <TD>
                <Link href={`/users/${b.blocked_id}`} className="hover:underline">
                  {b.blocked_name ?? 'Unnamed'}<span className="block text-xs text-ink-secondary">{b.blocked_phone}</span>
                </Link>
              </TD>
              <TD>{formatDate(b.created_at)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </ListShell>
  )
}
