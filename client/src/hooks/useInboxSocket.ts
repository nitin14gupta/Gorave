import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import ApiService from '@/api/apiService'

export function useInboxSocket(onUpdate: () => void) {
  useEffect(() => {
    if (!useAuthStore.getState().accessToken) return

    let ws: WebSocket | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let retryCount = 0
    let closedByUs = false

    const retry = () => {
      if (closedByUs || retryCount >= 10) return
      const delay = Math.min(1000 * 2 ** retryCount, 30000)
      retryCount++
      retryTimer = setTimeout(connect, delay)
    }

    const connect = () => {
      // One-time ticket per socket; the access token never goes in the URL.
      ApiService.getInboxWsUrl().then(url => {
        if (closedByUs) return
        open(url)
      }).catch(retry)
    }

    const open = (url: string) => {
      ws = new WebSocket(url)
      ws.onopen = () => { retryCount = 0 }
      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data as string)
          if (data.type === 'conversation_updated') onUpdate()
        } catch {}
      }
      ws.onclose = (evt) => {
        if (closedByUs) return
        // Hourly re-login: reconnect right away with a fresh ticket.
        if (evt?.code === 4000) { retryCount = 0; connect(); return }
        retry()
      }
      ws.onerror = () => {}
    }
    connect()

    return () => {
      closedByUs = true
      if (retryTimer) clearTimeout(retryTimer)
      ws?.close()
    }
  }, [onUpdate])
}
