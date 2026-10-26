import { View, Text, StyleSheet } from 'react-native'
import { Users } from 'lucide-react-native'
import { Colors, FontFamily, Spacing, withOpacity } from '@/constants'
import { PrimaryButton, OutlineButton } from '@/components/ui'

interface Props {
  upcomingEvents: number
  onGoToEvents: () => void
  onBack: () => void
}

export function DeleteBlockedEvents({ upcomingEvents, onGoToEvents, onBack }: Props) {
  return (
    <View style={styles.center}>
      <View style={styles.blockerIconWrap}>
        <Users size={38} color={Colors.inkPrimary} strokeWidth={1.8} />
      </View>
      <Text style={styles.blockerTitle}>
        Your guests come first
      </Text>
      <Text style={styles.blockerBody}>
        You are hosting {upcomingEvents} upcoming event{upcomingEvents > 1 ? 's' : ''}. People are counting on {upcomingEvents > 1 ? 'them' : 'it'}, so cancel {upcomingEvents > 1 ? 'them' : 'it'} or wait until {upcomingEvents > 1 ? 'they are' : 'it is'} over, then come back.
      </Text>
      <View style={styles.blockerBtns}>
        <PrimaryButton label="See my events" onPress={onGoToEvents} />
        <OutlineButton label="Back" onPress={onBack} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.screenPadding, gap: 12 },
  blockerIconWrap: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.08),
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  blockerTitle: {
    fontFamily: FontFamily.displayExtraBold, fontSize: 28, letterSpacing: -0.7,
    color: Colors.inkPrimary, textAlign: 'center',
  },
  blockerBody: {
    fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary,
    textAlign: 'center', lineHeight: 23, marginBottom: 8,
  },
  blockerBtns: { alignSelf: 'stretch', gap: 10 },
})
