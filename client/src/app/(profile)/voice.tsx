import { View, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { OutlineButton, PrimaryButton, Screen } from '@/components/ui'
import { VoiceIntroRecorder } from '@/components/profile/VoiceIntroRecorder'
import { useVoice } from '@/hooks/useVoice'
import { Colors, Spacing } from '@/constants'

/** Edit Profile's "Record new intro": the same orb recorder as onboarding, full screen. */
export default function EditVoiceScreen() {
  const voice = useVoice({ mode: 'edit' })

  return (
    <View style={styles.rootWrap}>
      <Screen transparent>
      <VoiceIntroRecorder voice={voice} heading={'Record a new\nvoice intro'} />

      <View style={styles.footer}>
        <OutlineButton label="Cancel" onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.footerMain}>
          <PrimaryButton label="Save intro" onPress={voice.handleUse} loading={voice.uploading} disabled={!voice.recorded || voice.isRecording} />
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
