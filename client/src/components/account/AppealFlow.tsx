import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useCameraPermissions } from 'expo-camera'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Camera, Check, RotateCcw } from 'lucide-react-native'
import { OtpView } from '@/components/auth/OtpView'
import { BioField } from '@/components/ui/BioField'
import { FaceCapture } from './FaceCapture'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import ApiService, { type AccountAppealState, type AppealReason } from '@/api/apiService'
import { useCountdown } from '@/hooks/useCountdown'
import { hSelection, hSuccess, hTap } from '@/lib/haptics'
import { usePillStore } from '@/store/pillStore'
import { Colors, FontFamily, Spacing, withOpacity } from '@/constants'

const REASONS: { key: AppealReason; title: string; sub: string }[] = [
  { key: 'not_me', title: 'I didn’t do this', sub: 'I think this was a mistake' },
  { key: 'someone_else', title: 'Someone else used my account', sub: 'It wasn’t me doing it' },
  { key: 'sorry', title: 'I understand, it won’t happen again', sub: 'I’d like another chance' },
]

type Step = 'code' | 'selfie' | 'story'
const ORDER: Step[] = ['code', 'selfie', 'story']

function Top({ step, onBack }: { step: Step; onBack: () => void }) {
  const insets = useSafeAreaInsets()
  const at = ORDER.indexOf(step)
  return (
    <View style={[s.top, { paddingTop: insets.top + 8 }]}>
      <Pressable style={s.back} onPress={() => { hTap(); onBack() }} hitSlop={8} accessibilityLabel="Back">
        <ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2.2} />
      </Pressable>
      <View style={s.segs}>{ORDER.map((_, i) => <View key={i} style={[s.seg, i <= at && s.segOn]} />)}</View>
      <Text style={s.count}>{at + 1}/3</Text>
    </View>
  )
}

/**
 * Appealing a locked account: a code to the number on the account, a live
 * selfie (compared with their profile photos by a person), then what happened.
 */
