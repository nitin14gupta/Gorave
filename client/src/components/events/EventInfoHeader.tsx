import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Calendar, Clock, Shield, Users } from 'lucide-react-native'
import { Colors, EVENT_ICONS, EVENT_ICON_FALLBACK, FontFamily, withOpacity } from '@/constants'
import { daysUntil, formatDateTime } from './eventDetailUtils'
import type { EventDetail } from '@/api/apiService'
import { crowdLabel } from '@/lib/crowdMix'
import { EventAddressCard } from './EventAddressCard'
import { EventPeopleCard } from './EventPeopleCard'

interface Props {
  event: EventDetail
  eventId: string
  onPressAddress: () => void
}

export function EventInfoHeader({ event, eventId, onPressAddress }: Props) {

  return (
    <>
      <View style={styles.categoryRow}>
        <View style={styles.categoryChip}>
          {(() => {
            const TypeIcon = EVENT_ICONS[event.event_type] ?? EVENT_ICON_FALLBACK
            return <TypeIcon size={12} color={Colors.inkPrimary} strokeWidth={2} />
          })()}
          <Text style={styles.categoryChipText}>{event.event_type.replace('_', ' ')}</Text>
        </View>
        {event.age_restriction && (
          <View style={styles.ageBadge}>
            <Shield size={12} color={Colors.inkSecondary} />
            <Text style={styles.ageBadgeText}>{event.age_restriction}+</Text>
          </View>
        )}
        {crowdLabel(event.women_pct) && (
          <View style={styles.ageBadge}>
            <Users size={12} color={Colors.inkSecondary} />
            <Text style={styles.ageBadgeText}>{crowdLabel(event.women_pct)}</Text>
          </View>
        )}
      </View>

      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.daysAway}>{daysUntil(event.date_time)}</Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Calendar size={16} color={Colors.inkSecondary} />
          <Text style={styles.infoText}>{formatDateTime(event.date_time)}</Text>
        </View>
        {event.end_time && (
          <>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Clock size={16} color={Colors.inkSecondary} />
              <Text style={styles.infoText}>Ends {formatDateTime(event.end_time)}</Text>
            </View>
          </>
        )}
      </View>

      <EventAddressCard event={event} eventId={eventId} onPressAddress={onPressAddress} />
      <EventPeopleCard event={event} />
    </>
  )
}

const styles = StyleSheet.create({
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.15),
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryChipText: {
    color: Colors.inkPrimary,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  ageBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  ageBadgeText: { color: Colors.inkSecondary, fontFamily: FontFamily.bodyMedium, fontSize: 12 },

  title: { fontFamily: FontFamily.headingBold, fontSize: 28, color: Colors.inkPrimary, lineHeight: 34, marginBottom: 4 },
  daysAway: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary, marginBottom: 20 },

  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoText: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkPrimary, lineHeight: 20 },
  infoDivider: { height: 1, backgroundColor: Colors.divider },
})
