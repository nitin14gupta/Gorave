import { useRef, useState } from 'react'
import * as Location from 'expo-location'
import ApiService from '@/api/apiService'
import { hError, hSuccess } from '@/lib/haptics'
import { useLocationStore } from '@/store/locationStore'
import { useSafetyStore } from '@/store/safetyStore'

/**
 * What happened when SOS went out, for the result sheet. Never "sent" unless a
 * text really reached someone; anyone it didn't reach is listed so they can be
 * texted from the phone, and 112 is always one tap away.
 */
export interface SosOutcome {
  /** Texts that went out, out of how many contacts. */
  alerted: number
  total: number
  /** Contacts to text from the phone instead (server failed for them, or was unreachable). */
  textYourself: { name: string; phone: string }[]
  /** The SOS text, for that fallback. */
  message: string
  /** We couldn't reach Gorave at all (offline, server down). */
  offline: boolean
  /** No location went with it (location off, or no fix yet). */
  noLocation: boolean
  /** The server says there's nobody to text. */
  noContacts: boolean
}

const FRESH_FIX_MS = 4000

/** Location right now: the live watch's latest, or one quick fresh fix if it has none yet. */
async function currentLocation(): Promise<{ lat?: number; lng?: number }> {
  const { lat, lng, status } = useLocationStore.getState()
  if (lat != null && lng != null) return { lat, lng }
  if (status !== 'granted') return {}
  try {
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>(r => setTimeout(() => r(null), FRESH_FIX_MS)),
    ])
    return pos ? { lat: pos.coords.latitude, lng: pos.coords.longitude } : {}
  } catch {
    return {}
  }
}

function fallbackMessage(lat?: number, lng?: number): string {
  const where = lat != null && lng != null
    ? `My current location: https://maps.google.com/?q=${lat},${lng}`
    : "My location isn't shared, so please call me."
  return `🚨 SOS via Gorave: I may need assistance. ${where}`
}

export function useSos(eventId?: string) {
  const [sending, setSending] = useState(false)
  const [outcome, setOutcome] = useState<SosOutcome | null>(null)
  // A ref, not state: the hold sheet calls this from a callback captured when
  // the hold started, which would otherwise see stale values.
  const busy = useRef(false)

  const sendSos = async (): Promise<void> => {
    if (busy.current) return
    busy.current = true
    setSending(true)
    // Read at send time, not when the hold began: a fix that arrived during
    // the 5-second hold is used.
    const { lat, lng } = await currentLocation()
    const noLocation = lat == null || lng == null
    try {
      const r = await ApiService.triggerSos({ event_id: eventId, lat, lng })
      if (r.alerted > 0) hSuccess(); else hError()
      setOutcome({
        alerted: r.alerted,
        total: r.total,
        textYourself: r.unsent ?? [],
        message: r.message,
        offline: false,
        noLocation,
        noContacts: r.total === 0,
      })
    } catch (e: any) {
      hError()
      // The server answered "no contacts": nothing to text from the phone either.
      const noContacts = e?.status === 400 && /contact/i.test(e?.message ?? '')
      const saved = useSafetyStore.getState().contacts
      setOutcome({
        alerted: 0,
        total: saved.length,
        textYourself: noContacts ? [] : saved.map(c => ({ name: c.name, phone: c.phone })),
        message: fallbackMessage(lat, lng),
        offline: !noContacts,
        noLocation,
        noContacts,
      })
    } finally {
      busy.current = false
      setSending(false)
    }
  }

  return { sendSos, sending, outcome, clearOutcome: () => setOutcome(null) }
}
