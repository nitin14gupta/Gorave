import { useEffect, useRef } from 'react'
import { ActivityIndicator, Dimensions, Linking, Platform, StyleSheet, Text, View } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { router } from 'expo-router'
import { CheckCircle2, Siren, WifiOff } from 'lucide-react-native'
import { OutlineButton, PrimaryButton, TextLinkButton } from '@/components/ui'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { usePillStore } from '@/store/pillStore'
import type { SosOutcome } from '@/hooks/useSos'

const MAX_SHEET_HEIGHT = Dimensions.get('window').height * 0.85
export const EMERGENCY_NUMBER = '112'

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="none" opacity={0.6} />
}

// Opens the phone's own messages app with everyone and the SOS text filled in.
function smsUrl(phones: string[], body: string): string {
  const to = phones.join(',')
  const text = encodeURIComponent(body)
  return Platform.OS === 'ios' ? `sms:/open?addresses=${to}&body=${text}` : `sms:${to}?body=${text}`
}

function names(list: { name: string }[]): string {
  const n = list.map(c => c.name.split(' ')[0])
  return n.length <= 2 ? n.join(' and ') : `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`
}

/**
 * What happened after SOS: shown while it's sending and after. Never says
 * "sent" unless a text really reached someone. Whoever it didn't reach can be
 * texted from the phone in one tap, and 112 is always there.
 */
function SosResultSheetCore({ sending, outcome, onClose }: { sending: boolean; outcome: SosOutcome | null; onClose: () => void }) {
  const ref = useRef<BottomSheetModal>(null)
  const showPill = usePillStore(s => s.show)
  useEffect(() => { ref.current?.present() }, [])

  const open = (url: string, failMsg: string) => {
    Linking.openURL(url).catch(() => showPill(failMsg, 'error'))
  }
  const call112 = () => open(`tel:${EMERGENCY_NUMBER}`, `Couldn't start the call. Dial ${EMERGENCY_NUMBER}.`)
  const textThem = () => {
    if (!outcome) return
    open(smsUrl(outcome.textYourself.map(c => c.phone), outcome.message), "Couldn't open your messages app")
  }

  let icon = <Siren size={26} color={Colors.destructive} strokeWidth={2.2} />
  let title = 'Sending your SOS…'
  let body = 'Hold on, this takes a few seconds. If you are in danger, call 112 now.'
  let canText = false

  if (!sending && outcome) {
    const missed = outcome.textYourself
    canText = missed.length > 0
    if (outcome.noContacts) {
      title = 'No emergency contacts yet'
      body = 'There was nobody to text. Add someone you trust, or call 112 now.'
    } else if (outcome.offline) {
      icon = <WifiOff size={26} color={Colors.destructive} strokeWidth={2.2} />
      title = "Your SOS couldn't go out"
      body = canText
        ? `We couldn't reach Gorave. Text ${names(missed)} from your phone instead, or call 112.`
        : "We couldn't reach Gorave. Call 112, or try again when you have signal."
    } else if (outcome.alerted === outcome.total) {
      icon = <CheckCircle2 size={26} color={Colors.accentGreen} strokeWidth={2.2} />
      title = 'SOS sent'
      body = `We texted ${outcome.total === 1 ? 'your emergency contact' : `all ${outcome.total} of your emergency contacts`}.`
    } else if (outcome.alerted > 0) {
      title = `SOS sent to ${outcome.alerted} of ${outcome.total}`
      body = `It didn't reach ${names(missed)}. Text them from your phone too.`
    } else {
      title = "Your SOS couldn't be sent"
      body = `The texts didn't go through. Text ${names(missed)} from your phone, or call 112.`
    }
    if (outcome.noLocation && !outcome.noContacts) body += ' Your location wasn’t included.'
  }

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      maxDynamicContentSize={MAX_SHEET_HEIGHT}
      enablePanDownToClose={!sending}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handle}
    >
      <BottomSheetView style={s.content}>
        <View style={s.iconWrap}>{sending ? <ActivityIndicator color={Colors.destructive} /> : icon}</View>
        <Text style={s.title}>{title}</Text>
        <Text style={s.body}>{body}</Text>

        <View style={s.actions}>
          {canText && <PrimaryButton label="Text them from your phone" onPress={textThem} />}
          {outcome?.noContacts && (
            <PrimaryButton
              label="Add an emergency contact"
              onPress={() => { ref.current?.dismiss(); router.push('/(safety)/contacts' as any) }}
            />
          )}
          <OutlineButton label={`Call ${EMERGENCY_NUMBER}`} destructive onPress={call112} />
          {outcome?.noLocation && !outcome.noContacts && (
            <OutlineButton label="Turn on location" onPress={() => Linking.openSettings().catch(() => {})} />
          )}
        </View>

        {!sending && (
          <TextLinkButton label="Close" onPress={() => ref.current?.dismiss()} style={s.close} />
        )}
        <View style={{ height: 24 }} />
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function SosResultSheet({ visible, ...rest }: { visible: boolean; sending: boolean; outcome: SosOutcome | null; onClose: () => void }) {
  if (!visible) return null
  return <SosResultSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.elevated, borderRadius: 28 },
  handle: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  content: { paddingHorizontal: 20, paddingTop: 8, alignItems: 'center' },
  iconWrap: {
    width: 60, height: 60, borderRadius: 30, marginBottom: 14,
    backgroundColor: withOpacity(Colors.destructive, 0.12), alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 24, letterSpacing: -0.5, color: Colors.inkPrimary, textAlign: 'center' },
  body: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14.5, lineHeight: 21, color: Colors.inkSecondary,
    textAlign: 'center', marginTop: 8, marginBottom: 20,
  },
  actions: { alignSelf: 'stretch', gap: 10 },
  close: { marginTop: 10 },
})
