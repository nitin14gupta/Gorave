import { useState, useCallback, useRef } from 'react'
import { useFocusEffect } from 'expo-router'
import ApiService, { Conversation, VibeRequest } from '@/api/apiService'
import { useChatUnreadStore } from '@/store/chatUnreadStore'
import { useInboxSocket } from '@/hooks/useInboxSocket'
import { invalidate, peekCached, setCached } from '@/lib/queryCache'
import { CacheKeys } from '@/constants'

const PAGE_SIZE = 20
const CACHE_KEY = CacheKeys.chatConversations

interface CachedConversations {
  active: Conversation[]
  locked: Conversation[]
  pending: VibeRequest[]
}

/** Pins on top, newest pin first; everything else by latest message. */
export const byRecent = (a: Conversation, b: Conversation) => {
  if (a.pinned_at || b.pinned_at) return (b.pinned_at ?? '').localeCompare(a.pinned_at ?? '')
  return (b.last_sent_at ?? b.last_message_at ?? '').localeCompare(a.last_sent_at ?? a.last_message_at ?? '')
}

export function useConversations() {
  const [initialCache] = useState(() => peekCached<CachedConversations>(CACHE_KEY))
  const [activeConversations, setActiveConversations] = useState<Conversation[]>(initialCache?.active ?? [])
  const [lockedConversations, setLockedConversations] = useState<Conversation[]>(initialCache?.locked ?? [])
  const [pendingVibes, setPendingVibes] = useState<VibeRequest[]>(initialCache?.pending ?? [])
  const [loading, setLoading] = useState(!initialCache)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState(false)
  const loadingMoreRef = useRef(false)

  const refresh = useCallback(async () => {
    setError(false)
    try {
      const [convData, vibeData] = await Promise.all([
        ApiService.getConversations(PAGE_SIZE, 0),
        ApiService.getReceivedVibes(),
      ])
      const active = [...convData.active].sort(byRecent)
      const locked = [...convData.locked].sort(byRecent)
      const pending = [...vibeData].sort((a, b) => b.created_at.localeCompare(a.created_at))
      setActiveConversations(active)
      setLockedConversations(locked)
      setHasMore(convData.has_more)
      setPendingVibes(pending)
      setCached(CACHE_KEY, { active, locked, pending }, 5 * 60_000, false)
      const unreadConvos = [...active, ...locked].filter(c => (c.unread_count || 0) > 0).length
      useChatUnreadStore.getState().setUnreadCount(unreadConvos)
    } catch {
      // Keep showing whatever's cached instead of blanking the list on a
      // transient failure — only flag the error if we truly have nothing.
      if (!peekCached<CachedConversations>(CACHE_KEY)) setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    try {
      const convData = await ApiService.getConversations(PAGE_SIZE, activeConversations.length)
      setActiveConversations(prev => {
        const seen = new Set(prev.map(c => c.id))
        const fresh = convData.active.filter(c => !seen.has(c.id))
        return [...prev, ...fresh].sort(byRecent)
      })
      setHasMore(convData.has_more)
    } catch {
      // keep hasMore as-is — user can retry by scrolling again
    } finally {
      loadingMoreRef.current = false
      setLoadingMore(false)
    }
  }, [hasMore, activeConversations.length])

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh]),
  )

  /** Your side only. Gone from the list straight away, back again if the call fails. */
  const deleteChat = useCallback(async (conv: Conversation) => {
    setActiveConversations(prev => prev.filter(c => c.id !== conv.id))
    try {
      await ApiService.deleteConversation(conv.id)
      invalidate(CacheKeys.chatMessages(conv.id))
    } catch (e) {
      setActiveConversations(prev => [...prev, conv].sort(byRecent))
      throw e
    }
  }, [])

  const setMuted = useCallback(async (conv: Conversation, muted: boolean) => {
    const apply = (value: boolean) => setActiveConversations(prev => prev.map(c => (c.id === conv.id ? { ...c, muted: value } : c)))
    apply(muted)
    try {
      await ApiService.muteConversation(conv.id, muted)
    } catch (e) {
      apply(!muted)
      throw e
    }
  }, [])

  /** Moves it straight away and quietly puts it back if the server says no. */
  const setPinned = useCallback(async (conv: Conversation, on: boolean) => {
    const apply = (pinnedAt: string | null) => setActiveConversations(prev =>
      prev.map(c => (c.id === conv.id ? { ...c, pinned_at: pinnedAt } : c)).sort(byRecent),
    )
    apply(on ? new Date().toISOString() : null)
    try {
      await ApiService.pinConversation(conv.id, on)
    } catch (e) {
      apply(conv.pinned_at ?? null)
      throw e
    }
  }, [])

  // Live reorder — a lightweight ping from the server (see server/routes/chat.py
  // _notify_inbox) whenever any of the user's conversations gets a new message,
  // so the list bumps to the top in realtime like WhatsApp without polling.
  useInboxSocket(refresh)

  const acceptVibe = useCallback(async (vibeId: string, icebreaker: string): Promise<void> => {
    await ApiService.respondToVibe(vibeId, 'accept', icebreaker)
    await refresh()
  }, [refresh])

  const passVibe = useCallback(async (vibeId: string): Promise<void> => {
    await ApiService.respondToVibe(vibeId, 'pass')
    setPendingVibes(prev => prev.filter(v => v.id !== vibeId))
  }, [])

  return {
    setPinned,
    setMuted,
    deleteChat,
    activeConversations,
    lockedConversations,
    pendingVibes,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    acceptVibe,
    passVibe,
  }
}
