import { useEffect, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Clock, Lock, ShieldX } from 'lucide-react-native'
import { Colors, FontFamily, SUPPORT_EMAIL, withOpacity } from '@/constants'
import { useLockStore } from '@/store/lockStore'
import { useAuth } from '@/hooks/useAuth'
import { hTap } from '@/lib/haptics'
import ApiService, { type AccountAppealState } from '@/api/apiService'
import { AppealFlow } from '@/components/account/AppealFlow'
import { PrimaryButton } from './PrimaryButton'

const when = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

/**
 * The account is locked. A full-screen page you can't get past: what
 * happened and why, and one way to appeal (a code, a live selfie, your side).
 * After that: waiting for review, or, if it was turned down, final.
 */
function AccountLockedOverlayCore({ reason }: { reason: string }) {
  const insets = useSafeAreaInsets()
  const { handleLogout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const [state, setState] = useState<AccountAppealState | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [appealing, setAppealing] = useState(false)

  useEffect(() => {
    ApiService.getAppeal()
      .then(st => {
        setState(st)
        // Unlocked since (an admin approved the appeal): straight back in.
        if (!st.locked) useLockStore.getState().reset()
      })
      .catch(() => setState(null))
      .finally(() => setLoaded(true))
  }, [])

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

  if (appealing && state) {
    return (
      <View style={s.full}>
        <AppealFlow phoneHint={state.phone_hint} onCancel={() => setAppealing(false)} onDone={st => { setState(st); setAppealing(false) }} />
      </View>
    )
  }

  const appeal = state?.appeal
  const final = !!state?.final
  const review = appeal?.status === 'review'
  const shownReason = state?.reason ?? reason

  const Icon = final ? ShieldX : review ? Clock : Lock
  const title = final ? 'Your account stays locked' : review ? 'We’re reviewing your appeal' : 'Your account is locked'
  const text = final
    ? 'We looked at your appeal and the lock stays. This decision is final.'
    : review
      ? `Sent ${appeal ? when(appeal.submitted_at) : 'today'}. A person on our team is looking at it, usually within 48 hours. We’ll send you a notification.`
      : 'The Gorave team has paused this account, so you can’t use the app for now.'

  return (
    <View style={[s.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
      <View style={s.body}>
        <View style={[s.icon, final && s.iconFinal]}>
          <Icon size={30} color={final ? Colors.destructive : Colors.inkPrimary} strokeWidth={1.8} />
        </View>
        <Text style={s.title}>{title}</Text>
        <Text style={s.text}>{text}</Text>
        {shownReason && !review ? (
          <View style={s.reason}>
            <Text style={s.reasonLabel}>{final ? 'WHY' : 'REASON'}</Text>
            <Text style={s.reasonText}>{final && appeal?.note ? appeal.note : shownReason}</Text>
          </View>
        ) : null}
        {state?.can_appeal ? (
          <Text style={s.small}>Think this is a mistake? You can appeal once. It takes about 2 minutes.</Text>
        ) : !loaded ? (
          <ActivityIndicator color={Colors.inkSecondary} />
        ) : !state ? (
          <Text style={s.small}>
            Think this is a mistake? Write to{' '}
            <Text style={s.link} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>{SUPPORT_EMAIL}</Text>
            {' '}from the number on this account.
          </Text>
        ) : null}
      </View>

      <View style={s.actions}>
        {state?.can_appeal ? <PrimaryButton label="Appeal this decision" onPress={() => { hTap(); setAppealing(true) }} /> : null}
        <Pressable style={s.logout} onPress={onLogOut} disabled={loggingOut} accessibilityRole="button">
          {loggingOut ? <ActivityIndicator color={Colors.inkSecondary} /> : <Text style={s.logoutText}>Log out</Text>}
        </Pressable>
      </View>
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
  full: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10001, backgroundColor: Colors.background },
  root: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 10001,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  body: { flex: 1, justifyContent: 'center', gap: 14 },
  icon: { width: 72, height: 72, borderRadius: 24, backgroundColor: withOpacity(Colors.inkPrimary, 0.08), alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  iconFinal: { backgroundColor: withOpacity(Colors.destructive, 0.12) },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 34, lineHeight: 38, letterSpacing: -1, color: Colors.inkPrimary },
  text: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 22, color: Colors.inkSecondary },
  small: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 19, color: Colors.inkSecondary },
  reason: { padding: 16, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, gap: 4 },
  reasonLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkDisabled },
  reasonText: { fontFamily: FontFamily.bodyMedium, fontSize: 15, lineHeight: 21, color: Colors.inkPrimary },
  link: { fontFamily: FontFamily.bodySemiBold, color: Colors.inkPrimary, textDecorationLine: 'underline' },
  actions: { gap: 6 },
  logout: { height: 50, alignItems: 'center', justifyContent: 'center' },
  logoutText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkSecondary },
})
