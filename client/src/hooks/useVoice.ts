import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { useSharedValue, withTiming } from 'react-native-reanimated'
import { usePillStore } from '@/store/pillStore'
import {
  useAudioRecorder,
  useAudioRecorderState,
  useAudioPlayer,
  useAudioPlayerStatus,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio'
import { uploadVoice } from '@/api/user'
import { useOnboardingStore } from '@/store/onboarding'
import { usePermissionSheetStore } from '@/store/permissionSheetStore'

const MAX_SECONDS = 30
const MIN_SECONDS = 3

/**
 * The orb voice recorder. 'onboarding' keeps the take in the onboarding store
 * and moves on to interests; 'edit' (from Edit Profile) uploads the new intro
 * and goes back.
 */
export function useVoice({ mode = 'onboarding' }: { mode?: 'onboarding' | 'edit' } = {}) {
  const setStoreUri = useOnboardingStore(s => s.setField)
  const [voiceUri, setVoiceUriState] = useState('')
  const setVoiceUri = (uri: string) => {
    setVoiceUriState(uri)
    if (mode === 'onboarding') setStoreUri('voiceUri', uri)
  }
  const showPill = usePillStore.getState().show
  const showPermissionSheet = usePermissionSheetStore.getState().show
  const [recorded, setRecorded] = useState(false)
  const [uploading, setUploading] = useState(false)

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const recorderState = useAudioRecorderState(audioRecorder)
  const player = useAudioPlayer(null)
  const playerStatus = useAudioPlayerStatus(player)

  const isRecording = recorderState.isRecording
  const recordingSeconds = Math.round((recorderState.durationMillis ?? 0) / 1000)
  const playbackCurrent = Math.round((playerStatus.currentTime ?? 0))
  const playbackTotal = Math.round((playerStatus.duration ?? 0))
  const playing = playerStatus.playing

  const intensity = useSharedValue(0)
  const metering = recorderState.metering ?? -160

  useEffect(() => {
    if (isRecording) {
      // Normalize metering for a punchy bass response
      const min = -45
      const max = -5
      const val = (metering - min) / (max - min)

      // Use an ease-in curve so quiet noise is suppressed but talking peaks strongly
      const curved = Math.pow(Math.max(0, Math.min(1, val)), 1.5)
      const target = Math.max(0.1, curved)
      intensity.value = withTiming(target, { duration: 80 })
    } else {
      intensity.value = withTiming(0.1, { duration: 300 })
    }
  }, [metering, isRecording])

  const stopRecording = async () => {
    const durationSeconds = recordingSeconds
    try {
      await audioRecorder.stop()
      const uri = audioRecorder.uri
      if (uri) {
        if (durationSeconds < MIN_SECONDS) {
          setVoiceUri('')
          showPill(`Recording too short — hold for at least ${MIN_SECONDS} seconds`, 'error')
          return
        }
        setVoiceUri(uri)
        player.replace({ uri })
        setRecorded(true)
      }
    } catch {
      showPill("Recording stopped unexpectedly, try again", 'error')
    }
  }

  // Hit the 30s cap: stop. stopRecording only sets state after awaiting the
  // recorder, so nothing re-renders synchronously from this effect.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isRecording && recordingSeconds >= MAX_SECONDS) stopRecording()
  }, [recordingSeconds, isRecording])

  const tapRecord = async () => {
    if (isRecording) {
      await stopRecording()
    } else {
      const perm = await AudioModule.requestRecordingPermissionsAsync()
      if (!perm.granted) {
        showPill('Microphone access is required to record your voice.', 'error')
        showPermissionSheet(
          'Microphone Permission Required',
          'You need to allow microphone access in your device settings to record a voice intro.'
        )
        return
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true })

      setRecorded(false)
      setVoiceUri('')
      try {
        await audioRecorder.prepareToRecordAsync()
        audioRecorder.record()
      } catch {
        showPill("Couldn't start recording, try again", 'error')
      }
    }
  }

  const handlePlayPause = () => {
    if (playing) {
      player.pause()
    } else {
      player.seekTo(0)
      player.play()
    }
  }

  const handleRetake = () => {
    player.pause()
    setRecorded(false)
    setVoiceUri('')
  }

  const handleUse = async () => {
    if (!voiceUri) return
    if (player.playing) player.pause()
    setUploading(true)
    try {
      await uploadVoice(voiceUri)
      if (mode === 'edit') {
        showPill('Voice intro updated', 'success')
        router.back()
      } else {
        router.push('/(onboarding)/interests')
      }
    } catch (e: any) {
      showPill(e?.message ?? 'Upload failed — check your connection', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSkip = () => router.push('/(onboarding)/interests')

  return {
    isRecording,
    recordingSeconds,
    playbackCurrent,
    playbackTotal,
    recorded,
    uploading,
    playing,
    tapRecord,
    handlePlayPause,
    handleRetake,
    handleUse,
    handleSkip,
    intensity,
  }
}
