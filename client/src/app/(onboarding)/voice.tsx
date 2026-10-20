import { View, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { OutlineButton, StepDots, PrimaryButton, TextLinkButton, Screen, GlowLinesBackground } from '@/components/ui'
import { VoiceIntroRecorder } from '@/components/profile/VoiceIntroRecorder'
import { useVoice } from '@/hooks/useVoice'
import { Colors, Spacing } from '@/constants'

export default function VoiceScreen() {
  const voice = useVoice()

  return (
    <View style={styles.rootWrap}>
      <GlowLinesBackground />
      <Screen transparent>
      <VoiceIntroRecorder voice={voice} heading={'Let people hear\nthe real you'} />

      <StepDots step={3} />

      <View style={styles.footer}>
        <OutlineButton label="Back" onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.footerMain}>
          {voice.recorded ? (
            <PrimaryButton label="Use this" onPress={voice.handleUse} loading={voice.uploading} />
          ) : (
            <TextLinkButton label="Skip for now" onPress={voice.handleSkip} />
          )}
        </View>
      </View>
      </Screen>
    </View>
  )
}

const styles = StyleSheet.create({
  rootWrap: { flex: 1, backgroundColor: Colors.background },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 16,
  },
  backBtn: { width: 96 },
  footerMain: { flex: 1 },
})
