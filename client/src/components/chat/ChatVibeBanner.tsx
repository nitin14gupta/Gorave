import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Flame } from 'lucide-react-native'
import type { VibeRequest } from '@/api/apiService'
import { Colors, FontFamily } from '@/constants'
import { hTap } from '@/lib/haptics'

interface Props {
  vibes: VibeRequest[]
  onOpenVibes: () => void
}

/**
 * Vibe banner. When people have sent you a vibe, a card at the top says
 * so, with their faces stacked, and opens your vibes. Then the messages.
 */
export function ChatTop({ vibes, onOpenVibes }: Props) {
  if (!vibes.length) return <Text style={s.label}>MESSAGES</Text>
  const faces = vibes.slice(0, 3)
  return (
    <View style={{ gap: 18 }}>
      <Pressable style={s.banner} onPress={() => { hTap(); onOpenVibes() }}>
        <View style={s.stack}>
          {faces.map((v, i) => (
            <View key={v.id} style={[s.stackFace, { marginLeft: i ? -18 : 0, zIndex: 3 - i, transform: [{ rotate: `${(i - 1) * 6}deg` }] }]}>
              {v.photos?.[0]?.url ? <Image source={{ uri: v.photos[0].url }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text style={s.init}>{(v.name ?? '?').charAt(0)}</Text>}
            </View>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.bannerTitle}>{vibes.length === 1 ? `${vibes[0].name ?? 'Someone'} wants to vibe` : `${vibes.length} people want to vibe`}</Text>
          <Text style={s.bannerSub} numberOfLines={1}>{vibes[0].message ? `“${vibes[0].message}”` : 'Accept to start chatting'}</Text>
        </View>
        <View style={s.flame}><Flame size={16} color={Colors.background} fill={Colors.background} /></View>
      </Pressable>
      <Text style={s.label}>MESSAGES</Text>
    </View>
  )
}

const s = StyleSheet.create({
  label: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkDisabled, marginTop: 4, marginBottom: 2 },
  init: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary },

  banner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 22, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  stack: { flexDirection: 'row' },
  stackFace: { width: 46, height: 46, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: Colors.surface, backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontFamily: FontFamily.headingBold, fontSize: 15, color: Colors.inkPrimary },
  bannerSub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginTop: 2 },
  flame: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.inkPrimary, alignItems: 'center', justifyContent: 'center' },


})
