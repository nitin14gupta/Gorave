import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { LogOut } from 'lucide-react-native'
import { Colors } from '@/constants'
import { ConfirmSheet } from '@/components/ui'
import { useLeaveWaitlist } from '@/hooks/useLeaveWaitlist'
import ApiService, { type EventDetail } from '@/api/apiService'
import { WaitlistJoinedView } from '@/components/events/WaitlistJoinedView'

export default function WaitlistJoinedScreen() {
  const { id, position, coverUrl, title } = useLocalSearchParams<{
    id: string
    position: string
    coverUrl: string
    title: string
  }>()
  const router = useRouter()
  const { leave } = useLeaveWaitlist(id!)
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [event, setEvent] = useState<EventDetail | null>(null)

  useEffect(() => {
    if (!id) return
    ApiService.getEvent(id).then(setEvent).catch(() => {})
  }, [id])

  // The live position wins over the one passed in, which can be stale.
  const pos = event?.my_waitlist_position ?? parseInt(position ?? '1', 10)
  const total = event?.waitlist_count ?? pos

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <WaitlistJoinedView
        event={event}
        title={title ?? ''}
        coverUrl={coverUrl ?? ''}
        position={pos}
        total={total}
        onBack={() => router.back()}
        onLeave={() => setConfirmVisible(true)}
      />

      <ConfirmSheet
        visible={confirmVisible}
        icon={<LogOut size={28} color={Colors.destructive} strokeWidth={2} />}
        title="Leave the waitlist?"
        body="You lose your place in line and won't hear if a spot opens. You can join again, but you'll start at the back."
        confirmLabel="Leave"
        cancelLabel="Stay in line"
        destructive
        onConfirm={leave}
        onClose={() => setConfirmVisible(false)}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
})
