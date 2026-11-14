import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { PaginatedResponse } from '@/types/feedback'
import type { HostVerificationItem, VerificationStatus } from '@/types/verification'

export function useHostVerificationsQuery(status: VerificationStatus, page: number, pageSize: number) {
  return useQuery({
    queryKey: ['admin-host-verifications', status, page, pageSize],
    queryFn: () => apiClient.get<PaginatedResponse<HostVerificationItem>>(
      `/admin/host-verifications?${new URLSearchParams({ status, page: String(page), page_size: String(pageSize) })}`,
    ),
  })
}

/** Approve or reject. The person gets a push either way. */
export function useDecideVerificationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, decision, reason }: { id: string; decision: 'approve' | 'reject'; reason?: string }) =>
      apiClient.post(`/admin/host-verifications/${id}/${decision}`, { reason: reason || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-host-verifications'] })
      queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] })
    },
  })
}
