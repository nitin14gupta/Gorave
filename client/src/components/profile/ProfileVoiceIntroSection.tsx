import { View, Text, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Mic, ChevronRight } from 'lucide-react-native'
import { PlaybackWave, VoicePlayButton } from '@/components/ui'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, Radius, withOpacity } from '@/constants'
import type { useVoiceEdit } from '@/hooks/useVoiceEdit'

interface Props {
  voice: ReturnType<typeof useVoiceEdit>
  hasExistingVoice: boolean
}

/** Current intro with play/pause; recording opens the full-screen orb recorder. */
export function ProfileVoiceIntroSection({ voice, hasExistingVoice }: Props) {
  const openRecorder = () => {
    hTap()
    voice.stop()
    router.push('/(profile)/voice' as any)
  }

  if (!hasExistingVoice) {
    return (
      <Pressable style={styles.box} onPress={openRecorder}>
        <View style={styles.micBtn}>
          <Mic size={22} color={Colors.inkPrimary} strokeWidth={2} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>Record voice intro</Text>
          <Text style={styles.sub}>Up to 30 seconds</Text>
        </View>
        <ChevronRight size={18} color={Colors.inkSecondary} strokeWidth={2} />
      </Pressable>
    )
  }

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.box}>
        <VoicePlayButton playing={voice.playing} onPress={voice.handlePlayPause} />
        <View style={styles.waveWrap}>
          <PlaybackWave isActive={voice.playing} compact />
        </View>
        <Text style={styles.existingLabel}>{voice.seconds > 0 ? `${voice.seconds}s` : 'Current'}</Text>
      </View>
      <Pressable onPress={openRecorder} style={styles.rerecordBtn}>
        <Mic size={13} color={Colors.inkPrimary} strokeWidth={2} />
        <Text style={styles.rerecordText}>Record new intro</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 14,
    gap: 12,
  },
  waveWrap: { flex: 1, overflow: 'hidden' },
  micBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.08),
    borderWidth: 1.5,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  title: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 2 },
  existingLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled },
  rerecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.08),
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: withOpacity(Colors.inkPrimary, 0.2),
  },
  rerecordText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkPrimary },
})
