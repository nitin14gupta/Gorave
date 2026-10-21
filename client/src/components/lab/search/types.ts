import type { DiscoverUser } from '@/api/apiService'

export interface RecentPerson { id: string; name: string | null; username: string | null; avatar: string | null }

export interface SearchViewProps {
  query: string
  onQuery: (q: string) => void
  onSubmit: () => void
  loading: boolean
  /** A search has run for the current query. */
  searched: boolean
  error: boolean
  results: DiscoverUser[]
  suggested: DiscoverUser[]
  suggestedLoading: boolean
  recent: RecentPerson[]
  onOpen: (u: DiscoverUser) => void
  onOpenRecent: (r: RecentPerson) => void
  onRemoveRecent: (id: string) => void
  onClearRecent: () => void
  onBack: () => void
}

export const whoLine = (u: DiscoverUser) => [u.age ? String(u.age) : null, u.city].filter(Boolean).join(' · ')
