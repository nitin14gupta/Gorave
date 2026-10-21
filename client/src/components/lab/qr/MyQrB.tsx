import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Download, MessageCircle, Share2, X } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { StyledQr } from '@/components/ui'
import { hTap } from '@/lib/haptics'
import type { MyQrViewProps } from './types'

const W = Dimensions.get('window').width
const CARD_W = Math.round(W * 0.78)

/**
 * B · Your photo. Your profile photo fills the screen, darkened, and a
 * white QR card sits on it with your face at the top edge, like the
 * Instagram QR page. The white card is what gets saved and shared.
 */
export function MyQrB({ cardRef, shareUrl, name, handle, avatar, city, onShare, onSave, onChat, onClose }: MyQrViewProps) {
  const insets = useSafeAreaInsets()
  return (
    <View style={s.root}>
      {avatar ? <Image source={{ uri: avatar }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
      <LinearGradient colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.92)']} style={StyleSheet.absoluteFill} />

      <View style={[s.bar, { paddingTop: insets.top + 8 }]}>
        <Pressable style={s.close} onPress={() => { hTap(); onClose() }} hitSlop={8}>
          <X size={18} color={Colors.white} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View style={s.center}>
        <View ref={cardRef} collapsable={false} style={s.cardWrap}>
          <View style={s.card}>
            <Text style={s.name} numberOfLines={1}>{name}</Text>
            <Text style={s.handle} numberOfLines={1}>{handle}</Text>
            <View style={{ marginTop: 16 }}>
              <StyledQr data={shareUrl} size={CARD_W - 64} />
            </View>
            <Text style={s.foot}>Scan with your camera to open my profile</Text>
          </View>
          <View style={s.face}>
            {avatar ? <Image source={{ uri: avatar }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text style={s.initial}>{name.charAt(0).toUpperCase()}</Text>}
          </View>
        </View>
      </View>

      <View style={[s.actions, { paddingBottom: insets.bottom + 20 }]}>
        <Round icon={Share2} label="Share" onPress={onShare} />
        <Round icon={Download} label="Save" onPress={onSave} />
        <Round icon={MessageCircle} label="Chat" onPress={onChat} />
      </View>
    </View>
  )
}

function Round({ icon: I, label, onPress }: { icon: typeof Share2; label: string; onPress: () => void }) {
  return (
    <Pressable style={s.round} onPress={() => { hTap(); onPress() }}>
      <View style={s.roundIcon}><I size={20} color={Colors.nearBlack} strokeWidth={2.2} /></View>
      <Text style={s.roundText}>{label}</Text>
    </Pressable>
  )
}

const FACE = 76

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.nearBlack },
  bar: { paddingHorizontal: 16 },
  close: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  cardWrap: { width: CARD_W, paddingTop: FACE / 2, alignItems: 'center' },
  card: { width: CARD_W, alignItems: 'center', paddingTop: FACE / 2 + 12, paddingBottom: 22, paddingHorizontal: 24, borderRadius: 28, backgroundColor: Colors.white },
  face: { position: 'absolute', top: 0, width: FACE, height: FACE, borderRadius: FACE / 2, overflow: 'hidden', borderWidth: 4, borderColor: Colors.white, backgroundColor: '#E8E2D8', alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: FontFamily.displayExtraBold, fontSize: 30, color: Colors.nearBlack },
  name: { fontFamily: FontFamily.displayExtraBold, fontSize: 22, letterSpacing: -0.4, color: Colors.nearBlack },
  handle: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: withOpacity(Colors.nearBlack, 0.55), marginTop: 2 },
  foot: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: withOpacity(Colors.nearBlack, 0.5), marginTop: 14, textAlign: 'center' },

  actions: { flexDirection: 'row', justifyContent: 'center', gap: 36 },
  round: { alignItems: 'center', gap: 8 },
  roundIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  roundText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.white },
})
