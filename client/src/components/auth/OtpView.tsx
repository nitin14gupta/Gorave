import { useEffect } from 'react'
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Pencil } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { PrimaryButton } from '@/components/ui'
import { hTap } from '@/lib/haptics'
import { groupPhone, type OtpViewProps } from './authTypes'

const LEN = 6

/**
 * The one-time code, in six big boxes. The code fills six large squares in display digits,
 * the box you're on outlined. A wrong code shakes once and clears. It
 * fills itself from the SMS where the phone allows.
 */
export function OtpView(p: OtpViewProps) {
  const insets = useSafeAreaInsets()
  const shake = useSharedValue(0)
  useEffect(() => {
    if (p.error) shake.value = withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 50 }), withTiming(-5, { duration: 50 }), withTiming(0, { duration: 50 }))
  }, [p.error, shake])
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }))

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.bar}>
        <Pressable style={s.iconBtn} onPress={p.onBack} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.body}>
          <Text style={s.title}>{p.title ?? "Enter the\ncode"}</Text>
          <Pressable style={s.sent} onPress={p.onEditNumber} hitSlop={6}>
            <Text style={s.sentText}>Sent to +91 {groupPhone(p.phone)}</Text>
            <Pencil size={13} color={Colors.inkSecondary} strokeWidth={2} />
          </Pressable>

          {/* The real field lies invisibly over the boxes, so a tap always lands
              on it and the keyboard reopens, even after it was dismissed. */}
          <View>
            <Animated.View style={[s.boxes, shakeStyle]}>
              {Array.from({ length: LEN }).map((_, i) => {
                const ch = p.code[i]
                const active = i === Math.min(p.code.length, LEN - 1) && !p.loading
                return (
                  <View key={i} style={[s.box, ch && s.boxFilled, active && s.boxActive, p.error && s.boxError]}>
                    <Text style={s.digit}>{ch ?? ''}</Text>
                  </View>
                )
              })}
            </Animated.View>
            <TextInput
              value={p.code}
              onChangeText={t => p.onCode(t.replace(/\D/g, '').slice(0, LEN))}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
              maxLength={LEN}
              autoFocus
              caretHidden
              contextMenuHidden
              selectionColor="transparent"
              style={s.overlay}
            />
          </View>

          {p.errorMsg ? <Text style={s.error}>{p.errorMsg}</Text> : null}
          {p.loading ? <View style={s.checking}><ActivityIndicator size="small" color={Colors.inkSecondary} /><Text style={s.checkingText}>Checking…</Text></View> : null}

          <View style={s.resend}>
            {p.canResend ? (
              <Pressable onPress={() => { hTap(); p.onResend() }} hitSlop={6}><Text style={s.resendBtn}>Send a new code</Text></Pressable>
            ) : (
              <Text style={s.timer}>New code in <Text style={s.timerNum}>0:{String(p.seconds).padStart(2, '0')}</Text></Text>
            )}
          </View>
        </View>

        <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
          <PrimaryButton label="Continue" onPress={p.onVerify} disabled={p.code.length !== LEN || p.tooMany} loading={p.loading} />
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bar: { paddingHorizontal: 12, paddingVertical: 6 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 40, lineHeight: 42, letterSpacing: -1.1, color: Colors.inkPrimary },
  sent: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 36 },
  sentText: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkSecondary },

  boxes: { flexDirection: 'row', gap: 8 },
  box: { flex: 1, aspectRatio: 0.82, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.divider, alignItems: 'center', justifyContent: 'center' },
  boxFilled: { borderColor: withOpacity(Colors.inkPrimary, 0.3) },
  boxActive: { borderColor: Colors.inkPrimary },
  boxError: { borderColor: Colors.destructive },
  digit: { fontFamily: FontFamily.displayExtraBold, fontSize: 30, color: Colors.inkPrimary },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, color: 'transparent', fontSize: 30, opacity: 0.02 },

  error: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.destructive, marginTop: 14 },
  checking: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  checkingText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
  resend: { marginTop: 28 },
  timer: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary },
  timerNum: { fontFamily: FontFamily.bodySemiBold, color: Colors.inkPrimary },
  resendBtn: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary, textDecorationLine: 'underline' },

  footer: { paddingHorizontal: 20 },
})
