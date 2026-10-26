import { useState } from 'react'
import { Linking, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { CalendarX, Clock, PencilOff, ScanLine, Shield, Users } from 'lucide-react-native'
import { Colors, FontFamily, SUPPORT_EMAIL, withOpacity } from '@/constants'
import { EventGateView, gateTime } from './EventGateView'
import { parseDate } from './eventDetailUtils'
import type { EventDetail } from '@/api/apiService'
import type { LockedReason } from '@/hooks/useEventDetail'

interface Props {
  reason: LockedReason
  event: EventDetail
  onBack: () => void
}

const HOUR = 3600_000

/**
 * "You can't do this right now" for an event: check-in not open yet, editing
 * or cancelling closed, or the event isn't for you (crowd or age). Each says
 * why, shows when things happen, and offers a next step.
 */
export function EventLockedScreen({ reason, event, onBack }: Props) {
  const start = parseDate(event.date_time)
  const end = parseDate(event.end_time) ?? (start ? new Date(start.getTime() + 6 * HOUR) : null)
  const at = (h: number) => (start ? new Date(start.getTime() - h * HOUR) : null)
  const [now] = useState(() => Date.now())
  const icon = (I: typeof Clock, color: string = Colors.inkPrimary) => <I size={28} color={color} strokeWidth={1.8} />
  const toEvents = () => router.navigate('/(tabs)/events' as any)

  if (reason === 'checkin') {
    const opens = at(3)
    return (
      <EventGateView
        event={event}
        eyebrow="CHECK-IN"
        title="Check-in isn't open yet"
        body="The scanner opens 3 hours before your event starts, so tickets can't be scanned early by mistake."
        icon={icon(ScanLine)}
        countdownTo={opens}
        countdownLabel="Scanner opens in"
        steps={[
          { label: 'Now', time: gateTime(new Date(now)), done: true },
          { label: 'Scanner opens', time: gateTime(opens), current: true },
          { label: 'Event starts', time: gateTime(start) },
          { label: 'Scanner closes', time: gateTime(end) },
        ]}
        actions={[
          { label: 'See the guest list', onPress: () => router.push(`/(events)/${event.id}/attendees` as any) },
          { label: 'Back to the event', onPress: onBack, kind: 'secondary' },
        ]}
        onBack={onBack}
      />
    )
  }

  if (reason === 'edit') {
    const closedAt = at(7)
    return (
      <EventGateView
        event={event}
        eyebrow="EDITING"
        title="Editing is closed"
        body="Guests have made plans around your details, so events lock 7 hours before they start. In the last 2 hours nothing can change."
        icon={icon(PencilOff)}
        steps={[
          { label: 'Details locked', time: gateTime(closedAt), done: true },
          { label: 'Capacity locked', time: gateTime(at(2)), current: true },
          { label: 'Event starts', time: gateTime(start) },
        ]}
        extra={
          <View style={s.note}>
            <Text style={s.noteTitle}>Need to tell guests something?</Text>
            <Text style={s.noteText}>Write to us at {SUPPORT_EMAIL} and we will help you reach them.</Text>
          </View>
        }
        actions={[
          { label: 'Open the guest list', onPress: () => router.push(`/(events)/${event.id}/attendees` as any) },
          { label: 'Back to the event', onPress: onBack, kind: 'secondary' },
        ]}
        onBack={onBack}
      />
    )
  }

  if (reason === 'cancel') {
    const canStillEdit = start ? start.getTime() - now > 7 * HOUR : false
    return (
      <EventGateView
        event={event}
        eyebrow="CANCELLING"
        title="It's too late to cancel"
        body="Events can be cancelled up to 48 hours before they start. After that guests are counting on it, so cancelling needs our help."
        icon={icon(CalendarX)}
        steps={[
          { label: 'Last day to cancel', time: gateTime(at(48)), done: true },
          { label: 'Event starts', time: gateTime(start), current: true },
        ]}
        extra={
          <View style={s.note}>
            <Text style={s.noteTitle}>Something came up?</Text>
            <Text style={s.noteText}>
              {canStillEdit ? 'You can still change the details until 7 hours before. ' : ''}If you really can&apos;t host, write to us and we&apos;ll sort out your guests.
            </Text>
          </View>
        }
        actions={[
          ...(canStillEdit ? [{ label: 'Edit details instead', onPress: () => router.push(`/(events)/${event.id}/edit` as any) }] : []),
          { label: 'Email support', onPress: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Need to cancel: ${event.title}`)}`), kind: canStillEdit ? 'secondary' : 'primary' },
          { label: 'Back to the event', onPress: onBack, kind: 'secondary' },
        ]}
        onBack={onBack}
      />
    )
  }

  if (reason === 'gender') {
    const womenOnly = (event.women_pct ?? 0) >= 100
    return (
      <EventGateView
        event={event}
        eyebrow="WHO IT'S FOR"
        title={womenOnly ? 'This one is women only' : 'This one is men only'}
        body={`The host made this night for ${womenOnly ? 'women' : 'men'} only. There is plenty more on this week.`}
        icon={icon(Users)}
        actions={[
          { label: 'Find another night', onPress: toEvents },
          { label: 'Back', onPress: onBack, kind: 'secondary' },
        ]}
        onBack={onBack}
      />
    )
  }

  return (
    <EventGateView
      event={event}
      eyebrow="AGE LIMIT"
      title={`This one is ${event.age_restriction}+`}
      body={`The host set an age limit of ${event.age_restriction}. You'll be able to join nights like this once you're ${event.age_restriction}.`}
      icon={icon(Shield, Colors.destructive)}
      actions={[
        { label: 'Find another night', onPress: toEvents },
        { label: 'Back', onPress: onBack, kind: 'secondary' },
      ]}
      onBack={onBack}
    />
  )
}

const s = StyleSheet.create({
  note: { alignSelf: 'stretch', marginTop: 12, padding: 16, borderRadius: 20, backgroundColor: withOpacity(Colors.inkPrimary, 0.05), gap: 4 },
  noteTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  noteText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkSecondary },
})
