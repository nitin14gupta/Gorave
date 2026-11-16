import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { PaginatedResponse } from '@/types/feedback'
import type { AppealItem, AppealStatus } from '@/types/appeals'

export function useAppealsQuery(status: AppealStatus, page: number, pageSize: number) {
  return useQuery({
    queryKey: ['admin-appeals', status, page, pageSize],
    queryFn: () => apiClient.get<PaginatedResponse<AppealItem>>(
      `/admin/appeals?${new URLSearchParams({ status, page: String(page), page_size: String(pageSize) })}`,
    ),
  })
}

/** Unlock, or keep it locked (final). They get a push either way. */
export function useDecideAppealMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, decision, note }: { id: string; decision: 'unlock' | 'deny'; note?: string }) =>
      apiClient.post(`/admin/appeals/${id}/${decision}`, { note: note || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appeals'] })
      queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] })
    },
  })
}
