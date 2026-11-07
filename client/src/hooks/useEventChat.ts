import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import ApiService, { type EventChat, type EventChatMessage, type EventChatSeen } from '@/api/apiService'
import { uuidv4 } from '@/lib/uuid'
import { hSuccess } from '@/lib/haptics'
import { peekCached, setCached } from '@/lib/queryCache'
import { useAuthStore } from '@/store/auth'
import { useChatUnreadStore } from '@/store/chatUnreadStore'
import { CacheKeys } from '@/constants'

const TYPING_CLEAR_MS = 4000
const MAX_RECONNECT_DELAY_MS = 30000
const NOT_ALLOWED_CLOSE_CODE = 4003
const SESSION_EXPIRED_CLOSE_CODE = 4000
const CACHE_TTL_MS = 5 * 60_000

interface Cached {
  chat: EventChat
  messages: EventChatMessage[]
  seen: EventChatSeen[]
}

/**
 * One event's group chat: its own socket and state, kept apart from useChat,
 * which is built around a single partner. The same send pattern though: a
 * client_id per message, an outbox that resends on reconnect, and a saved
 * message replacing its waiting bubble.
 */
export function useEventChat(eventId: string) {
  const myId = useAuthStore(s => s.userId)
  const cacheKey = CacheKeys.eventChat(eventId)
  const [initial] = useState(() => peekCached<Cached>(cacheKey))
  const [chat, setChat] = useState<EventChat | null>(initial?.chat ?? null)
  const [messages, setMessages] = useState<EventChatMessage[]>(initial?.messages ?? [])
  const [seen, setSeen] = useState<EventChatSeen[]>(initial?.seen ?? [])
  const [typing, setTyping] = useState<Record<string, { name: string; avatar: string | null }>>({})
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(!initial)
  const [error, setError] = useState<string | null>(null)
  const [removed, setRemoved] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const ws = useRef<WebSocket | null>(null)
  const outbox = useRef(new Map<string, object>())
  const closedByUs = useRef(false)
  const retries = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const loadingMore = useRef(false)
  const blocked = useRef<string[]>([])
  const connectRef = useRef<() => void>(() => {})

  const load = useCallback(async () => {
    try {
      const [info, page] = await Promise.all([ApiService.getEventChat(eventId), ApiService.getEventChatMessages(eventId)])
      blocked.current = info.blocked_ids
      setChat(info)
      setMessages(prev => [...prev.filter(m => m.id.startsWith('_temp_')), ...page.messages])
      setSeen(page.seen)
      setError(null)
      setCached(cacheKey, { chat: info, messages: page.messages, seen: page.seen }, CACHE_TTL_MS)
    } catch (e: any) {
      if (e?.status === 403 || e?.status === 404) setRemoved(true)
      setError(e?.message || "Couldn't load this chat")
    } finally {
      setLoading(false)
    }
  }, [cacheKey, eventId])

  const swapIn = useCallback((saved: EventChatMessage) => {
    setMessages(prev => {
      const temp = saved.client_id ? `_temp_${saved.client_id}` : null
      if (prev.some(m => m.id === saved.id)) return prev.filter(m => m.id !== temp)
      if (temp && prev.some(m => m.id === temp)) return prev.map(m => (m.id === temp ? saved : m))
      return [saved, ...prev]
    })
    if (saved.client_id) outbox.current.delete(saved.client_id)
  }, [])

  const handleFrame = useCallback((data: any) => {
    switch (data.type) {
      case 'message':
        if (data.sender_id !== myId && data.content_type !== 'system' && blocked.current.includes(data.sender_id)) return
        swapIn(data)
        if (data.sender_id !== myId && ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify({ type: 'read' }))
        break
      case 'read':
        setSeen(prev => [{ id: data.user_id, name: data.name, avatar: data.avatar, last_read_at: data.at }, ...prev.filter(p => p.id !== data.user_id)])
        break
      case 'typing': {
        const timers = typingTimers.current
        if (timers.has(data.user_id)) clearTimeout(timers.get(data.user_id)!)
        setTyping(prev => {
          const next = { ...prev }
          if (data.is_typing) next[data.user_id] = { name: data.name ?? 'Someone', avatar: data.avatar ?? null }
          else delete next[data.user_id]
          return next
        })
        if (data.is_typing) timers.set(data.user_id, setTimeout(() => setTyping(prev => {
          const next = { ...prev }
          delete next[data.user_id]
          return next
        }), TYPING_CLEAR_MS))
        break
      }
      case 'reaction':
        setMessages(prev => prev.map(m => {
          if (m.id !== data.message_id) return m
          const reactions = { ...(m.reactions ?? {}) }
          if (data.emoji) reactions[data.user_id] = data.emoji
          else delete reactions[data.user_id]
          return { ...m, reactions }
        }))
        break
      case 'message_unsent':
        setMessages(prev => prev.filter(m => m.id !== data.message_id))
        setChat(prev => (prev && prev.pinned?.id === data.message_id ? { ...prev, pinned: null } : prev))
        break
      case 'locked':
        setChat(prev => (prev ? { ...prev, posting_locked: data.locked } : prev))
        break
      case 'pinned':
        setChat(prev => (prev ? { ...prev, pinned: data.message } : prev))
        break
      case 'member_removed':
        if (data.user_id === myId) setRemoved(true)
        else setChat(prev => (prev ? { ...prev, member_count: Math.max(1, prev.member_count - 1) } : prev))
        break
      case 'error':
        if (data.client_id) {
          outbox.current.delete(data.client_id)
          setFailedIds(prev => new Set(prev).add(`_temp_${data.client_id}`))
        }
        if (data.code === 'locked' || data.code === 'closed') void load()
        if (data.code === 'gone') setRemoved(true)
        break
    }
  }, [load, myId, swapIn])

  const connect = useCallback(() => {
    closedByUs.current = false
    ApiService.getEventChatWsUrl(eventId).then(url => {
      if (closedByUs.current) return
      const socket = new WebSocket(url)
      ws.current = socket
      socket.onopen = () => {
        const reconnected = retries.current > 0
        retries.current = 0
        socket.send(JSON.stringify({ type: 'read' }))
        useChatUnreadStore.getState().setEventChatRead(eventId)
        outbox.current.forEach(frame => socket.send(JSON.stringify(frame)))
        // Live frames have no replay, so anything missed comes from here.
        if (reconnected) void load()
      }
      socket.onmessage = e => {
        try { handleFrame(JSON.parse(e.data as string)) } catch {}
      }
      socket.onclose = e => {
        if (closedByUs.current) return
        if (e.code === NOT_ALLOWED_CLOSE_CODE) { setRemoved(true); return }
        const delay = e.code === SESSION_EXPIRED_CLOSE_CODE ? 0 : Math.min(1000 * 2 ** retries.current, MAX_RECONNECT_DELAY_MS)
        retries.current += 1
        retryTimer.current = setTimeout(() => connectRef.current(), delay)
      }
    }).catch(() => {
      if (closedByUs.current) return
      retries.current += 1
      retryTimer.current = setTimeout(() => connectRef.current(), Math.min(1000 * 2 ** retries.current, MAX_RECONNECT_DELAY_MS))
    })
  }, [eventId, handleFrame, load])

  useEffect(() => { connectRef.current = connect }, [connect])

  const disconnect = useCallback(() => {
    closedByUs.current = true
    if (retryTimer.current) clearTimeout(retryTimer.current)
    ws.current?.close()
    ws.current = null
  }, [])

  useEffect(() => {
    Promise.resolve().then(load)
    connect()
    // The socket marks you as in the chat, which holds back pushes, so it
    // can't stay open while the app is in the background.
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') { retries.current = 1; connect() } else if (state === 'background') disconnect()
    })
    return () => { sub.remove(); disconnect() }
  }, [connect, disconnect, load])

  const transmit = useCallback((clientId: string, frame: { content: string | null; content_type: string; metadata?: object | null }) => {
    const full = { type: 'message', client_id: clientId, ...frame }
    outbox.current.set(clientId, full)
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(full))
      return
    }
    ApiService.sendEventChatMessage(eventId, { ...frame, client_id: clientId })
      .then(swapIn)
      .catch(() => {
        outbox.current.delete(clientId)
        setFailedIds(prev => new Set(prev).add(`_temp_${clientId}`))
      })
  }, [eventId, swapIn])

  const send = useCallback((content: string | null, contentType: string, metadata?: object | null) => {
    const clientId = uuidv4()
    const temp = {
      id: `_temp_${clientId}`, conversation_id: chat?.conversation_id ?? '', sender_id: myId ?? '', content,
      content_type: contentType, metadata: metadata ?? null, sent_at: new Date().toISOString(), read_at: null,
      reactions: null, client_id: clientId, sender: { id: myId ?? '', name: null, avatar: null, is_host: !!chat?.is_host },
    } as EventChatMessage
    setMessages(prev => [temp, ...prev])
    transmit(clientId, { content, content_type: contentType, metadata })
    return clientId
  }, [chat?.conversation_id, chat?.is_host, myId, transmit])

  const retry = useCallback((tempId: string) => {
    const msg = messages.find(m => m.id === tempId)
    if (!msg?.client_id) return
    setFailedIds(prev => { const next = new Set(prev); next.delete(tempId); return next })
    transmit(msg.client_id, { content: msg.content, content_type: msg.content_type, metadata: msg.metadata })
  }, [messages, transmit])

  const markFailed = useCallback((clientId: string) => {
    setFailedIds(prev => new Set(prev).add(`_temp_${clientId}`))
  }, [])

  const addOptimisticUpload = useCallback((uri: string, type: string, width?: number, height?: number) => {
    const clientId = uuidv4()
    const temp = {
      id: `_temp_${clientId}`, conversation_id: chat?.conversation_id ?? '', sender_id: myId ?? '', content: null,
      content_type: type, metadata: { url: uri, width, height }, sent_at: new Date().toISOString(), read_at: null,
      reactions: null, client_id: clientId, sender: { id: myId ?? '', name: null, avatar: null, is_host: !!chat?.is_host },
    } as EventChatMessage
    setMessages(prev => [temp, ...prev])
    return clientId
  }, [chat?.conversation_id, chat?.is_host, myId])

  const sendTyping = useCallback((isTyping: boolean, mode: 'text' | 'voice' = 'text') => {
    if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify({ type: 'typing', is_typing: isTyping, mode }))
  }, [])

  const react = useCallback((messageId: string, emoji: string | null) => {
    if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify({ type: 'reaction', message_id: messageId, emoji }))
  }, [])

  const loadMore = useCallback(async () => {
    const oldest = messages[messages.length - 1]
    if (!oldest || !hasMore || loadingMore.current) return
    loadingMore.current = true
    try {
      const page = await ApiService.getEventChatMessages(eventId, oldest.sent_at)
      setHasMore(page.messages.length > 0)
      setMessages(prev => {
        const have = new Set(prev.map(m => m.id))
        return [...prev, ...page.messages.filter(m => !have.has(m.id))]
      })
    } catch {
      // The next scroll tries again.
    } finally {
      loadingMore.current = false
    }
  }, [eventId, hasMore, messages])

  const removeLocally = useCallback((id: string) => setMessages(prev => prev.filter(m => m.id !== id)), [])

  const setMuted = useCallback(async (muted: boolean) => {
    setChat(prev => (prev ? { ...prev, muted } : prev))
    await ApiService.muteEventChat(eventId, muted)
    hSuccess()
  }, [eventId])

  return { chat, messages, seen, typing, failedIds, loading, error, removed, send, retry, markFailed, transmit, addOptimisticUpload, sendTyping, react, loadMore, removeLocally, setMuted, reload: load }
}
