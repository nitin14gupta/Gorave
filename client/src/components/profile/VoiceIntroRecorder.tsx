import type { ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { hHeavy, hTap } from '@/lib/haptics'
import { Play, Pause } from 'lucide-react-native'
import { Orb, RecordingWave, PlaybackWave } from '@/components/ui'
import type { useVoice } from '@/hooks/useVoice'
import { Colors, FontFamily, Radius, withOpacity } from '@/constants'

/**
 * The orb voice recorder: tap the orb to record, then play back or retake.
 * Shared by onboarding and Edit Profile so both feel the same.
 */
export function VoiceIntroRecorder({ voice, heading }: { voice: ReturnType<typeof useVoice>; heading: ReactNode }) {
  const { isRecording, recordingSeconds, playbackCurrent, playbackTotal, recorded, playing, tapRecord, handlePlayPause, handleRetake, intensity } = voice
  const fmt = (s: number) => `0:${String(Math.max(0, s)).padStart(2, '0')}`

  return (
    <View style={styles.center}>
      <Pressable onPress={() => { hHeavy(); tapRecord() }}>
        <Orb width={270} height={270} intensity={intensity} isActive={isRecording} />
      </Pressable>

      <View style={styles.chip}>
        <Text style={styles.chipText}>Voice intro</Text>
      </View>

      {heading ? <Text style={styles.heading}>{heading}</Text> : null}

      <View style={styles.stateZone}>
        {isRecording ? (
          <>
            <Text style={styles.timer}>
              {fmt(recordingSeconds)} <Text style={styles.timerMax}>/ 0:30</Text>
            </Text>
            <RecordingWave isActive={isRecording} />
          </>
        ) : recorded ? (
          <>
            <View style={styles.playback}>
              <Pressable onPress={() => { hTap(); handlePlayPause() }} style={styles.playBtn}>
                {playing
                  ? <Pause size={17} color={Colors.background} strokeWidth={2} />
                  : <Play size={17} color={Colors.background} strokeWidth={2} />
                }
              </Pressable>
              <PlaybackWave isActive={playing} compact />
              <Text style={styles.playbackTime}>
                {fmt(playbackCurrent)}
                <Text style={styles.playbackDuration}> / {fmt(playbackTotal)}</Text>
              </Text>
            </View>
            <Pressable onPress={() => { hTap(); handleRetake() }}>
              <Text style={styles.retakeBtn}>Retake</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.hint}>Tap the orb to start recording · 3-30s</Text>
        )}
      </View>
    </View>

  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  chip: {
    backgroundColor: Colors.elevated,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: withOpacity(Colors.inkPrimary, 0.08),
  },
  chipText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  heading: {
    fontFamily: FontFamily.headingBold,
    fontSize: 30,
    lineHeight: 37,
    letterSpacing: -0.45,
    color: Colors.inkPrimary,
    textAlign: 'center',
  },
  stateZone: {
    height: 150,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  timer: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    color: Colors.inkPrimary,
  },
  timerMax: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  hint: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkDisabled,
    textAlign: 'center',
  },
  playback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.inkPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playbackTime: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.inkPrimary,
  },
  playbackDuration: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
  },
  retakeBtn: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
})
