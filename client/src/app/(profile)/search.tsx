import { useState, useEffect, useRef, useCallback } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { useFocusEffect } from 'expo-router'
import { hTap } from '@/lib/haptics'
import { Colors } from '@/constants'
import ApiService from '@/api/apiService'
import type { DiscoverUser } from '@/api/apiService'
import { useSearchHistoryStore } from '@/store/searchHistoryStore'
import { SearchPeopleView } from '@/components/profile/SearchPeopleView'

export default function SearchScreen() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DiscoverUser[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const [suggested, setSuggested] = useState<DiscoverUser[]>([])
  const [suggestedLoading, setSuggestedLoading] = useState(true)

  useEffect(() => {
    ApiService.getSuggestedUsers()
      .then(res => setSuggested(res.users))
      .catch(e => console.warn('[search] getSuggestedUsers failed:', e?.message ?? e))
      .finally(() => setSuggestedLoading(false))
  }, [])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { history, add, remove, clear } = useSearchHistoryStore()

  // Clear search state when leaving the tab so history shows fresh on return
  useFocusEffect(useCallback(() => {
    return () => {
      setQuery('')
      setResults([])
      setSearched(false)
      setSearchError(false)
    }
  }, []))

  const runSearch = async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setLoading(true)
    setSearchError(false)
    try {
      const data = await ApiService.searchUsers(trimmed, 1, 10)
      // Boost previously tapped profiles to the top, preserving server order within each group
      const historyIds = new Set(history.map(h => h.id))
      const sorted = [
        ...data.users.filter(u => historyIds.has(u.id)),
        ...data.users.filter(u => !historyIds.has(u.id)),
      ]
      setResults(sorted)
      setSearched(true)
    } catch {
      setResults([])
      setSearched(true)
      setSearchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = query.trim()
    if (!q) return
    debounceRef.current = setTimeout(() => runSearch(q), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  // Emptying the box drops the last results straight away.
  const handleQuery = (q: string) => {
    setQuery(q)
    if (!q.trim()) {
      setResults([])
      setSearched(false)
      setSearchError(false)
    }
  }

  const handleResultTap = (user: DiscoverUser) => {
    add({
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.photos[0]?.url ?? null,
    })
    router.push(`/(profile)/${user.id}` as any)
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SearchPeopleView
        query={query}
        onQuery={handleQuery}
        onSubmit={() => runSearch(query)}
        loading={loading}
        searched={searched}
        error={searchError}
        results={results}
        suggested={suggested}
        suggestedLoading={suggestedLoading}
        recent={history}
        onOpen={handleResultTap}
        onOpenRecent={r => router.push(`/(profile)/${r.id}` as any)}
        onRemoveRecent={id => { hTap(); remove(id) }}
        onClearRecent={() => { hTap(); clear() }}
        onBack={() => router.back()}
      />
    </View>
  )
}
