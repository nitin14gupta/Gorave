import { useState, useCallback, useRef } from 'react'
import { useFocusEffect } from 'expo-router'
import ApiService, { Conversation, EventChatRow, VibeRequest } from '@/api/apiService'
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
  events?: EventChatRow[]
}

/** Pins on top, newest pin first; everything else by latest message. */
export const byRecent = (a: Conversation, b: Conversation) => {
  if (a.pinned_at || b.pinned_at) return (b.pinned_at ?? '').localeCompare(a.pinned_at ?? '')
  return (b.last_sent_at ?? b.last_message_at ?? '').localeCompare(a.last_sent_at ?? a.last_message_at ?? '')
}

/** One row in Chat: a 1:1 chat or an event group chat, mixed in by latest message. */
export type ChatListItem = { kind: 'direct'; conv: Conversation } | { kind: 'event'; chat: EventChatRow }

const pinOf = (i: ChatListItem) => (i.kind === 'direct' ? i.conv.pinned_at : i.chat.pinned_at) ?? ''
const lastOf = (i: ChatListItem) => (i.kind === 'direct' ? i.conv.last_sent_at ?? i.conv.last_message_at : i.chat.last_sent_at) ?? ''

/** Same rule as byRecent, across both kinds. */
export const byRecentItem = (a: ChatListItem, b: ChatListItem) => {
  const pa = pinOf(a), pb = pinOf(b)
  if (pa || pb) return pb.localeCompare(pa)
  return lastOf(b).localeCompare(lastOf(a))
}

export function useConversations() {
  const [initialCache] = useState(() => peekCached<CachedConversations>(CACHE_KEY))
  const [activeConversations, setActiveConversations] = useState<Conversation[]>(initialCache?.active ?? [])
  const [lockedConversations, setLockedConversations] = useState<Conversation[]>(initialCache?.locked ?? [])
  const [pendingVibes, setPendingVibes] = useState<VibeRequest[]>(initialCache?.pending ?? [])
  const [eventChats, setEventChats] = useState<EventChatRow[]>(initialCache?.events ?? [])
  const [loading, setLoading] = useState(!initialCache)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState(false)
  const loadingMoreRef = useRef(false)

  const refresh = useCallback(async () => {
    setError(false)
    try {
      const [convData, vibeData, events] = await Promise.all([
        ApiService.getConversations(PAGE_SIZE, 0),
        ApiService.getReceivedVibes(),
        // An event chat that fails to load shouldn't take the whole list down.
        ApiService.getEventChats().catch(() => null),
      ])
      const active = [...convData.active].sort(byRecent)
      const locked = [...convData.locked].sort(byRecent)
      const pending = [...vibeData].sort((a, b) => b.created_at.localeCompare(a.created_at))
      setActiveConversations(active)
      setLockedConversations(locked)
      setHasMore(convData.has_more)
      setPendingVibes(pending)
      const groups = events ?? peekCached<CachedConversations>(CACHE_KEY)?.events ?? []
      setEventChats(groups)
      setCached(CACHE_KEY, { active, locked, pending, events: groups }, 5 * 60_000, false)
      const unreadConvos = [...active, ...locked].filter(c => (c.unread_count || 0) > 0).length
      useChatUnreadStore.getState().setUnreadCount(unreadConvos)
      if (events) useChatUnreadStore.getState().setUnreadEventChats(events.filter(e => e.unread_count > 0 && !e.closed).map(e => e.event_id))
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

  const updateEventChat = useCallback((eventId: string, patch: Partial<EventChatRow>) => {
    setEventChats(prev => prev.map(c => (c.event_id === eventId ? { ...c, ...patch } : c)))
  }, [])

  const setEventPinned = useCallback(async (chat: EventChatRow, on: boolean) => {
    updateEventChat(chat.event_id, { pinned: on, pinned_at: on ? new Date().toISOString() : null })
    try {
      await ApiService.pinEventChat(chat.event_id, on)
    } catch (e) {
      updateEventChat(chat.event_id, { pinned: chat.pinned, pinned_at: chat.pinned_at })
      throw e
    }
  }, [updateEventChat])

  const setEventMuted = useCallback(async (chat: EventChatRow, muted: boolean) => {
    updateEventChat(chat.event_id, { muted })
    try {
      await ApiService.muteEventChat(chat.event_id, muted)
    } catch (e) {
      updateEventChat(chat.event_id, { muted: chat.muted })
      throw e
    }
  }, [updateEventChat])

  /** Your side only. Gone from the list straight away, back again if the call fails. */
  const deleteEventChat = useCallback(async (chat: EventChatRow) => {
    setEventChats(prev => prev.filter(c => c.event_id !== chat.event_id))
    try {
      await ApiService.deleteEventChat(chat.event_id)
      invalidate(CacheKeys.eventChat(chat.event_id))
      useChatUnreadStore.getState().setEventChatRead(chat.event_id)
    } catch (e) {
      setEventChats(prev => [...prev, chat])
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
    eventChats,
    setEventPinned,
    setEventMuted,
    deleteEventChat,
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
