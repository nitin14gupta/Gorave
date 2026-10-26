import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'

export function LockedBanner({ capacityLocked }: { capacityLocked: boolean }) {
  return (
    <View style={s.lockedBanner}>
      <Text style={s.lockedText}>
        {capacityLocked
          ? 'Editing is closed. The event starts in under 2 hours.'
          : 'Details are locked because the event starts within 7 hours. You can still raise the capacity to let waitlisted guests in.'}
      </Text>
    </View>
  )
}

export function DateShiftBanner({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <View style={s.dateShiftBanner}>
      <Text style={s.dateShiftTitle}>Large date change</Text>
      <Text style={s.dateShiftBody}>
        You moved this event by more than 7 days. All attendees will be notified and given 48 hours to cancel for a full refund.
      </Text>
      <View style={s.dateShiftBtns}>
        <Pressable style={s.dateShiftCancel} onPress={onCancel}>
          <Text style={s.dateShiftCancelText}>Go back</Text>
        </Pressable>
        <Pressable style={s.dateShiftConfirm} onPress={onConfirm}>
          <Text style={s.dateShiftConfirmText}>Yes, update</Text>
        </Pressable>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  lockedBanner: {
    marginHorizontal: 16, marginTop: 8, borderRadius: 16,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.06),
    paddingVertical: 12, paddingHorizontal: 16,
  },
  lockedText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, lineHeight: 19, color: Colors.inkPrimary },

  dateShiftBanner: {
    marginHorizontal: 16, marginTop: 8, borderRadius: 16,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.06),
    paddingVertical: 14, paddingHorizontal: 16, gap: 8,
  },
  dateShiftTitle: { fontFamily: FontFamily.headingBold, fontSize: 15, color: Colors.inkPrimary },
  dateShiftBody: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, lineHeight: 18 },
  dateShiftBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  dateShiftCancel: {
    flex: 1, height: 38, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.divider,
    alignItems: 'center', justifyContent: 'center',
  },
  dateShiftCancelText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
  dateShiftConfirm: {
    flex: 1, height: 38, borderRadius: 20,
    backgroundColor: Colors.inkPrimary,
    alignItems: 'center', justifyContent: 'center',
  },
  dateShiftConfirmText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.background },
})
