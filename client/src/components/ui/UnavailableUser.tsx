import { View, Text, StyleSheet } from 'react-native'
import { Ghost } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'

// Someone the viewer can't see: deleted, locked, or a block either way. The
// server never says which, so the app never does either.
export const UNAVAILABLE_LABEL = 'Profile not available'

export function UnavailableAvatar({ size = 40 }: { size?: number }) {
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Ghost size={Math.round(size * 0.45)} color={Colors.inkDisabled} strokeWidth={1.5} />
    </View>
  )
}

// Full-screen version for a profile that can't be shown.
export function UnavailableProfile() {
  return (
    <View style={s.full}>
      <UnavailableAvatar size={88} />
      <Text style={s.title}>{UNAVAILABLE_LABEL}</Text>
      <Text style={s.body}>This account may have been removed, or is not visible to you right now.</Text>
    </View>
  )
}

const s = StyleSheet.create({
  avatar: { backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center' },
  full: { alignItems: 'center', paddingHorizontal: 32 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkSecondary, marginTop: 20, marginBottom: 10 },
  body: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkDisabled, textAlign: 'center', lineHeight: 21 },
})
