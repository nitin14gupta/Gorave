import React, { useEffect, useRef, useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Type, CalendarDays, MapPin, IndianRupee, Image as ImageIcon } from 'lucide-react-native'
import { hSuccess } from '@/lib/haptics'
import { parseServerDate } from '@/lib/dates'
import { Colors } from '@/constants'
import { DateTimePickerSheet, BrandedLoader, PrimaryButton } from '@/components/ui'
import { Step1Basics, Step2When, Step3Where, Step4Pricing, Step5Photos, LockedBanner, DateShiftBanner, validateCreateEventStep } from '@/components/event-form'
import { useCreateEvent, locationPayload } from '@/hooks/useCreateEvent'
import { useEventDateTimePickers } from '@/hooks/useEventDateTimePickers'
import ApiService, { type EventDetail } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { crowdLabel } from '@/lib/crowdMix'
import { EditEventView, type EditSection } from '@/components/events/EditEventView'

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const { form, set } = useCreateEvent()
  const { openDate, openStartTime, openEndDate, openEndTime, picker } = useEventDateTimePickers(form, set)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [locked, setLocked] = useState(false)
  const [capacityLocked, setCapacityLocked] = useState(false)
  const [hasAttendees, setHasAttendees] = useState(false)
  // Pending join requests also lock free↔paid (it changes how they'd join)
  const [hasRequests, setHasRequests] = useState(false)
  const [bookedCount, setBookedCount] = useState(0)
  const [largeDateShiftPending, setLargeDateShiftPending] = useState(false)
  const showPill = usePillStore(s => s.show)

  type Snapshot = {
    title: string; eventType: string; description: string; rules: string
    capacity: number; ageRestriction: number; womenPct: number | null
    city: string; area: string; addressLine1: string; addressLine2: string; pincode: string
    locationLat: number | null; locationLng: number | null
    isFree: boolean; priceInr: number; coverPhotos: string
    dateTime: number | null; endTime: number | null
  }
  const originalRef = useRef<Snapshot | null>(null)

  useEffect(() => {
    if (!id) return
    ApiService.getEvent(id)
      .then((ev: EventDetail) => {
        // Populate shared form from existing event data
        set('title', ev.title)
        set('eventType', ev.event_type)
        set('description', ev.description ?? '')
        set('rules', ev.rules ?? '')
        set('capacity', ev.capacity)
        set('ageRestriction', (ev.age_restriction as 18 | 21 | 25) ?? 18)
        set('womenPct', ev.women_pct ?? null)
        set('city', ev.city ?? '')
        set('area', ev.area ?? '')
        // Events from before structured addresses only have location_name —
        // seed line 1 with it so the host just tidies it up.
        set('addressLine1', ev.address_line1 ?? (ev.city ? '' : ev.location_name ?? ''))
        set('addressLine2', ev.address_line2 ?? '')
        set('pincode', ev.pincode ?? '')
        set('locationLat', ev.location_lat)
        set('locationLng', ev.location_lng)
        set('isFree', ev.is_free)
        set('priceInr', ev.price_inr)
        set('coverPhotos', ev.cover_photos?.map((p: { url: string }) => p.url) ?? [])

        const parseTs = (s: string) => parseServerDate(s) ?? new Date(NaN)
        const dt = parseTs(ev.date_time)
        set('dateTime', dt)
        if (ev.end_time) set('endTime', parseTs(ev.end_time))

        const editDeadline = parseTs(ev.edit_deadline)
        if (new Date() > editDeadline) setLocked(true)
        const capDeadline = new Date(parseTs(ev.date_time).getTime() - 2 * 60 * 60 * 1000)
        if (new Date() > capDeadline) setCapacityLocked(true)
        if (ev.attendee_count > 0) setHasAttendees(true)
        if ((ev.pending_request_count ?? 0) > 0) setHasRequests(true)
        setBookedCount(ev.attendee_count)

        originalRef.current = {
          title: ev.title,
          eventType: ev.event_type,
          description: ev.description ?? '',
          rules: ev.rules ?? '',
          capacity: ev.capacity,
          ageRestriction: (ev.age_restriction as number) ?? 18,
          womenPct: ev.women_pct ?? null,
          city: ev.city ?? '',
          area: ev.area ?? '',
          addressLine1: ev.address_line1 ?? (ev.city ? '' : ev.location_name ?? ''),
          addressLine2: ev.address_line2 ?? '',
          pincode: ev.pincode ?? '',
          locationLat: ev.location_lat,
          locationLng: ev.location_lng,
          isFree: ev.is_free,
          priceInr: ev.price_inr,
          coverPhotos: JSON.stringify(ev.cover_photos?.map((p: { url: string }) => p.url) ?? []),
          dateTime: parseTs(ev.date_time).getTime(),
          endTime: ev.end_time ? parseTs(ev.end_time).getTime() : null,
        }
      })
      .catch(() => showPill("Couldn't load this event", 'error'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async (skipLargeDateCheck = false) => {
    if (saving || (locked && capacityLocked)) return

    if (!form.title.trim()) { showPill('Title is required', 'error'); return }
    if (!form.isFree && form.priceInr < 99) { showPill('Minimum ticket price is ₹99', 'error'); return }

    if (form.capacity < bookedCount) {
      showPill(`${bookedCount} spots already booked — can't reduce below this`, 'error')
      return
    }

    if (!form.coverPhotos[0]) {
      showPill('Cover photo is required', 'error')
      return
    }

    const where = validateCreateEventStep(3, form, 0)
    setErrors(where.errors)
    if (where.pillMessage) { showPill(where.pillMessage, 'error'); return }

    const start = form.dateTime ? new Date(form.dateTime) : new Date()
    const end = form.endTime ? new Date(form.endTime) : null
    const o = originalRef.current

    const startChanged = o ? start.getTime() !== o.dateTime : false
    const endChanged = o ? (end?.getTime() ?? null) !== o.endTime : false

    if (startChanged) {
      const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000)
      if (start < twoHoursFromNow) {
        showPill('Start time must be at least 2 hours from now', 'error')
        return
      }
    }

    if (end && (startChanged || endChanged)) {
      const durMs = end.getTime() - start.getTime()
      if (durMs <= 0) { showPill('End time must be after start time', 'error'); return }
      if (durMs < 60 * 60 * 1000) { showPill('Event must be at least 1 hour long', 'error'); return }
      if (durMs > 72 * 60 * 60 * 1000) { showPill("Events can't run longer than 3 days", 'error'); return }
    }

    if (!skipLargeDateCheck && startChanged && o?.dateTime) {
      const daysDiff = Math.abs(start.getTime() - o.dateTime) / (1000 * 60 * 60 * 24)
      if (daysDiff > 7) {
        setLargeDateShiftPending(true)
        return
      }
    }

    setLargeDateShiftPending(false)
    setSaving(true)
    try {
      const uploadedUrls = (await Promise.all(
        form.coverPhotos.map(async (uri, index) => {
          if (!uri) return null
          if (uri.startsWith('http')) return uri
          return await ApiService.uploadEventPhoto(uri, index)
        })
      )).filter(Boolean) as string[]

      await ApiService.updateEvent(id!, {
        title: form.title.trim(),
        event_type: form.eventType,
        description: form.description.trim() || undefined,
        rules: form.rules.trim() || undefined,
        date_time: start.toISOString(),
        end_time: end ? end.toISOString() : undefined,
        capacity: form.capacity,
        age_restriction: form.ageRestriction,
        women_pct: form.womenPct,
        ...locationPayload(form),
        price_inr: form.isFree ? 0 : form.priceInr,
        cover_photos: uploadedUrls,
      })
      showPill('Event updated', 'default')
      router.back()
    } catch (e: any) {
      if (e?.status === 403) {
        showPill('Editing window has passed — event starts too soon', 'error')
      } else if ((e?.status === 400 || e?.status === 422) && e?.message) {
        showPill(e.message, 'error')
      } else {
        showPill("Couldn't save your changes, try again", 'error')
      }
      setSaving(false)
    }
  }

  const o = originalRef.current
  const isDirty = o !== null && (
    form.title !== o.title ||
    form.eventType !== o.eventType ||
    form.description !== o.description ||
    form.rules !== o.rules ||
    form.capacity !== o.capacity ||
    form.ageRestriction !== o.ageRestriction ||
    form.womenPct !== o.womenPct ||
    form.city !== o.city ||
    form.area !== o.area ||
    form.addressLine1 !== o.addressLine1 ||
    form.addressLine2 !== o.addressLine2 ||
    form.pincode !== o.pincode ||
    form.locationLat !== o.locationLat ||
    form.locationLng !== o.locationLng ||
    form.isFree !== o.isFree ||
    form.priceInr !== o.priceInr ||
    JSON.stringify(form.coverPhotos) !== o.coverPhotos ||
    (form.dateTime?.getTime() ?? null) !== o.dateTime ||
    (form.endTime?.getTime() ?? null) !== o.endTime
  )

  const hasCoverPhoto = !!form.coverPhotos[0]
  const isValid = hasCoverPhoto
  const canSave = isDirty && isValid

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <BrandedLoader />
      </View>
    )
  }

  const ic = (I: typeof Type) => <I size={18} color={Colors.inkPrimary} strokeWidth={2} />
  const dateLine = form.dateTime
    ? form.dateTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' +
      form.dateTime.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
    : 'No date yet'
  const crowd = crowdLabel(form.womenPct)
  const photos = form.coverPhotos.filter(Boolean).length

  const sections: EditSection[] = [
    {
      key: 'basics', title: 'Basics', icon: ic(Type),
      summary: [form.title || 'No title', form.eventType.replace('_', ' ')].join(' · '),
      render: () => <Step1Basics form={form} set={set} errors={errors} setErrors={setErrors} scrollable={false} disabled={locked} />,
    },
    {
      key: 'when', title: 'When and who', icon: ic(CalendarDays),
      summary: [dateLine, `${form.capacity} people`, `${form.ageRestriction}+`, crowd].filter(Boolean).join(' · '),
      note: hasAttendees ? 'Age and crowd mix are locked, guests already joined' : undefined,
      render: () => (
        <Step2When
          form={form} set={set} errors={errors} setErrors={setErrors}
          openDate={openDate} openStartTime={openStartTime} openEndDate={openEndDate} openEndTime={openEndTime}
          scrollable={false} disabled={locked}
          capacityUnlocked={locked && !capacityLocked}
          ageLocked={hasAttendees}
          ratioLocked={hasAttendees}
          ageLockNote="Locked, guests already joined"
          minCapacity={Math.max(5, bookedCount)}
          capacityNote={bookedCount > 0 ? `${bookedCount} spot${bookedCount === 1 ? '' : 's'} already booked, can't go below this` : undefined}
        />
      ),
    },
    {
      key: 'where', title: 'Where', icon: ic(MapPin),
      summary: [form.addressLine1, form.area, form.city].filter(Boolean).join(', ') || 'No address yet',
      render: () => <Step3Where form={form} set={set} errors={errors} setErrors={setErrors} disabled={locked} inline />,
    },
    {
      key: 'price', title: 'Price', icon: ic(IndianRupee),
      summary: form.isFree ? 'Free, guests request to join' : `₹${form.priceInr} a ticket`,
      note: hasAttendees ? 'Locked, guests already booked' : hasRequests ? 'Locked, people have asked to join' : undefined,
      render: () => (
        <Step4Pricing
          form={form} set={set} errors={errors} setErrors={setErrors}
          scrollable={false} disabled={locked}
          priceLocked={hasAttendees || hasRequests}
          priceLockNote={hasAttendees ? 'Locked, guests already booked' : 'Locked, people have asked to join'}
        />
      ),
    },
    {
      key: 'photos', title: 'Photos', icon: ic(ImageIcon),
      summary: photos ? `${photos} photo${photos === 1 ? '' : 's'}, the first is the cover` : 'No photos yet',
      render: () => <Step5Photos form={form} set={set} errors={errors} setErrors={setErrors} disabled={locked} inline />,
    },
  ]

  const saveBar = (!locked || (locked && !capacityLocked)) ? (
    <PrimaryButton
      label="Save changes"
      onPress={() => { if (!isDirty) return; hSuccess(); handleSave() }}
      disabled={saving || !canSave}
      loading={saving}
    />
  ) : null

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <EditEventView
        cover={form.coverPhotos[0] || null}
        title={form.title}
        sections={sections}
        banners={
          <>
            {locked && <LockedBanner capacityLocked={capacityLocked} />}
            {largeDateShiftPending && (
              <DateShiftBanner onCancel={() => setLargeDateShiftPending(false)} onConfirm={() => handleSave(true)} />
            )}
          </>
        }
        footer={saveBar}
        dirty={isDirty}
        onBack={() => router.back()}
      />

      <DateTimePickerSheet
        visible={picker.visible}
        mode={picker.mode}
        value={picker.value}
        onConfirm={picker.confirm}
        onDismiss={picker.dismiss}
      />
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
})
