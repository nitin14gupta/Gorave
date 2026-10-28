import { View, Text, StyleSheet, Pressable, type LayoutChangeEvent } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Ghost } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'

interface Props {
  partnerId: string | null
  partnerName: string | null
  partnerUsername: string | null
  partnerAvatar: string | null
  partnerIsDeleted?: boolean
  onLayout?: (e: LayoutChangeEvent) => void
}

// Shown once, above the very first message in a conversation: a big "who is
// this" intro (square photo, name, View profile), like the top of an Instagram
// DM thread. The header hides its own name while this is on screen.
export function ChatPartnerPreview({ partnerId, partnerName, partnerUsername, partnerAvatar, partnerIsDeleted, onLayout }: Props) {
  const goToProfile = () => {
    hTap()
    if (partnerId) router.push(`/(profile)/${partnerId}` as any)
  }

  if (partnerIsDeleted) {
    return (
      <View style={s.root} onLayout={onLayout}>
        <View style={[s.avatar, s.avatarDeleted]}>
          <Ghost size={32} color={Colors.inkDisabled} strokeWidth={1.5} />
        </View>
        <Text style={[s.name, s.nameDeleted]}>{partnerName ?? '[deleted]'}</Text>
        <Text style={s.username}>This account no longer exists</Text>
      </View>
    )
  }

  return (
    <View style={s.root} onLayout={onLayout}>
      <Pressable onPress={goToProfile} hitSlop={8}>
        {partnerAvatar ? (
          <Image source={{ uri: partnerAvatar }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, s.avatarFallback]}>
            <Text style={s.avatarInitial}>{(partnerName ?? '?').charAt(0)}</Text>
          </View>
        )}
      </Pressable>
      <Text style={s.name}>{partnerName ?? 'User'}</Text>
      {partnerUsername ? <Text style={s.username}>@{partnerUsername}</Text> : null}
      <Pressable onPress={goToProfile} style={s.viewProfileBtn} hitSlop={6}>
        <Text style={s.viewProfileText}>View profile</Text>
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  root: { alignItems: 'center', paddingTop: 36, paddingBottom: 32, gap: 4 },
  avatar: { width: 120, height: 120, borderRadius: 28, borderWidth: 1, borderColor: Colors.divider },
  avatarFallback: { backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  avatarDeleted: { backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 34, color: Colors.inkPrimary },
  name: {
    fontFamily: FontFamily.headingBold, fontSize: 24, color: Colors.inkPrimary,
    marginTop: 16,
  },
  nameDeleted: { color: Colors.inkDisabled },
  username: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkDisabled },
  viewProfileBtn: {
    marginTop: 10,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  viewProfileText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
})
