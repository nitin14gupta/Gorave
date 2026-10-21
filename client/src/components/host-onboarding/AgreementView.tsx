import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Check, PenLine } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { AGREEMENT_CLAUSES } from '@/components/host-onboarding/agreementClauses'
import { hSelection, hTap } from '@/lib/haptics'

interface Props {
  signatureUri: string | null
  name: string
  onSign: () => void
}

/**
 * Host agreement, read and tick. Each clause is a card you tick once you've read it,
 * the way some banks walk you through terms. Sign unlocks when all five
 * are ticked, so nobody signs without reading.
 */
export function AgreementView({ signatureUri, name, onSign }: Props) {
  const [ticked, setTicked] = useState<boolean[]>(() => AGREEMENT_CLAUSES.map(() => !!signatureUri))
  const done = ticked.filter(Boolean).length
  const all = done === AGREEMENT_CLAUSES.length

  return (
    <View>
      <Text style={s.title}>Host agreement</Text>
      <Text style={s.lede}>Tick each one as you read it. {done} of {AGREEMENT_CLAUSES.length} read.</Text>
      <View style={s.track}><View style={[s.fill, { width: `${(done / AGREEMENT_CLAUSES.length) * 100}%` }]} /></View>

      <View style={{ gap: 10, marginTop: 18 }}>
        {AGREEMENT_CLAUSES.map((c, i) => {
          const on = ticked[i]
          return (
            <Pressable
              key={c.title}
              style={[s.card, on && s.cardOn]}
              onPress={() => { hSelection(); setTicked(t => t.map((v, j) => (j === i ? !v : v))) }}
            >
              <View style={[s.tick, on && s.tickOn]}>{on ? <Check size={13} color={Colors.background} strokeWidth={3.2} /> : null}</View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{c.title}</Text>
                <Text style={s.cardBody}>{c.body}</Text>
              </View>
            </Pressable>
          )
        })}
      </View>

      {signatureUri ? (
        <Pressable style={s.signed} onPress={() => { hTap(); onSign() }}>
          <Image source={{ uri: signatureUri }} style={s.sig} contentFit="contain" />
          <View style={s.signedFoot}>
            <Text style={s.signedName}>Signed by {name || 'you'}</Text>
            <Text style={s.again}>Sign again</Text>
          </View>
        </Pressable>
      ) : (
        <Pressable style={[s.signBtn, !all && { opacity: 0.35 }]} onPress={() => { if (all) { hTap(); onSign() } }} disabled={!all}>
          <PenLine size={18} color={Colors.background} strokeWidth={2} />
          <Text style={s.signText}>{all ? 'Sign the agreement' : 'Tick all five to sign'}</Text>
        </Pressable>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 30, letterSpacing: -0.7, color: Colors.inkPrimary },
  lede: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, marginTop: 6 },
  track: { height: 4, borderRadius: 2, backgroundColor: withOpacity(Colors.inkPrimary, 0.1), overflow: 'hidden', marginTop: 12 },
  fill: { height: '100%', borderRadius: 2, backgroundColor: Colors.inkPrimary },

  card: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  cardOn: { borderColor: withOpacity(Colors.inkPrimary, 0.45) },
  tick: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: withOpacity(Colors.inkPrimary, 0.35), alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  tickOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  cardTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  cardBody: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 19, color: Colors.inkSecondary, marginTop: 3 },

  signBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: 999, backgroundColor: Colors.inkPrimary, marginTop: 22 },
  signText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.background },
  signed: { marginTop: 22, borderRadius: 18, borderWidth: 1, borderColor: Colors.divider, backgroundColor: Colors.surface, overflow: 'hidden' },
  sig: { width: '100%', height: 120 },
  signedFoot: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  signedName: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
  again: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkSecondary },
})
