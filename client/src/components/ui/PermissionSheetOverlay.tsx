import { Linking, Platform, StyleSheet, Text, View } from 'react-native'
import { Camera, Contact, Image as ImageIcon, MapPin, Mic, ShieldCheck } from 'lucide-react-native'
import { ConfirmSheet } from './ConfirmSheet'
import { usePermissionSheetStore } from '@/store/permissionSheetStore'
import { Colors, FontFamily, withOpacity } from '@/constants'

// Works out which permission from the sheet's title, for the icon and the
// name of the switch to look for in Settings.
function kindOf(text: string) {
  const t = text.toLowerCase()
  if (t.includes('camera')) return { Icon: Camera, name: 'Camera' }
  if (t.includes('photo') || t.includes('gallery') || t.includes('media')) return { Icon: ImageIcon, name: 'Photos' }
  if (t.includes('mic') || t.includes('record') || t.includes('voice')) return { Icon: Mic, name: 'Microphone' }
  if (t.includes('location')) return { Icon: MapPin, name: 'Location' }
  if (t.includes('contact')) return { Icon: Contact, name: 'Contacts' }
  return { Icon: ShieldCheck, name: 'the permission' }
}

/**
 * The "you turned this off" sheet: a big icon for what we need, why, and
 * the three taps to turn it back on, with Open Settings right there.
 */
export function PermissionSheetOverlay() {
  const { visible, title, body, hide } = usePermissionSheetStore()
  const { Icon, name } = kindOf(`${title} ${body}`)
  const steps = [
    'Open Settings',
    Platform.OS === 'ios' ? 'Find Gorave in the list' : 'Tap Permissions',
    `Turn on ${name}`,
  ]

  return (
    <ConfirmSheet
      visible={visible}
      title={title}
      body={body}
      confirmLabel="Open Settings"
      cancelLabel="Not now"
      onConfirm={() => Linking.openSettings()}
      onClose={hide}
      icon={<View style={s.icon}><Icon size={30} color={Colors.inkPrimary} strokeWidth={1.8} /></View>}
    >
      <View style={s.steps}>
        {steps.map((step, i) => (
          <View key={step} style={s.step}>
            <View style={s.num}><Text style={s.numText}>{i + 1}</Text></View>
            <Text style={s.stepText}>{step}</Text>
          </View>
        ))}
      </View>
    </ConfirmSheet>
  )
}

const s = StyleSheet.create({
  icon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.inkPrimary, 0.08), alignSelf: 'center' },
  steps: { gap: 10, padding: 16, borderRadius: 18, backgroundColor: withOpacity(Colors.inkPrimary, 0.05), marginTop: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  num: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.inkPrimary, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.background },
  stepText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary },
})
