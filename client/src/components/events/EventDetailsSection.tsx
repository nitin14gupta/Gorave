import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors, FontFamily } from '@/constants'
import { hSelection } from '@/lib/haptics'
import type { EventDetail } from '@/api/apiService'

interface Props {
  event: EventDetail
  eventId: string
}

// The map now lives in EventAddressCard (top of the screen).
export function EventDetailsSection({ event }: Props) {
  const [showFullDesc, setShowFullDesc] = useState(false)

  return (
    <>
      {event.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text
            style={styles.sectionBody}
            numberOfLines={showFullDesc ? undefined : 3}
          >
            {event.description}
          </Text>
          {event.description.length > 140 && (
            <Pressable onPress={() => { hSelection(); setShowFullDesc(p => !p) }}>
              <Text style={styles.readMore}>{showFullDesc ? 'Show less' : 'Read more'}</Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {event.rules ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>House Rules</Text>
          <Text style={styles.sectionBody}>{event.rules}</Text>
        </View>
      ) : null}

    </>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  sectionTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary, marginBottom: 8 },
  sectionBody: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, lineHeight: 22 },
  readMore: { color: Colors.inkPrimary, fontFamily: FontFamily.bodyMedium, fontSize: 13, marginTop: 6 },

})
