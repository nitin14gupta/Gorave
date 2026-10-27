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
  /** Lab A: Instagram-style intro (big square photo, larger name). */
  large?: boolean
  onLayout?: (e: LayoutChangeEvent) => void
}

// Shown once, above the very first message in a conversation — a quick
// "who is this" recap, matching the pattern of avatar + name + View Profile
// seen at the top of DM threads in other apps.
export function ChatPartnerPreview({ partnerId, partnerName, partnerUsername, partnerAvatar, partnerIsDeleted, large, onLayout }: Props) {
  const goToProfile = () => {
    hTap()
    if (partnerId) router.push(`/(profile)/${partnerId}` as any)
  }

  if (partnerIsDeleted) {
    return (
      <View style={[s.root, large && s.rootLarge]} onLayout={onLayout}>
        <View style={[s.avatar, large && s.avatarLarge, s.avatarDeleted]}>
          <Ghost size={32} color={Colors.inkDisabled} strokeWidth={1.5} />
        </View>
        <Text style={[s.name, large && s.nameLarge, s.nameDeleted]}>{partnerName ?? '[deleted]'}</Text>
        <Text style={s.username}>This account no longer exists</Text>
      </View>
    )
  }

  return (
    <View style={[s.root, large && s.rootLarge]} onLayout={onLayout}>
      <Pressable onPress={goToProfile} hitSlop={8}>
        {partnerAvatar ? (
          <Image source={{ uri: partnerAvatar }} style={[s.avatar, large && s.avatarLarge]} />
        ) : (
          <View style={[s.avatar, large && s.avatarLarge, s.avatarFallback]}>
            <Text style={s.avatarInitial}>{(partnerName ?? '?').charAt(0)}</Text>
          </View>
        )}
      </Pressable>
      <Text style={[s.name, large && s.nameLarge]}>{partnerName ?? 'User'}</Text>
      {partnerUsername ? <Text style={s.username}>@{partnerUsername}</Text> : null}
      <Pressable onPress={goToProfile} style={s.viewProfileBtn} hitSlop={6}>
        <Text style={s.viewProfileText}>View profile</Text>
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  root: { alignItems: 'center', paddingTop: 24, paddingBottom: 28, gap: 4 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 1, borderColor: Colors.divider },
  avatarFallback: { backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  avatarDeleted: { backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 34, color: Colors.inkPrimary },
  name: {
    fontFamily: FontFamily.headingBold, fontSize: 19, color: Colors.inkPrimary,
    marginTop: 12,
  },
  rootLarge: { paddingTop: 36, paddingBottom: 32 },
  avatarLarge: { width: 120, height: 120, borderRadius: 28 },
  nameLarge: { fontSize: 24, marginTop: 16 },
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
