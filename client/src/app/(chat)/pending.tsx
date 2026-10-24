import { View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { hTap } from '@/lib/haptics'
import { Colors } from '@/constants'
import { PendingVibeView } from '@/components/chat/PendingVibeView'

export default function PendingChatScreen() {
  const { partnerId, partnerName, partnerAvatar, message } = useLocalSearchParams<{
    partnerId?: string
    partnerName?: string
    partnerAvatar?: string
    message?: string
  }>()

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <PendingVibeView
        name={partnerName ?? 'them'}
        avatar={partnerAvatar || null}
        message={message || null}
        onProfile={() => {
          if (!partnerId) return
          hTap()
          router.push(`/(profile)/${partnerId}` as any)
        }}
        onBack={() => router.back()}
        onExplore={() => router.navigate('/(tabs)/')}
      />
    </View>
  )
}
