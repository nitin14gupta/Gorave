import { useEffect } from 'react'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'

/**
 * Plays the current voice intro on Edit Profile. Recording a new one happens
 * on its own screen, /(profile)/voice, with the same orb as onboarding.
 */
export function useVoiceEdit(existingUrl?: string | null) {
  const player = useAudioPlayer(existingUrl ? { uri: existingUrl } : null)
  const status = useAudioPlayerStatus(player)

  // A new intro was saved on the record screen: play that one from now on.
  useEffect(() => {
    if (existingUrl) player.replace({ uri: existingUrl })
  }, [existingUrl, player])

  const playing = status.playing
  const handlePlayPause = () => {
    if (playing) {
      player.pause()
    } else {
      if (status.duration > 0 && status.currentTime >= status.duration - 0.05) player.seekTo(0)
      player.play()
    }
  }
  const stop = () => { if (playing) player.pause() }

  return { playing, seconds: Math.round(status.duration ?? 0), handlePlayPause, stop }
}
