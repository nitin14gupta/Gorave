import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontFamily, SUPPORT_EMAIL } from '@/constants'
import { useLockStore } from '@/store/lockStore'
import { useAuth } from '@/hooks/useAuth'
import { hTap } from '@/lib/haptics'
import ApiService, { type AccountAppealState } from '@/api/apiService'
import { AppealFlow } from '@/components/account/AppealFlow'
import { LockIllustration } from '@/components/account/LockIllustration'
import { PrimaryButton } from './PrimaryButton'

const longDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

/** A heading and a few short paragraphs, like a help page. */
function Next({ title, lines }: { title: string; lines: string[] }) {
  return (
    <View style={s.next}>
      <Text style={s.nextTitle}>{title}</Text>
      {lines.map(l => <Text key={l} style={s.nextLine}>{l}</Text>)}
    </View>
  )
}

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
  const [checking, setChecking] = useState(false)
  const [appealing, setAppealing] = useState(false)

  const load = useCallback(async () => {
    try {
      const st = await ApiService.getAppeal()
      setState(st)
      // Unlocked since (an admin approved the appeal): straight back in.
      if (!st.locked) useLockStore.getState().reset()
    } catch {
      setState(null)
    } finally {
      setLoaded(true)
    }
  }, [])
  useEffect(() => { Promise.resolve().then(load) }, [load])

  const checkAgain = async () => {
    hTap()
    setChecking(true)
    await load()
    setChecking(false)
  }

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
  const shownReason = final && appeal?.note ? appeal.note : (state?.reason ?? reason)

  let body
  if (final) {
    body = (
      <>
        <LockIllustration kind="final" />
        <Text style={s.title}>Your account stays locked</Text>
        <Text style={s.sub}>We took another look after your appeal, and the lock stays.</Text>
        {shownReason ? <View style={s.reason}><Text style={s.reasonLabel}>WHY</Text><Text style={s.reasonText}>{shownReason}</Text></View> : null}
        <Next title="What this means" lines={[
          'This decision is final, and you can’t appeal again.',
          'You can’t use Gorave on this account any more.',
        ]} />
      </>
    )
  } else if (review) {
    body = (
      <>
        <LockIllustration kind="review" />
        <Text style={s.title}>You appealed on {appeal ? longDate(appeal.submitted_at) : 'today'}</Text>
        <Text style={s.sub}>It usually takes us about a day to look at it. Check again here.</Text>
        <Text style={s.small}>Until then, you can&apos;t use Gorave.</Text>
        <Next title="What happens next?" lines={[
          'A person on our team looks at your selfie, your profile and what you told us.',
          'If it checks out, your account comes back, and we’ll text you and send a notification.',
          'If not, your account stays locked for good, and you won’t be able to appeal again.',
        ]} />
      </>
    )
  } else {
    body = (
      <>
        <LockIllustration kind="locked" />
        <Text style={s.title}>Your account is locked</Text>
        <Text style={s.sub}>The Gorave team has paused this account, so you can&apos;t use the app for now.</Text>
        {shownReason ? <View style={s.reason}><Text style={s.reasonLabel}>REASON</Text><Text style={s.reasonText}>{shownReason}</Text></View> : null}
        {state?.can_appeal ? (
          <Next title="Think this is a mistake?" lines={[
            'You can appeal once. Confirm your number, take a quick selfie and tell us what happened. It takes about 2 minutes.',
            'A person on our team reviews every appeal, usually within a day.',
          ]} />
        ) : loaded && !state ? (
          <Text style={[s.small, s.left]}>
            Think this is a mistake? Write to{' '}
            <Text style={s.link} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>{SUPPORT_EMAIL}</Text>
            {' '}from the number on this account.
          </Text>
        ) : null}
      </>
    )
  }

  return (
    <View style={[s.full, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      {!loaded ? (
        <View style={s.loading}><ActivityIndicator color={Colors.inkSecondary} /></View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>{body}</ScrollView>
      )}
      <View style={s.actions}>
        {state?.can_appeal ? <PrimaryButton label="Appeal this decision" onPress={() => { hTap(); setAppealing(true) }} /> : null}
        {review ? <PrimaryButton label="Check again" onPress={checkAgain} loading={checking} /> : null}
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
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, alignItems: 'center' },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 28, lineHeight: 33, letterSpacing: -0.6, color: Colors.inkPrimary, textAlign: 'center', marginTop: 22 },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkSecondary, textAlign: 'center', marginTop: 10 },
  small: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 18, color: Colors.inkSecondary, textAlign: 'center', marginTop: 8 },
  left: { textAlign: 'left', alignSelf: 'stretch', marginTop: 24 },
  reason: { alignSelf: 'stretch', marginTop: 22, padding: 16, borderRadius: 18, backgroundColor: Colors.surface, gap: 4 },
  reasonLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkDisabled },
  reasonText: { fontFamily: FontFamily.bodyMedium, fontSize: 15, lineHeight: 21, color: Colors.inkPrimary },
  next: { alignSelf: 'stretch', marginTop: 32, gap: 14 },
  nextTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 17, color: Colors.inkPrimary },
  nextLine: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 22, color: Colors.inkSecondary },
  link: { fontFamily: FontFamily.bodySemiBold, color: Colors.inkPrimary, textDecorationLine: 'underline' },
  actions: { paddingHorizontal: 24, paddingTop: 8, gap: 4 },
  logout: { height: 50, alignItems: 'center', justifyContent: 'center' },
  logoutText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkSecondary },
})
