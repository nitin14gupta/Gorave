import { View, Text, StyleSheet, Pressable } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { router } from 'expo-router'
import { ChevronRight, Copy } from 'lucide-react-native'
import { BrandingFooter } from '@/components/ui'
import { ParallaxScreen, POSTER } from '@/components/ui/ParallaxScreen'
import { Colors, FontFamily, SUPPORT_EMAIL, APP_VERSION, APP_BUILD_NUMBER } from '@/constants'
import { usePillStore } from '@/store/pillStore'
import { hTap } from '@/lib/haptics'

export default function AboutScreen() {
  const showPill = usePillStore(s => s.show)

  return (
    <ParallaxScreen
      image={POSTER.confetti}
      eyebrow="ABOUT"
      title="GORAVE"
      subtitle="Every good night starts with an invite."
      onBack={() => router.back()}
    >
      <Text style={s.lead}>
        House parties, rooftops and game nights, hosted by people near you. Find one, request a spot, and meet the crowd before you go.
      </Text>

      <View style={s.card}>
        <Row label="Version" value={`${APP_VERSION} (${APP_BUILD_NUMBER})`} />
        <View style={s.divider} />
        <Row
          label="Contact"
          value={SUPPORT_EMAIL}
          icon="copy"
          onPress={async () => {
            hTap()
            await Clipboard.setStringAsync(SUPPORT_EMAIL)
            showPill('Email copied', 'default')
          }}
        />
      </View>

      <View style={s.card}>
        <Row label="Privacy policy" onPress={() => router.push('/(settings)/privacy')} />
        <View style={s.divider} />
        <Row label="Terms of use" onPress={() => router.push('/(settings)/terms')} />
      </View>

      <BrandingFooter style={{ marginTop: 16 }} />
    </ParallaxScreen>
  )
}

function Row({ label, value, onPress, icon = 'chevron' }: { label: string; value?: string; onPress?: () => void; icon?: 'chevron' | 'copy' }) {
  const inner = (
    <>
      <Text style={s.label}>{label}</Text>
      <View style={s.right}>
        {value ? <Text style={s.value}>{value}</Text> : null}
        {onPress ? (icon === 'copy' ? <Copy size={15} color={Colors.inkDisabled} strokeWidth={2} /> : <ChevronRight size={16} color={Colors.inkDisabled} strokeWidth={2} />) : null}
      </View>
    </>
  )
  return onPress ? <Pressable style={s.row} onPress={onPress}>{inner}</Pressable> : <View style={s.row}>{inner}</View>
}

const s = StyleSheet.create({
  lead: { fontFamily: FontFamily.headingBold, fontSize: 19, lineHeight: 26, letterSpacing: -0.2, color: Colors.inkPrimary, marginBottom: 12 },
  card: { backgroundColor: Colors.surface, borderRadius: 20, borderWidth: 1, borderColor: Colors.divider, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 52 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary },
  value: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider, marginLeft: 16 },
})
