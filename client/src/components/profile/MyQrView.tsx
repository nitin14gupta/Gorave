import { useState, type RefObject } from 'react'
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import QRCode from 'react-native-qrcode-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Download, MessageCircle, Share2, X } from 'lucide-react-native'
import { Colors, FontFamily, LogoBlack, withOpacity } from '@/constants'
import { LogoMark, StyledQr } from '@/components/ui'
import { TICKET, TicketPaper } from '@/components/events/TicketView'
import { hSelection, hTap } from '@/lib/haptics'

const W = Dimensions.get('window').width
const PHOTO_CARD_W = Math.round(W * 0.74)
const FACE = 72
const SWATCH = 52

export interface MyQrViewProps {
  /** The card that Save and Share capture. */
  cardRef: RefObject<View | null>
  shareUrl: string
  name: string
  handle: string
  city: string | null
  /** The person's photos, for the photo styles. */
  photos: string[]
  onShare: () => void
  onSave: () => void
  onChat: () => void
  onClose: () => void
}

/** 'pass' is the maroon ticket; a number is the index of the photo behind the card. */
type QrStyle = 'pass' | number

/**
 * Your QR, in the style you like, the way Instagram lets you pick one: the
 * maroon pass (the same paper as every Gorave ticket), or any of your
 * photos behind a white card with your face on its edge. Whatever is
 * showing is what Save and Share send.
 */
