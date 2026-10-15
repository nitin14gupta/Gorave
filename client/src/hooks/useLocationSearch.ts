import { useState, useEffect } from 'react'

/** Nominatim result with addressdetails=1 — the subset we read. */
export interface PlaceResult {
  place_id: number | string
  name?: string
  display_name: string
  lat: string | null
  lon: string | null
  address?: {
    suburb?: string
    neighbourhood?: string
    city_district?: string
    quarter?: string
    road?: string
    postcode?: string
    city?: string
    town?: string
    state_district?: string
  }
}

/** Locality to prefill the "Area" field from a Nominatim address. */
export function placeArea(p: PlaceResult): string {
  const a = p.address ?? {}
  return a.suburb || a.neighbourhood || a.quarter || a.city_district || ''
}

export function placePincode(p: PlaceResult): string {
  const pc = (p.address?.postcode ?? '').replace(/\s/g, '')
  return /^\d{6}$/.test(pc) ? pc : ''
}

/**
 * @param city When set, searches are scoped to this city (appended to the
 *   query unless already present) so "Carter Road" finds the Bandra one.
 */
export function useLocationSearch(lat?: number | null, lng?: number | null, city?: string | null) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!searchOpen) return

    const delay = setTimeout(async () => {
      setLoading(true)
      try {
        // Strip Google Plus Codes (e.g. "4RRV+PHP, ") if pasted from Google Maps
        const cleanQuery = query.replace(/^[a-zA-Z0-9]{2,8}\+[a-zA-Z0-9]{2,3}[,\s]*/, '').trim()

        if (!cleanQuery && lat && lng) {
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`
          const res = await fetch(url, { headers: { 'User-Agent': 'GoraveApp/1.0' } })
          const data = await res.json()
          setResults(data && data.place_id ? [data] : [])
        } else if (cleanQuery) {
          const scoped = city && !cleanQuery.toLowerCase().includes(city.toLowerCase())
            ? `${cleanQuery}, ${city}`
            : cleanQuery
          const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(scoped)}&format=jsonv2&addressdetails=1&limit=12&countrycodes=in`
          const res = await fetch(url, { headers: { 'User-Agent': 'GoraveApp/1.0' } })
          setResults(await res.json())
        } else {
          setResults([])
        }
      } catch (e) {
        console.warn('Location search error:', e)
      } finally {
        setLoading(false)
      }
    }, 600)
    return () => clearTimeout(delay)
  }, [query, lat, lng, city, searchOpen])

  return {
    searchOpen,
    setSearchOpen,
    query,
    setQuery,
    results,
    loading,
  }
}
