import { useState } from 'react'
import { Linking, View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Lock } from 'lucide-react-native'
import { Colors, FontFamily, SUPPORT_EMAIL, withOpacity } from '@/constants'
import { useLockStore } from '@/store/lockStore'
import { useAuth } from '@/hooks/useAuth'
import { hTap } from '@/lib/haptics'
import { PrimaryButton } from './PrimaryButton'

/**
 * The account is locked. A full-screen page you can't get past: what
 * happened, the reason if we have one, how to reach us, and Log out as the
 * only way out.
 */
function AccountLockedOverlayCore({ reason }: { reason: string }) {
  const insets = useSafeAreaInsets()
  const { handleLogout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  const onLogOut = async () => {
    if (loggingOut) return
    hTap()
    setLoggingOut(true)
    try {
      await handleLogout()
    } finally {
      useLockStore.getState().reset()
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
      <View style={s.body}>
        <View style={s.icon}>
          <Lock size={30} color={Colors.inkPrimary} strokeWidth={1.8} />
        </View>
        <Text style={s.title}>Your account is locked</Text>
        <Text style={s.text}>The Gorave team has paused this account, so you can&apos;t use the app for now.</Text>
        {reason ? (
          <View style={s.reason}>
            <Text style={s.reasonLabel}>REASON</Text>
            <Text style={s.reasonText}>{reason}</Text>
          </View>
        ) : null}
        <Text style={s.text}>
          Think this is a mistake? Write to{' '}
          <Text style={s.link} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>{SUPPORT_EMAIL}</Text>
          {' '}from the number on this account.
        </Text>
      </View>

      <PrimaryButton
        label={loggingOut ? 'Logging out…' : 'Log out'}
        onPress={onLogOut}
        loading={loggingOut}
      />
    </View>
  )
}

export function AccountLockedOverlay() {
  const locked = useLockStore((s) => s.locked)
  const reason = useLockStore((s) => s.reason)
  if (!locked) return null
  return <AccountLockedOverlayCore reason={reason} />
}

const s = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 10001,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  body: { flex: 1, justifyContent: 'center', gap: 14 },
  icon: { width: 72, height: 72, borderRadius: 24, backgroundColor: withOpacity(Colors.inkPrimary, 0.08), alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 34, lineHeight: 38, letterSpacing: -1, color: Colors.inkPrimary },
  text: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 22, color: Colors.inkSecondary },
  reason: { padding: 16, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, gap: 4 },
  reasonLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkDisabled },
  reasonText: { fontFamily: FontFamily.bodyMedium, fontSize: 15, lineHeight: 21, color: Colors.inkPrimary },
  link: { fontFamily: FontFamily.bodySemiBold, color: Colors.inkPrimary, textDecorationLine: 'underline' },
})
