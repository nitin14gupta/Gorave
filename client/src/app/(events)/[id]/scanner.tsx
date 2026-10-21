import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Linking, StyleSheet, View } from 'react-native'
import { useCameraPermissions } from 'expo-camera'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from '@/constants'
import ApiService, { type EventAttendee, type EventDetail } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { ScannerView, type ScanResult } from '@/components/events/ScannerView'

export default function ScannerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [resultGuest, setResultGuest] = useState<EventAttendee | null>(null)

  const [permission, requestPermission] = useCameraPermissions()
  const [attendees, setAttendees] = useState<EventAttendee[]>([])
  const [loadingAttendees, setLoadingAttendees] = useState(true)
  const [query, setQuery] = useState('')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const scanCooldown = useRef(false)
  const showPill = usePillStore(s => s.show)

  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain !== false) {
      requestPermission()
    }
  }, [])

  const loadAttendees = useCallback(() => {
    if (!id) return
    ApiService.getEventAttendees(id)
      .then(r => setAttendees(r.attendees))
      .catch((e: any) => showPill(e?.message || "Couldn't load the attendee list", 'error'))
      .finally(() => setLoadingAttendees(false))
  }, [id])

  useEffect(() => { loadAttendees() }, [loadAttendees])
  useEffect(() => { if (id) ApiService.getEvent(id).then(setEvent).catch(() => {}) }, [id])

  const handleRefresh = useCallback(async () => {
    if (!id) return
    setRefreshing(true)
    try {
      const r = await ApiService.getEventAttendees(id)
      setAttendees(r.attendees)
    } catch (e: any) {
      showPill(e?.message || "Couldn't refresh the attendee list", 'error')
    } finally {
      setRefreshing(false)
    }
  }, [id])

  const showResult = useCallback((result: ScanResult) => {
    setScanResult(result)
    setTimeout(() => setScanResult(null), 2500)
  }, [])

  const handleBarcodeScanned = useCallback(async ({ data }: { data: string }) => {
    if (!data || scanCooldown.current || scanning) return
    scanCooldown.current = true
    setScanning(true)
    setResultGuest(attendees.find(a => a.ticket_token === data) ?? null)
    try {
      const res = await ApiService.checkinAttendee(id!, data, 'qr_scan')
      showResult(res)
      if (res.already_checked_in) {
        showPill(`${res.name} is already checked in`, 'default')
      } else {
        setAttendees(prev =>
          prev.map(a =>
            a.ticket_token === data
              ? { ...a, checked_in_at: new Date().toISOString() }
              : a,
          ),
        )
      }
    } catch (e: any) {
      const msg = e?.message || 'That QR code is not a valid ticket for this event'
      showResult({ ok: false, name: '', already_checked_in: false, error: msg })
      showPill(msg, 'error')
    } finally {
      setScanning(false)
      setTimeout(() => { scanCooldown.current = false }, 3000)
    }
  }, [id, scanning, attendees])

  const handleManualCheckin = async (attendee: EventAttendee) => {
    if (checkingIn || !attendee.ticket_token) return
    setCheckingIn(attendee.id)
    try {
      const res = await ApiService.checkinAttendee(id!, attendee.ticket_token, 'manual_host')
      if (res.already_checked_in) {
        showPill(`${res.name} is already checked in`, 'default')
      } else {
        setAttendees(prev => prev.map(a =>
          a.id === attendee.id ? { ...a, checked_in_at: new Date().toISOString() } : a
        ))
        showPill(`Checked in ${res.name} by hand. This is logged.`, 'default')
      }
    } catch (e: any) {
      showPill(e?.message || "Check-in didn't work, try again", 'error')
    } finally {
      setCheckingIn(null)
    }
  }

  const filtered = attendees.filter(a => {
    const q = query.toLowerCase()
    return (
      a.name?.toLowerCase().includes(q) ||
      a.username?.toLowerCase().includes(q) ||
      a.city?.toLowerCase().includes(q)
    )
  })

  const checkedInCount = attendees.filter(a => !!a.checked_in_at).length

  return (
    <View style={s.root}>
      <ScannerView
        eventTitle={event?.title ?? ''}
        granted={!!permission?.granted}
        blocked={permission?.granted === false && permission?.canAskAgain === false}
        onRequestPermission={requestPermission}
        onOpenSettings={() => Linking.openSettings()}
        onBarcodeScanned={handleBarcodeScanned}
        scanning={scanning}
        result={scanResult}
        resultGuest={resultGuest}
        attendees={filtered}
        loading={loadingAttendees}
        query={query}
        onQuery={setQuery}
        checkingIn={checkingIn}
        onCheckin={handleManualCheckin}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        checkedIn={checkedInCount}
        onBack={() => router.back()}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
})
