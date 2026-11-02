import { useCallback, useEffect, useRef, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import ApiService, { type AlbumPage, type AlbumPhoto } from '@/api/apiService'
import type { PendingMedia } from '@/hooks/useMediaPicker'
import { getOrFetch, invalidate, peekCached } from '@/lib/queryCache'
import { hSuccess, hTap } from '@/lib/haptics'
import { usePillStore } from '@/store/pillStore'
import { CacheKeys } from '@/constants'

const MAX_PICK = 10
const UPLOADS_AT_ONCE = 2
const MAX_EDGE = 1600
// Links stay valid for hours; a short TTL just keeps the grid fresh.
const CACHE_TTL_MS = 60_000

export interface AlbumUpload {
  done: number
  total: number
  failed: string[]
}

/** Keeps uploads light on mobile data. The server resizes too, so any failure here just sends the original. */
async function shrink(asset: { uri: string; width?: number; height?: number }): Promise<string> {
  if (Math.max(asset.width ?? 0, asset.height ?? 0) <= MAX_EDGE) return asset.uri
  try {
    const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator')
    const resize = (asset.width ?? 0) >= (asset.height ?? 0) ? { width: MAX_EDGE } : { height: MAX_EDGE }
    return (await manipulateAsync(asset.uri, [{ resize }], { compress: 0.85, format: SaveFormat.JPEG })).uri
  } catch {
    return asset.uri
  }
}

export function useAlbum(eventId: string) {
  const showPill = usePillStore(s => s.show)
  const cached = peekCached<AlbumPage>(CacheKeys.album(eventId))
  const [best, setBest] = useState<AlbumPhoto[]>(cached?.best ?? [])
  const [photos, setPhotos] = useState<AlbumPhoto[]>(cached?.photos ?? [])
  const [count, setCount] = useState(cached?.count ?? 0)
  const [canAdd, setCanAdd] = useState(cached?.can_add ?? false)
  const [closesAt, setClosesAt] = useState<string | null>(cached?.closes_at ?? null)
  const [nextOffset, setNextOffset] = useState<number | null>(cached?.next_offset ?? null)
  const [loading, setLoading] = useState(!cached)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [upload, setUpload] = useState<AlbumUpload | null>(null)
  // Picked, waiting in the preview: removed from or cropped before anything uploads.
  const [pending, setPending] = useState<PendingMedia[]>([])
  const loadingMore = useRef(false)
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  const apply = (page: AlbumPage) => {
    setBest(page.best)
    setPhotos(page.photos)
    setCount(page.count)
    setCanAdd(page.can_add)
    setClosesAt(page.closes_at)
    setNextOffset(page.next_offset)
  }

  const load = useCallback(async (force = false) => {
    const key = CacheKeys.album(eventId)
    if (force) await invalidate(key)
    try {
      // Memory only: these are private photos, and only chat is encrypted on disk.
      const page = await getOrFetch(key, () => ApiService.getEventAlbum(eventId), { ttlMs: CACHE_TTL_MS, persist: false })
      if (!mounted.current) return
      apply(page)
      setError(null)
    } catch (e: any) {
      if (mounted.current) setError(e?.message || "Couldn't load the album")
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [eventId])

  useEffect(() => { Promise.resolve().then(() => load()) }, [load])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    await load(true)
    if (mounted.current) setRefreshing(false)
  }, [load])

  const loadMore = useCallback(async () => {
    if (nextOffset == null || loadingMore.current) return
    loadingMore.current = true
    try {
      const page = await ApiService.getEventAlbum(eventId, nextOffset)
      if (!mounted.current) return
      // Order can shift while people vote and upload, so drop any repeats.
      setPhotos(prev => {
        const seen = new Set(prev.map(p => p.id))
        return [...prev, ...page.photos.filter(p => !seen.has(p.id))]
      })
      setNextOffset(page.next_offset)
    } catch {
      // The next scroll to the end tries again.
    } finally {
      loadingMore.current = false
    }
  }, [nextOffset, eventId])

  const runUploads = useCallback(async (uris: string[]) => {
    setUpload({ done: 0, total: uris.length, failed: [] })
    const failed: string[] = []
    let firstError: string | null = null
    let done = 0
    let next = 0
    const worker = async () => {
      while (next < uris.length) {
        const uri = uris[next++]
        try {
          await ApiService.uploadAlbumPhoto(eventId, uri)
        } catch (e: any) {
          failed.push(uri)
          firstError = firstError ?? e?.message ?? null
        }
        done += 1
        if (mounted.current) setUpload({ done, total: uris.length, failed: [...failed] })
      }
    }
    await Promise.all(Array.from({ length: UPLOADS_AT_ONCE }, worker))
    invalidate(CacheKeys.eventDetail(eventId))
    invalidate(CacheKeys.homeJoinedEvents)
    await load(true)
    if (!mounted.current) return
    if (failed.length) {
      showPill(firstError ?? `${failed.length} didn't upload`, 'error')
    } else {
      hSuccess()
      showPill(`${uris.length} ${uris.length === 1 ? 'photo' : 'photos'} added`, 'success')
      setUpload(null)
    }
  }, [eventId, load, showPill])

  const addPhotos = useCallback(async () => {
    hTap()
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      showPill('Allow photo access to add pictures', 'error')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.85, allowsMultipleSelection: true, selectionLimit: MAX_PICK,
    })
    if (result.canceled || result.assets.length === 0) return
    setPending(result.assets.map(a => ({ uri: a.uri, type: 'image', width: a.width, height: a.height })))
  }, [showPill])

  const sendPending = useCallback(async () => {
    const batch = pending
    setPending([])
    await runUploads(await Promise.all(batch.map(shrink)))
  }, [pending, runUploads])

  const clearPending = useCallback(() => setPending([]), [])
  const removePending = useCallback((index: number) => setPending(prev => prev.filter((_, i) => i !== index)), [])
  const updatePending = useCallback((index: number, updated: PendingMedia) => {
    setPending(prev => prev.map((m, i) => (i === index ? updated : m)))
  }, [])

  const retryFailed = useCallback(() => {
    if (upload?.failed.length) void runUploads(upload.failed)
  }, [runUploads, upload])

  const dismissFailed = useCallback(() => setUpload(null), [])

  const remove = useCallback(async (photo: AlbumPhoto) => {
    await ApiService.deleteAlbumPhoto(eventId, photo.id)
    setBest(prev => prev.filter(p => p.id !== photo.id))
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
    setCount(n => Math.max(0, n - 1))
    invalidate(CacheKeys.album(eventId))
    invalidate(CacheKeys.eventDetail(eventId))
    invalidate(CacheKeys.homeJoinedEvents)
  }, [eventId])

  const report = useCallback(async (photo: AlbumPhoto, reason: string) => {
    await ApiService.reportAlbumPhoto(eventId, photo.id, reason)
    invalidate(CacheKeys.album(eventId))
    invalidate(CacheKeys.eventDetail(eventId))
  }, [eventId])

  /** Drops a reported photo once the sheet closes, so it doesn't vanish behind it. */
  const forget = useCallback((photo: AlbumPhoto) => {
    setBest(prev => prev.filter(p => p.id !== photo.id))
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
    setCount(n => Math.max(0, n - 1))
  }, [])

  /** Marks it straight away and quietly puts it back if the call fails. */
  const setVote = useCallback((photo: AlbumPhoto, on: boolean) => {
    const mark = (list: AlbumPhoto[], voted: boolean) => list.map(p => (p.id === photo.id ? { ...p, voted } : p))
    setBest(prev => mark(prev, on))
    setPhotos(prev => mark(prev, on))
    ApiService.voteAlbumPhoto(eventId, photo.id, on)
      .then(() => { invalidate(CacheKeys.album(eventId)) })
      .catch(() => {
        if (!mounted.current) return
        setBest(prev => mark(prev, !on))
        setPhotos(prev => mark(prev, !on))
      })
  }, [eventId])

  const removeUploader = useCallback(async (userId: string) => {
    await ApiService.removeAlbumUploader(eventId, userId)
    invalidate(CacheKeys.eventDetail(eventId))
    invalidate(CacheKeys.homeJoinedEvents)
    await load(true)
  }, [eventId, load])

  return { best, photos, count, canAdd, closesAt, loading, refreshing, error, upload, pending, refresh, loadMore, addPhotos, sendPending, clearPending, removePending, updatePending, retryFailed, dismissFailed, remove, report, forget, setVote, removeUploader }
}
