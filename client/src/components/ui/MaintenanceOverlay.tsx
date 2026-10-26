import { useState } from 'react'
import { Linking, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Wrench } from 'lucide-react-native'
import { Colors, FontFamily, SUPPORT_EMAIL, withOpacity } from '@/constants'
import { useMaintenanceStore } from '@/store/maintenanceStore'
import { API_BASE_URL } from '@/api/config'
import { hTap } from '@/lib/haptics'
import { PrimaryButton } from './PrimaryButton'

/**
 * Gorave is down for maintenance. A calm full-screen page: what's going on,
 * Try again (which checks the server and lets you back in), and a way to
 * reach us.
 */
function MaintenanceOverlayCore({ message }: { message: string }) {
  const insets = useSafeAreaInsets()
  const [checking, setChecking] = useState(false)

  const onRetry = async () => {
    if (checking) return
    hTap()
    setChecking(true)
    try {
      const res = await fetch(`${API_BASE_URL}/health`)
      if (res.ok) useMaintenanceStore.getState().deactivate()
    } catch {
      // still down, stay on this screen
    } finally {
      setChecking(false)
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
      <View style={s.body}>
        <View style={s.icon}>
          <Wrench size={30} color={Colors.inkPrimary} strokeWidth={1.8} />
        </View>
        <Text style={s.title}>We&apos;ll be right back</Text>
        <Text style={s.text}>
          {message || "We're doing some quick work on Gorave. Your tickets, chats and plans are safe and will be right where you left them."}
        </Text>
        <Text style={s.text}>
          Something urgent? Write to{' '}
          <Text style={s.link} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>{SUPPORT_EMAIL}</Text>
        </Text>
      </View>

      <PrimaryButton label="Try again" onPress={onRetry} loading={checking} />
    </View>
  )
}

export function MaintenanceOverlay() {
  const active = useMaintenanceStore((s) => s.active)
  const message = useMaintenanceStore((s) => s.message)
  if (!active) return null
  return <MaintenanceOverlayCore message={message} />
}

const s = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 10000,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  body: { flex: 1, justifyContent: 'center', gap: 14 },
  icon: { width: 72, height: 72, borderRadius: 24, backgroundColor: withOpacity(Colors.inkPrimary, 0.08), alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 34, lineHeight: 38, letterSpacing: -1, color: Colors.inkPrimary },
  text: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 22, color: Colors.inkSecondary },
  link: { fontFamily: FontFamily.bodySemiBold, color: Colors.inkPrimary, textDecorationLine: 'underline' },
})