export function AppealFlow({ phoneHint, onDone, onCancel }: { phoneHint: string; onDone: (s: AccountAppealState) => void; onCancel: () => void }) {
  const insets = useSafeAreaInsets()
  const showPill = usePillStore(st => st.show)
  const [step, setStep] = useState<Step>('code')
  const [codePass, setCodePass] = useState<string | null>(null)

  // Step 1: the code.
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState(false)
  const [codeBusy, setCodeBusy] = useState(false)
  const { seconds, isExpired: canResend, reset } = useCountdown(45)
  const sendCode = async () => {
    try {
      await ApiService.sendAppealCode()
      reset()
    } catch (e: any) {
      showPill(e?.message || 'Couldn’t send the code. Try again.', 'error')
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { sendCode() }, [])
  const verify = async (c = code) => {
    if (c.length !== 6 || codeBusy) return
    setCodeBusy(true)
    try {
      const r = await ApiService.verifyAppealCode(c)
      hSuccess()
      setCodePass(r.pass)
      setStep('selfie')
    } catch {
      setCodeError(true)
      setCode('')
    } finally {
      setCodeBusy(false)
    }
  }

  // Step 2: the selfie.
  const [permission, requestPermission] = useCameraPermissions()
  const [shot, setShot] = useState<string | null>(null)
  const [selfieKey, setSelfieKey] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const useShot = async () => {
    if (!shot || !codePass || uploading) return
    hTap()
    setUploading(true)
    try {
      setSelfieKey(await ApiService.uploadAppealSelfie(shot, codePass))
      setStep('story')
    } catch (e: any) {
      showPill(e?.message || 'Couldn’t send that photo. Try again.', 'error')
      setShot(null)
    } finally {
      setUploading(false)
    }
  }

  // Step 3: what happened.
  const [reason, setReason] = useState<AppealReason | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const submit = async () => {
    if (!reason || message.trim().length < 10 || !codePass || !selfieKey || sending) return
    hTap()
    setSending(true)
    try {
      const st = await ApiService.submitAppeal({ code_pass: codePass, selfie_key: selfieKey, reason, message: message.trim() })
      hSuccess()
      onDone(st)
    } catch (e: any) {
      showPill(e?.message || 'Couldn’t send your appeal. Try again.', 'error')
      setSending(false)
    }
  }

  const back = () => {
    if (step === 'code') onCancel()
    else if (step === 'selfie') { setShot(null); onCancel() }
    else setStep('selfie')
  }

  if (step === 'code') {
    return (
      <OtpView
        title={'Confirm it’s\nyou'}
        phone={`••••••••${phoneHint}`}
        code={code}
        onCode={c => { setCode(c); setCodeError(false); if (c.length === 6) verify(c) }}
        error={codeError}
        errorMsg={codeError ? 'That code isn’t right' : ''}
        loading={codeBusy}
        seconds={seconds}
        canResend={canResend}
        tooMany={false}
        onResend={sendCode}
        onEditNumber={() => {}}
        onBack={onCancel}
        onVerify={() => verify()}
      />
    )
  }

  if (step === 'selfie') {
    return (
      <View style={s.root}>
        <Top step={step} onBack={back} />
        <View style={s.body}>
          <Text style={s.title}>Take a quick selfie</Text>
          <Text style={s.lede}>A person on our team checks it against your profile photos. It&apos;s only used for this appeal.</Text>
          <View style={s.frame}>
            {shot ? (
              <Image source={{ uri: shot }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : permission?.granted ? (
              <FaceCapture onCapture={setShot} />
            ) : (
              <View style={s.permission}>
                <Camera size={28} color={Colors.inkSecondary} strokeWidth={1.8} />
                <Text style={s.permissionText}>We need your camera for a live selfie. It can&apos;t be a photo from your gallery.</Text>
                <PrimaryButton label="Allow camera" size="small" onPress={() => { hTap(); requestPermission() }} />
              </View>
            )}
          </View>
          <Text style={s.hint}>{shot ? 'Can you see your face clearly?' : 'Good light, nothing covering your face. It takes the photo when the oval turns green.'}</Text>
        </View>
        <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
          {shot ? (
            <View style={s.row}>
              <Pressable style={s.ghost} onPress={() => { hTap(); setShot(null) }} disabled={uploading}>
                <RotateCcw size={16} color={Colors.inkPrimary} strokeWidth={2} />
                <Text style={s.ghostText}>Retake</Text>
              </Pressable>
              <View style={s.flex}><PrimaryButton label="Use this" onPress={useShot} loading={uploading} /></View>
            </View>
          ) : null}
        </View>
      </View>
    )
  }

  return (
    <View style={s.root}>
      <Top step={step} onBack={back} />
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>What happened?</Text>
        <Text style={s.lede}>Tell us your side. A real person reads every appeal.</Text>
        <View style={s.reasons}>
          {REASONS.map(r => {
            const on = reason === r.key
            return (
              <Pressable key={r.key} style={[s.reason, on && s.reasonOn]} onPress={() => { hSelection(); setReason(r.key) }} accessibilityRole="radio" accessibilityState={{ selected: on }}>
                <View style={s.reasonText}>
                  <Text style={s.reasonTitle}>{r.title}</Text>
                  <Text style={s.reasonSub}>{r.sub}</Text>
                </View>
                <View style={[s.radio, on && s.radioOn]}>{on ? <Check size={13} color={Colors.background} strokeWidth={3} /> : null}</View>
              </Pressable>
            )
          })}
        </View>
        <Text style={s.label}>IN YOUR WORDS</Text>
        <BioField value={message} onChangeText={setMessage} title="Your appeal" placeholder="What happened, and anything that helps us understand" min={10} max={2000} />
        <Text style={s.final}>You can appeal once. If it&apos;s turned down, the decision is final.</Text>
      </ScrollView>
      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton label="Send appeal" onPress={submit} loading={sending} disabled={!reason || message.trim().length < 10} />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.inkPrimary, 0.06) },
  segs: { flex: 1, flexDirection: 'row', gap: 5 },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: withOpacity(Colors.inkPrimary, 0.12) },
  segOn: { backgroundColor: Colors.inkPrimary },
  count: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkSecondary },
  body: { paddingHorizontal: Spacing.screenPadding, paddingTop: 16, paddingBottom: 24 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 32, lineHeight: 36, letterSpacing: -0.8, color: Colors.inkPrimary },
  lede: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkSecondary, marginTop: 8 },
  frame: { marginTop: 22, aspectRatio: 3 / 4, borderRadius: 28, overflow: 'hidden', backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  permission: { alignItems: 'center', gap: 12, paddingHorizontal: 28 },
  permissionText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkSecondary, textAlign: 'center' },
  hint: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary, marginTop: 12, textAlign: 'center' },
  footer: { paddingHorizontal: Spacing.screenPadding, paddingTop: 10, alignItems: 'center' },
  row: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  ghost: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 54, paddingHorizontal: 18, borderRadius: 27, backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  ghostText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  reasons: { marginTop: 22, gap: 10 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: 'transparent' },
  reasonOn: { borderColor: Colors.inkPrimary },
  reasonText: { flex: 1, gap: 2 },
  reasonTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  reasonSub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: withOpacity(Colors.inkPrimary, 0.3), alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  label: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkDisabled, marginTop: 26, marginBottom: 10 },
  final: { fontFamily: FontFamily.bodyRegular, fontSize: 12, lineHeight: 17, color: Colors.inkDisabled, marginTop: 14 },
})
