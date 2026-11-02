import { View, Text, StyleSheet } from 'react-native'
import { Users } from 'lucide-react-native'
import { Colors, FontFamily, Spacing, withOpacity } from '@/constants'
import { PrimaryButton, OutlineButton } from '@/components/ui'

interface Props {
  hosting: number
  attending: number
  onGoToEvents: () => void
  onBack: () => void
}

const plural = (n: number) => `${n} upcoming event${n > 1 ? 's' : ''}`

export function DeleteBlockedEvents({ hosting, attending, onGoToEvents, onBack }: Props) {
  return (
    <View style={styles.center}>
      <View style={styles.blockerIconWrap}>
        <Users size={38} color={Colors.inkPrimary} strokeWidth={1.8} />
      </View>
      <Text style={styles.blockerTitle}>
        {hosting > 0 ? 'Your guests come first' : 'You have a night coming up'}
      </Text>
      <Text style={styles.blockerBody}>
        {hosting > 0
          ? `You are hosting ${plural(hosting)}. You can delete your account once ${hosting > 1 ? 'they are' : 'it is'} over or cancelled.`
          : `You have a ticket for ${plural(attending)}. You can delete your account once ${attending > 1 ? 'they are' : 'it is'} over.`}
      </Text>
      <View style={styles.blockerBtns}>
        <PrimaryButton label={hosting > 0 ? 'See my events' : 'See my tickets'} onPress={onGoToEvents} />
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
