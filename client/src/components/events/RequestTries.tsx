import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Colors, FontFamily } from '@/constants'

/** "1 of 2 requests left for this event", as a little meter. */
export function RequestTries({ left, max = 2, note }: { left: number; max?: number; note?: string }) {
  return (
    <View>
      <View style={s.row}>
        {Array.from({ length: max }, (_, i) => (
          <View key={i} style={[s.seg, { backgroundColor: i < left ? Colors.brandOrange : Colors.surfaceMuted }]} />
        ))}
        <Text style={s.text}>{left} of {max} requests left for this event</Text>
      </View>
      {note ? <Text style={s.note}>{note}</Text> : null}
    </View>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  seg: { width: 18, height: 6, borderRadius: 3 },
  text: { marginLeft: 4, fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  note: { marginTop: 6, fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
})
