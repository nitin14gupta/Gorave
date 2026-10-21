import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import QRCode from 'react-native-qrcode-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Download, MessageCircle, Share2, X } from 'lucide-react-native'
import { Colors, FontFamily, LogoBlack, withOpacity } from '@/constants'
import { LogoMark } from '@/components/ui'
import { TICKET, TicketPaper } from '@/components/events/TicketView'
import { hTap } from '@/lib/haptics'
import type { MyQrViewProps } from './types'

/**
 * A · Your pass. Your profile as a maroon pass, the same paper as every
 * Gorave ticket: your photo, name and handle, then the cream QR. Saved or
 * shared, it looks like it came from Gorave.
 */
export function MyQrA({ cardRef, shareUrl, name, handle, avatar, city, onShare, onSave, onChat, onClose }: MyQrViewProps) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <View style={s.bar}>
        <Pressable style={s.close} onPress={() => { hTap(); onClose() }} hitSlop={8}>
          <X size={18} color={Colors.inkPrimary} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View style={s.center}>
        <View ref={cardRef} collapsable={false} style={s.pass}>
          <TicketPaper />
          <View style={s.head}>
            <View style={s.avatar}>
              {avatar ? <Image source={{ uri: avatar }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text style={s.initial}>{name.charAt(0).toUpperCase()}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.name} numberOfLines={1}>{name}</Text>
              <Text style={s.handle} numberOfLines={1}>{handle}{city ? ` · ${city}` : ''}</Text>
            </View>
            <LogoMark size={22} opacity={0.85} />
          </View>
          <View style={s.perf}>
            <View style={[s.notch, { marginLeft: -12 }]} />
            <View style={s.dash} />
            <View style={[s.notch, { marginRight: -12 }]} />
          </View>
          <View style={s.qrWrap}>
            <View style={s.qrPaper}>
              <QRCode value={shareUrl} size={220} color={TICKET.qrInk} backgroundColor={TICKET.qrPaper} ecl="H" logo={LogoBlack} logoSize={46} logoBackgroundColor={TICKET.qrPaper} logoMargin={6} logoBorderRadius={10} />
            </View>
            <Text style={s.scan}>Scan to find me on Gorave</Text>
          </View>
        </View>
      </View>

      <View style={s.actions}>
        <Action icon={Share2} label="Share" primary onPress={onShare} />
        <Action icon={Download} label="Save" onPress={onSave} />
        <Action icon={MessageCircle} label="Send in chat" onPress={onChat} />
      </View>
    </View>
  )
}

function Action({ icon: I, label, onPress, primary }: { icon: typeof Share2; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable style={[s.action, primary && s.actionPrimary]} onPress={() => { hTap(); onPress() }}>
      <I size={18} color={primary ? Colors.background : Colors.inkPrimary} strokeWidth={2.2} />
      <Text style={[s.actionText, primary && { color: Colors.background }]}>{label}</Text>
    </Pressable>
  )
}

const ON = Colors.white

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bar: { paddingHorizontal: 16, paddingVertical: 8 },
  close: { width: 38, height: 38, borderRadius: 19, backgroundColor: withOpacity(Colors.inkPrimary, 0.1), alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },

  pass: { borderRadius: 24, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20 },
  avatar: { width: 60, height: 60, borderRadius: 30, overflow: 'hidden', backgroundColor: withOpacity(ON, 0.15), alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: withOpacity(ON, 0.6) },
  initial: { fontFamily: FontFamily.displayExtraBold, fontSize: 24, color: ON },
  name: { fontFamily: FontFamily.displayExtraBold, fontSize: 22, letterSpacing: -0.4, color: ON },
  handle: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: withOpacity(ON, 0.7), marginTop: 2 },
  perf: { flexDirection: 'row', alignItems: 'center', height: 24 },
  notch: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.background },
  dash: { flex: 1, height: 0, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: withOpacity(ON, 0.25), marginHorizontal: 8 },
  qrWrap: { alignItems: 'center', paddingTop: 16, paddingBottom: 22, gap: 14 },
  qrPaper: { padding: 14, borderRadius: 18, backgroundColor: TICKET.qrPaper },
  scan: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: withOpacity(ON, 0.7) },

  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  action: { flex: 1, height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  actionPrimary: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  actionText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
})
