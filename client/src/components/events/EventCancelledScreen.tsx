import { StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { CalendarX, Wallet } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { EventGateView, gateTime } from './EventGateView'
import { parseDate } from './eventDetailUtils'
import type { EventDetail } from '@/api/apiService'

interface Props {
  event: EventDetail
  isHost: boolean
  onBack: () => void
}

/**
 * A cancelled event: what happened, where the money went if anyone paid,
 * and somewhere to go next.
 */
export function EventCancelledScreen({ event, isHost, onBack }: Props) {
  const paid = !event.is_free
  const body = isHost
    ? 'You cancelled this event. Everyone going has been told.'
    : 'The host cancelled this event, so it is no longer happening. Sorry about that.'

  const refund = paid ? (
    <View style={s.refund}>
      <View style={s.refundIcon}><Wallet size={18} color={Colors.inkPrimary} strokeWidth={1.9} /></View>
      <View style={{ flex: 1 }}>
        <Text style={s.refundTitle}>{isHost ? 'Guests were refunded' : 'You were refunded'}</Text>
        <Text style={s.refundText}>
          {isHost ? 'Anyone who paid got the full amount back in their Gorave Wallet.' : 'The full amount is in your Gorave Wallet, ready for your next night.'}
        </Text>
      </View>
    </View>
  ) : null

  return (
    <EventGateView
      event={event}
      eyebrow="CANCELLED"
      title="This event was cancelled"
      body={body}
      icon={<CalendarX size={28} color={Colors.destructive} strokeWidth={1.8} />}
      steps={[{ label: 'Was planned for', time: gateTime(parseDate(event.date_time)), current: true }]}
      extra={refund}
      actions={[
        ...(paid && !isHost ? [{ label: 'Open my wallet', onPress: () => router.push('/(settings)/wallet' as any) }] : []),
        { label: isHost ? 'Host another night' : 'Find another night', onPress: () => router.push((isHost ? '/(events)/create' : '/(tabs)/events') as any), kind: paid && !isHost ? 'secondary' : 'primary' },
        { label: 'Back', onPress: onBack, kind: 'secondary' },
      ]}
      onBack={onBack}
    />
  )
}

const s = StyleSheet.create({
  refund: { alignSelf: 'stretch', flexDirection: 'row', gap: 12, marginTop: 12, padding: 16, borderRadius: 20, backgroundColor: withOpacity(Colors.inkPrimary, 0.05) },
  refundIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  refundTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  refundText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkSecondary, marginTop: 2 },
})