export function MyQrView({ cardRef, shareUrl, name, handle, city, photos, onShare, onSave, onChat, onClose }: MyQrViewProps) {
  const insets = useSafeAreaInsets()
  const [style, setStyle] = useState<QrStyle>('pass')
  const photo = typeof style === 'number' ? photos[style] : null
  const face = photos[0] ?? null

  return (
    <View style={s.root}>
      {photo ? (
        <>
          <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          <LinearGradient colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.92)']} style={StyleSheet.absoluteFill} />
        </>
      ) : null}

      <View style={[s.bar, { paddingTop: insets.top + 8 }]}>
        <Pressable style={[s.close, photo ? s.closeOnPhoto : null]} onPress={() => { hTap(); onClose() }} hitSlop={8}>
          <X size={18} color={photo ? Colors.white : Colors.inkPrimary} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View style={s.center}>
        {photo ? (
          <View ref={cardRef} collapsable={false} style={s.photoWrap}>
            <View style={s.photoCard}>
              <Text style={s.pcName} numberOfLines={1}>{name}</Text>
              {handle ? <Text style={s.pcHandle} numberOfLines={1}>{handle}</Text> : null}
              <View style={{ marginTop: 16 }}>
                <StyledQr data={shareUrl} size={PHOTO_CARD_W - 64} />
              </View>
              <Text style={s.pcFoot}>Scan with your camera to open my profile</Text>
            </View>
            <View style={s.face}>
              <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" />
            </View>
          </View>
        ) : (
          <View ref={cardRef} collapsable={false} style={s.pass}>
            <TicketPaper />
            <View style={s.passHead}>
              <View style={s.passAvatar}>
                {face ? <Image source={{ uri: face }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text style={s.initial}>{name.charAt(0).toUpperCase()}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.passName} numberOfLines={1}>{name}</Text>
                <Text style={s.passHandle} numberOfLines={1}>{handle}{city ? ` · ${city}` : ''}</Text>
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
                <QRCode value={shareUrl} size={210} color={TICKET.qrInk} backgroundColor={TICKET.qrPaper} ecl="H" logo={LogoBlack} logoSize={44} logoBackgroundColor={TICKET.qrPaper} logoMargin={6} logoBorderRadius={10} />
              </View>
              <Text style={s.scan}>Scan to find me on Gorave</Text>
            </View>
          </View>
        )}
      </View>

      <View style={[s.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.styles}>
          <Pressable onPress={() => { hSelection(); setStyle('pass') }} style={[s.swatch, style === 'pass' && s.swatchOn]}>
            <View style={s.swatchInner}><TicketPaper /><LogoMark size={18} opacity={0.9} /></View>
          </Pressable>
          {photos.map((url, i) => (
            <Pressable key={url + i} onPress={() => { hSelection(); setStyle(i) }} style={[s.swatch, style === i && s.swatchOn]}>
              <View style={s.swatchInner}><Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /></View>
            </Pressable>
          ))}
        </ScrollView>

        <View style={s.actions}>
          <Action icon={Share2} label="Share" primary onPress={onShare} onPhoto={!!photo} />
          <Action icon={Download} label="Save" onPress={onSave} onPhoto={!!photo} />
          <Action icon={MessageCircle} label="Send in chat" onPress={onChat} onPhoto={!!photo} />
        </View>
      </View>
    </View>
  )
}

function Action({ icon: I, label, onPress, primary, onPhoto }: { icon: typeof Share2; label: string; onPress: () => void; primary?: boolean; onPhoto: boolean }) {
  const filled = primary || onPhoto
  const ink = primary ? (onPhoto ? Colors.nearBlack : Colors.background) : onPhoto ? Colors.nearBlack : Colors.inkPrimary
  return (
    <Pressable
      style={[s.action, filled && (onPhoto ? s.actionOnPhoto : s.actionPrimary), onPhoto && !primary && { opacity: 0.92 }]}
      onPress={() => { hTap(); onPress() }}
    >
      <I size={18} color={ink} strokeWidth={2.2} />
      <Text style={[s.actionText, { color: ink }]}>{label}</Text>
    </Pressable>
  )
}

const ON = Colors.white

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bar: { paddingHorizontal: 16 },
  close: { width: 38, height: 38, borderRadius: 19, backgroundColor: withOpacity(Colors.inkPrimary, 0.1), alignItems: 'center', justifyContent: 'center' },
  closeOnPhoto: { backgroundColor: 'rgba(255,255,255,0.16)' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },

  // Pass style
  pass: { alignSelf: 'stretch', borderRadius: 24, overflow: 'hidden' },
  passHead: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20 },
  passAvatar: { width: 60, height: 60, borderRadius: 30, overflow: 'hidden', backgroundColor: withOpacity(ON, 0.15), alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: withOpacity(ON, 0.6) },
  initial: { fontFamily: FontFamily.displayExtraBold, fontSize: 24, color: ON },
  passName: { fontFamily: FontFamily.displayExtraBold, fontSize: 22, letterSpacing: -0.4, color: ON },
  passHandle: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: withOpacity(ON, 0.7), marginTop: 2 },
  perf: { flexDirection: 'row', alignItems: 'center', height: 24 },
  notch: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.background },
  dash: { flex: 1, height: 0, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: withOpacity(ON, 0.25), marginHorizontal: 8 },
  qrWrap: { alignItems: 'center', paddingTop: 16, paddingBottom: 22, gap: 14 },
  qrPaper: { padding: 14, borderRadius: 18, backgroundColor: TICKET.qrPaper },
  scan: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: withOpacity(ON, 0.7) },

  // Photo style
  photoWrap: { width: PHOTO_CARD_W, paddingTop: FACE / 2, alignItems: 'center' },
  photoCard: { width: PHOTO_CARD_W, alignItems: 'center', paddingTop: FACE / 2 + 12, paddingBottom: 22, paddingHorizontal: 24, borderRadius: 28, backgroundColor: Colors.white },
  face: { position: 'absolute', top: 0, width: FACE, height: FACE, borderRadius: FACE / 2, overflow: 'hidden', borderWidth: 4, borderColor: Colors.white, backgroundColor: '#E8E2D8' },
  pcName: { fontFamily: FontFamily.displayExtraBold, fontSize: 22, letterSpacing: -0.4, color: Colors.nearBlack },
  pcHandle: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: withOpacity(Colors.nearBlack, 0.55), marginTop: 2 },
  pcFoot: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: withOpacity(Colors.nearBlack, 0.5), marginTop: 14, textAlign: 'center' },

  // Style picker + actions
  bottom: { gap: 16 },
  styles: { gap: 10, paddingHorizontal: 20 },
  swatch: { width: SWATCH + 6, height: SWATCH + 6, borderRadius: (SWATCH + 6) / 2, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  swatchOn: { borderColor: Colors.white },
  swatchInner: { width: SWATCH, height: SWATCH, borderRadius: SWATCH / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  action: { flex: 1, height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  actionPrimary: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  actionOnPhoto: { backgroundColor: Colors.white, borderColor: Colors.white },
  actionText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13 },
})
