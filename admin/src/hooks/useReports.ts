import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { UserReportItem, EventReportItem, MessageReportItem, BlockItem, PhotoReportItem, ContextMessage, ReportStatus } from '@/types/reports'
import type { AuditLogItem } from '@/types/audit'
import type { PaginatedResponse } from '@/types/feedback'

function usePaginatedReports<T>(
  key: string,
  path: string,
  page: number,
  pageSize: number,
  extraParams?: Record<string, string>,
) {
  return useQuery({
    queryKey: [key, page, pageSize, extraParams],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
      if (extraParams) {
        for (const [k, v] of Object.entries(extraParams)) {
          if (v) params.set(k, v)
        }
      }
      return apiClient.get<PaginatedResponse<T>>(`${path}?${params}`)
    },
  })
}

export function useUserReportsQuery(page: number, pageSize: number) {
  return usePaginatedReports<UserReportItem>('admin-reports-users', '/admin/reports/users', page, pageSize)
}

export function useEventReportsQuery(page: number, pageSize: number) {
  return usePaginatedReports<EventReportItem>('admin-reports-events', '/admin/reports/events', page, pageSize)
}

export function useMessageReportsQuery(page: number, pageSize: number, status: ReportStatus) {
  return usePaginatedReports<MessageReportItem>('admin-reports-messages', '/admin/reports/messages', page, pageSize, { status })
}

export function usePhotoReportsQuery(page: number, pageSize: number, status: ReportStatus) {
  return usePaginatedReports<PhotoReportItem>('admin-reports-photos', '/admin/reports/photos', page, pageSize, { status })
}

export function useMessageContextQuery(messageId: string | null) {
  return useQuery({
    queryKey: ['admin-report-context', messageId],
    queryFn: () => apiClient.get<{ messages: ContextMessage[] }>(`/admin/reports/messages/${messageId}/context`),
    enabled: !!messageId,
  })
}

/** Remove or keep a reported message or photo. Closes every report on it. */
export function useModerationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ kind, id, decision, note }: { kind: 'messages' | 'photos'; id: string; decision: 'remove' | 'keep'; note?: string }) =>
      apiClient.post(`/admin/reports/${kind}/${id}/${decision}`, { note: note || null }),
    onSuccess: (_data, { kind }) => {
      queryClient.invalidateQueries({ queryKey: [kind === 'messages' ? 'admin-reports-messages' : 'admin-reports-photos'] })
      queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] })
    },
  })
}

export function useBlocksQuery(page: number, pageSize: number) {
  return usePaginatedReports<BlockItem>('admin-reports-blocks', '/admin/reports/blocks', page, pageSize)
}

export function useAdminActivityQuery(
  page: number,
  pageSize: number = 20,
  filters?: { q?: string; action?: string },
) {
  return usePaginatedReports<AuditLogItem>('admin-audit-log', '/admin/audit-log', page, pageSize, {
    q: filters?.q ?? '',
    action: filters?.action ?? '',
  })
}
