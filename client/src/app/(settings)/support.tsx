import { useState } from 'react'
import { Linking, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SUPPORT_TOPICS, SupportView } from '@/components/support/SupportViews'
import { Colors, SUPPORT_EMAIL } from '@/constants'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { hTap, hSuccess } from '@/lib/haptics'

/** Write to support. Open with ?topic=hosting (or any topic id) to start on that topic. */
export default function SupportScreen() {
  const { topic: startTopic } = useLocalSearchParams<{ topic?: string }>()
  const showPill = usePillStore(s => s.show)
  const [topic, setTopic] = useState<string | null>(SUPPORT_TOPICS.some(t => t.id === startTopic) ? startTopic! : null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const chosen = SUPPORT_TOPICS.find(t => t.id === topic)
  const canSend = !!chosen && message.trim().length >= 10

  const send = async () => {
    if (!canSend || !chosen || sending) return
    hTap()
    setSending(true)
    try {
      await ApiService.submitSupport(chosen.id, message.trim())
      hSuccess()
      // Also open the mail app, so they keep a copy.
      const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`[Gorave] ${chosen.subject}`)}&body=${encodeURIComponent(message.trim())}`
      if (await Linking.canOpenURL(url)) await Linking.openURL(url)
      showPill("Sent. We'll reply within 1 to 2 business days.", 'default')
      router.back()
    } catch {
      showPill('Couldn’t send that. Try again, or email us directly.', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SupportView
        topic={topic}
        onTopic={setTopic}
        message={message}
        onMessage={setMessage}
        onSend={send}
        sending={sending}
        canSend={canSend}
        onBack={() => router.back()}
      />
    </View>
  )
}
