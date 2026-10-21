import { router } from 'expo-router'
import type { HostReviewEvent, HostReviewItem } from '@/api/apiService'
import { useAuthStore } from '@/store/auth'
import { parseServerDate } from '@/lib/dates'

export interface HostReviewsViewProps {
  name: string
  photo: string | null
  avg: number | null
  count: number
  distribution: Record<string, number>
  events: HostReviewEvent[]
  reviews: HostReviewItem[]
  activeEventId: string | null
  onEvent: (id: string | null) => void
  activeRating: number | null
  onRating: (r: number | null) => void
  refreshing: boolean
  onRefresh: () => void
  onEndReached: () => void
  loadingMore: boolean
  onBack: () => void
}

export function reviewDate(iso: string) {
  const d = parseServerDate(iso)
  return d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
}

export function openReviewer(id: string) {
  const me = useAuthStore.getState().userId
  router.push((id === me ? '/(tabs)/profile' : `/(profile)/${id}`) as any)
}

export const openEvent = (id: string) => router.push(`/(events)/${id}` as any)
