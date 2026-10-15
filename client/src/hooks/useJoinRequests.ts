import { useCallback, useEffect, useState } from 'react'
import ApiService, { type JoinRequestsResponse } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { hSuccess } from '@/lib/haptics'

export function useJoinRequests(id: string | undefined) {
  const showPill = usePillStore(s => s.show)
  const [data, setData] = useState<JoinRequestsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState(false)
  // user id currently being accepted/declined, or 'bulk'
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (!id) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setLoadError(false)
    try {
      setData(await ApiService.getJoinRequests(id))
    } catch {
      setLoadError(true)
      showPill("Couldn't load requests", 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id, showPill])

  useEffect(() => { load() }, [load])

  const accept = useCallback(async (userId: string, name: string | null) => {
    if (!id || busy) return
    setBusy(userId)
    try {
      await ApiService.acceptJoinRequest(id, userId)
      hSuccess()
      showPill(`${name ?? 'Guest'} is in 🎉`, 'default')
      await load(true)
    } catch (e: any) {
      showPill(e?.message || "Couldn't accept this request", 'error')
      load(true)
    } finally {
      setBusy(null)
    }
  }, [id, busy, load, showPill])

  const decline = useCallback(async (userId: string) => {
    if (!id || busy) return
    setBusy(userId)
    try {
      await ApiService.declineJoinRequest(id, userId)
      await load(true)
    } catch (e: any) {
      showPill(e?.message || "Couldn't decline this request", 'error')
    } finally {
      setBusy(null)
    }
  }, [id, busy, load, showPill])

  /** Accepts oldest-first until spots or the crowd mix run out. */
  const acceptAllThatFit = useCallback(async () => {
    if (!id || busy || !data) return
    const ids = data.requests.filter(r => r.can_accept).map(r => r.id)
    if (!ids.length) return
    setBusy('bulk')
    try {
      const res = await ApiService.acceptJoinRequestsBulk(id, ids)
      hSuccess()
      const skipped = res.skipped.length ? ` · ${res.skipped.length} didn't fit` : ''
      showPill(`Accepted ${res.accepted.length}${skipped}`, 'default')
      await load(true)
    } catch (e: any) {
      showPill(e?.message || "Couldn't accept requests", 'error')
    } finally {
      setBusy(null)
    }
  }, [id, busy, data, load, showPill])

  return { data, loading, refreshing, loadError, busy, accept, decline, acceptAllThatFit, reload: load }
}
