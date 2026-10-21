import { useCallback, useEffect, useRef, useState } from 'react'
import ApiService, { type EventSummary } from '@/api/apiService'
import type { MapBounds } from '@/constants'
import { useLiveLocation } from '@/hooks/useLiveLocation'
import { useBrowseCity } from '@/hooks/useHomeCity'

export interface EventFilters {
  category?: string
  is_free?: boolean
  date_range?: 'tonight' | 'weekend' | 'all'
}

function apiFilters(f: EventFilters) {
  return {
    category: f.category && f.category !== 'all' ? f.category : undefined,
    is_free: f.is_free,
    date_range: f.date_range !== 'all' ? f.date_range : undefined,
  }
}

// The feed is city-scoped: everything in the browsed city (home city by
// default, switchable from the header), closest first when we know where
// the device is. GPS only sorts — it never limits what's shown.
export function useEvents() {
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<EventFilters>({})
  const { city, setCity } = useBrowseCity()
  const { lat: userLat, lng: userLng, heading: userHeading, ready: locationReady, status: locationStatus } = useLiveLocation()
  const didInit = useRef(false)

  const load = useCallback(
    async (f: EventFilters, browseCity: string | null, lat?: number, lng?: number) => {
      setLoading(true)
      setError(null)
      try {
        const result = await ApiService.getEvents({
          ...(browseCity ? { city: browseCity, lat, lng } : { lat, lng, radius_km: 50 }),
          ...apiFilters(f),
          discover: true,
          limit: 100,
        })
        setEvents(result)
      } catch (e: any) {
        setError(e.message ?? 'Failed to load events')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  // Loads events visible in the current map viewport — used by MapLibre's onRegionDidChange.
  const loadInBounds = useCallback(
    async (bounds: MapBounds) => {
      setLoading(true)
      try {
        const result = await ApiService.getEvents({
          ...apiFilters(filters),
          discover: true,
          min_lat: bounds.minLat,
          max_lat: bounds.maxLat,
          min_lng: bounds.minLng,
          max_lng: bounds.maxLng,
        })
        setEvents(result)
      } catch {
        // silently ignore viewport reload errors
      } finally {
        setLoading(false)
      }
    },
    [filters],
  )

  // First load waits for the location permission flow to resolve (granted or
  // denied) so the list can come back distance-sorted on the first paint.
  useEffect(() => {
    if (!locationReady || didInit.current) return
    didInit.current = true
    load(filters, city, userLat, userLng)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationReady, userLat, userLng, load])

  // Switching city reloads straight away.
  const prevCity = useRef(city)
  useEffect(() => {
    if (!didInit.current || prevCity.current === city) return
    prevCity.current = city
    load(filters, city, userLat, userLng)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city])

  const setFilter = useCallback(
    (updates: Partial<EventFilters>) => {
      setFiltersState((prev) => {
        const next = { ...prev, ...updates }
        load(next, city, userLat, userLng)
        return next
      })
    },
    [city, userLat, userLng, load],
  )

  const reload = useCallback(() => {
    load(filters, city, userLat, userLng)
  }, [filters, city, userLat, userLng, load])

  return {
    events, loading, error, filters, setFilter, reload, loadInBounds,
    city, setCity,
    userLat, userLng, userHeading, locationStatus,
  }
}
