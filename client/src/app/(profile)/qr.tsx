import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { buildProfileShareUrl } from '@/lib/deepLink'
import { Colors } from '@/constants'
import { useQrShare } from '@/hooks/useQrShare'
import { ShareToChatSheet } from '@/components/ui'
import { LabSwitch } from '@/components/lab/LabSwitch'
import { useLabVariant } from '@/store/labStore'
import { MyQrA } from '@/components/lab/qr/MyQrA'
import { MyQrB } from '@/components/lab/qr/MyQrB'

export default function ProfileQrScreen() {
  const { userId, username, name, avatar, city, interests } = useLocalSearchParams<{
    userId: string; username?: string; name?: string; avatar?: string; city?: string; interests?: string
  }>()
  const Layout = useLabVariant('my-qr') === 'b' ? MyQrB : MyQrA
  const [chatShareOpen, setChatShareOpen] = useState(false)

  const shareUrl = buildProfileShareUrl(userId, username)
  const handle = username ? `@${username}` : (name ?? 'this profile')
  const { cardRef, handleShare, handleSave } = useQrShare(`Find me on Gorave: ${shareUrl}`)

  return (
    <View style={s.root}>
      <Layout
        cardRef={cardRef}
        shareUrl={shareUrl}
        name={name || handle}
        handle={username ? `@${username}` : ''}
        avatar={avatar || null}
        city={city || null}
        onShare={handleShare}
        onSave={handleSave}
        onChat={() => setChatShareOpen(true)}
        onClose={() => router.back()}
      />
      <LabSwitch screen="my-qr" />

      <ShareToChatSheet
        visible={chatShareOpen}
        onClose={() => setChatShareOpen(false)}
        contentType="profile"
        metadata={{
          user_id: userId,
          name: name ?? null,
          avatar_url: avatar ?? null,
          city: city ?? null,
          interests: interests ? interests.split(',').filter(Boolean) : [],
        }}
        previewTitle={name ?? handle}
        previewSubtitle={username ? `@${username}` : null}
        previewImage={avatar}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
})
