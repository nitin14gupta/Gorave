import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import Animated, { FadeIn } from 'react-native-reanimated'
import { Ban, ChevronDown, Flag, PartyPopper, PenLine, Scale, ShieldCheck } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { AGREEMENT_CLAUSES } from '@/components/host-onboarding/agreementClauses'
import { hTap } from '@/lib/haptics'

interface Props {
  signatureUri: string | null
  name: string
  onSign: () => void
}

const ICONS = { shield: ShieldCheck, ban: Ban, flag: Flag, scale: Scale, party: PartyPopper } as const

/** The full wording, folded away. It's what's actually signed. */
function FinePrint() {
  const [open, setOpen] = useState(false)
  return (
    <View style={s.fine}>
      <Pressable style={s.fineToggle} onPress={() => { hTap(); setOpen(o => !o) }} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <Text style={s.fineToggleText}>Read the full agreement</Text>
        <ChevronDown size={16} color={Colors.inkSecondary} strokeWidth={2} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
      </Pressable>
      {open ? (
        <Animated.View entering={FadeIn.duration(200)} style={s.fineBody}>
          {AGREEMENT_CLAUSES.map((c, i) => (
            <Text key={c.title} style={s.fineText}><Text style={s.fineTitle}>{i + 1}. {c.title}. </Text>{c.body}</Text>
          ))}
        </Animated.View>
      ) : null}
    </View>
  )
}

/** Sign with a finger. Light, not a legal form. */
function Sign({ signatureUri, name, onSign }: Props) {
  return (
    <Pressable style={s.sign} onPress={() => { hTap(); onSign() }} accessibilityRole="button" accessibilityLabel={signatureUri ? 'Sign again' : 'Sign to agree'}>
      {signatureUri ? (
        <>
          <Image source={{ uri: signatureUri }} style={s.sig} contentFit="contain" />
          <View style={s.signFoot}>
            <Text style={s.signName} numberOfLines={1}>Signed by {name || 'you'}</Text>
            <Text style={s.again}>Redo</Text>
          </View>
        </>
      ) : (
        <View style={s.signEmpty}>
          <PenLine size={20} color={Colors.inkPrimary} strokeWidth={2} />
          <Text style={s.signTitle}>Sign to agree</Text>
          <Text style={s.signSub}>Just your finger, takes a second</Text>
        </View>
      )}
    </Pressable>
  )
}

// ── A: house rules, one line each ───────────────────────────────────────────

export function AgreementView(p: Props) {
  return (
    <View>
      <Text style={s.title}>A few house{'\n'}rules</Text>
      <Text style={s.lede}>The basics every host on Gorave agrees to.</Text>

      <View style={s.rules}>
        {AGREEMENT_CLAUSES.map(c => {
          const Icon = ICONS[c.icon]
          return (
            <View key={c.short} style={s.rule}>
              <View style={s.ruleIcon}><Icon size={18} color={Colors.inkPrimary} strokeWidth={2} /></View>
              <View style={s.ruleText}>
                <Text style={s.ruleTitle}>{c.short}</Text>
                <Text style={s.ruleLine}>{c.line}</Text>
              </View>
            </View>
          )
        })}
      </View>

      <FinePrint />
      <Sign {...p} />
    </View>
  )
}

// ── B: swipe through, then sign ─────────────────────────────────────────────

const s = StyleSheet.create({
  // Same type as the wizard's other steps.
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 36, lineHeight: 39, letterSpacing: -1, color: Colors.inkPrimary, marginTop: 8 },
  lede: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkSecondary, marginTop: 10 },

  // A
  rules: { marginTop: 24, gap: 18 },
  rule: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  ruleIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: withOpacity(Colors.inkPrimary, 0.07), alignItems: 'center', justifyContent: 'center' },
  ruleText: { flex: 1, gap: 2 },
  ruleTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.inkPrimary },
  ruleLine: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 19, color: Colors.inkSecondary },

  // B

  // Shared
  fine: { marginTop: 20 },
  fineToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  fineToggleText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkSecondary },
  fineBody: { gap: 10, marginTop: 8 },
  fineText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 19, color: Colors.inkSecondary },
  fineTitle: { fontFamily: FontFamily.bodySemiBold, color: Colors.inkPrimary },

  sign: { marginTop: 18, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: withOpacity(Colors.inkPrimary, 0.25), overflow: 'hidden' },
  signEmpty: { alignItems: 'center', gap: 4, paddingVertical: 22 },
  signTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary, marginTop: 6 },
  signSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  sig: { width: '100%', height: 96 },
  signFoot: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 12 },
  signName: { flex: 1, fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
  again: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
})
