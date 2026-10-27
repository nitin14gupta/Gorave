import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { EventListItem, EventDetailResponse, CityCount } from '@/types/event'
import type { PaginatedResponse } from '@/types/feedback'

export interface EventFilters {
  status: string
  q: string
  city?: string
  joinMode?: string
  crowd?: string
  page: number
  pageSize: number
}

export function useEventsQuery({ status, q, city, joinMode, crowd, page, pageSize }: EventFilters) {
  return useQuery({
    queryKey: ['admin-events', status, q, city, joinMode, crowd, page, pageSize],
    queryFn: () => {
      const params = new URLSearchParams({ status, page: String(page), page_size: String(pageSize) })
      if (q) params.set('q', q)
      if (city) params.set('city', city)
      if (joinMode) params.set('join_mode', joinMode)
      if (crowd) params.set('crowd', crowd)
      return apiClient.get<PaginatedResponse<EventListItem>>(`/admin/events?${params}`)
    },
  })
}

export function useEventQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-event', id],
    queryFn: () => apiClient.get<EventDetailResponse>(`/admin/events/${id}`),
    enabled: !!id,
  })
}

export function useCancelEventMutation(id: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.post(`/admin/events/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-event', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
    },
  })
}

/** Cities that have events, busiest first, for the list filter. */
export function useEventCitiesQuery() {
  return useQuery({
    queryKey: ['admin-event-cities'],
    queryFn: () => apiClient.get<{ items: CityCount[] }>('/admin/events/meta/cities'),
    staleTime: 5 * 60_000,
  })
}
