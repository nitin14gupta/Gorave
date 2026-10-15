import { useCallback, useEffect, useState } from 'react'
import ApiService, { type EventDetail } from '@/api/apiService'
import { useHomeCity } from '@/hooks/useHomeCity'

export interface CreateEventForm {
  title: string
  eventType: string
  description: string
  rules: string
  dateTime: Date | null
  endTime: Date | null
  capacity: number
  ageRestriction: 18 | 21 | 25
  /** Crowd mix — % of spots for women. null = open to everyone. */
  womenPct: number | null
  city: string
  area: string
  addressLine1: string
  addressLine2: string
  pincode: string
  locationLat: number | null
  locationLng: number | null
  priceInr: number
  isFree: boolean
  coverPhotos: string[]
}

const INITIAL: CreateEventForm = {
  title: '',
  eventType: '',
  description: '',
  rules: '',
  dateTime: null,
  endTime: null,
  capacity: 20,
  ageRestriction: 18,
  womenPct: null,
  city: '',
  area: '',
  addressLine1: '',
  addressLine2: '',
  pincode: '',
  locationLat: null,
  locationLng: null,
  priceInr: 0,
  isFree: false,
  coverPhotos: [],
}

/** "Flat 42, Test Towers, Lokhandwala, Andheri West, Mumbai" — mirrors how
 * the server composes location_name, for previews before publishing. */
export function composeLocationName(f: Pick<CreateEventForm, 'addressLine1' | 'addressLine2' | 'area' | 'city'>): string {
  return [f.addressLine1, f.addressLine2, f.area, f.city].map(p => p.trim()).filter(Boolean).join(', ')
}

export function locationPayload(f: CreateEventForm) {
  return {
    city: f.city,
    area: f.area.trim() || undefined,
    address_line1: f.addressLine1.trim(),
    address_line2: f.addressLine2.trim() || undefined,
    pincode: f.pincode.trim() || undefined,
    location_lat: f.locationLat ?? undefined,
    location_lng: f.locationLng ?? undefined,
  }
}

export function useCreateEvent() {
  // New events start in the host's own city — they can switch it in step 3.
  const homeCity = useHomeCity()
  const initial = useCallback((): CreateEventForm => ({ ...INITIAL, city: homeCity ?? '' }), [homeCity])
  const [form, setFormState] = useState<CreateEventForm>(initial)
  // The cached profile may arrive after mount — fill the city once it does,
  // without overriding a city the host already picked.
  useEffect(() => {
    if (homeCity) setFormState(prev => (prev.city ? prev : { ...prev, city: homeCity }))
  }, [homeCity])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const set = useCallback(<K extends keyof CreateEventForm>(key: K, value: CreateEventForm[K]) => {
    setFormState(prev => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => {
    setFormState(initial())
    setSubmitError(null)
  }, [initial])

  const submit = useCallback(async (): Promise<EventDetail | null> => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      // 1. Process and upload all local photos
      const uploadedUrls = (await Promise.all(
        form.coverPhotos.map(async (uri, index) => {
          if (!uri) return null
          if (uri.startsWith('http')) return uri // Already uploaded
          return await ApiService.uploadEventPhoto(uri, index)
        })
      )).filter(Boolean) as string[]

      // 2. Create the event with the remote URLs
      const result = await ApiService.createEvent({
        title: form.title,
        event_type: form.eventType,
        description: form.description || undefined,
        rules: form.rules || undefined,
        date_time: form.dateTime!.toISOString(),
        end_time: form.endTime ? form.endTime.toISOString() : undefined,
        capacity: form.capacity,
        age_restriction: form.ageRestriction,
        women_pct: form.womenPct,
        ...locationPayload(form),
        price_inr: form.isFree ? 0 : form.priceInr,
        cover_photos: uploadedUrls,
      })
      return result
    } catch (e: any) {
      setSubmitError(e.message ?? 'Failed to create event')
      return null
    } finally {
      setSubmitting(false)
    }
  }, [form])

  return { form, set, reset, submit, submitting, submitError }
}
