import { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { hTap } from '@/lib/haptics'
import { PrimaryButton, OutlineButton } from '@/components/ui'
import { POSTER } from '@/components/ui/ParallaxScreen'
import { OnboardingShell } from '@/components/onboarding/OnboardingShell'
import { Colors, FontFamily } from '@/constants'

export default function AgeGateScreen() {
  const [declined, setDeclined] = useState(false)

  return (
    <View style={{ flex: 1 }}>
      {declined ? (
        <OnboardingShell
          step={0}
          poster={POSTER.afterDark}
          title={'Come back\nwhen you’re 18'}
          sub="Gorave is for adults only. We'll see you on the other side."
          footer={
            <Pressable style={s.goBack} onPress={() => { hTap(); setDeclined(false) }} hitSlop={8}>
              <Text style={s.goBackText}>Go back</Text>
            </Pressable>
          }
        />
      ) : (
        <OnboardingShell
          step={0}
          poster={POSTER.sequins}
          title={'First things\nfirst'}
          sub="Gorave is for people 18 and over. Are you 18 or older?"
          footer={
            <View style={{ gap: 10 }}>
              <PrimaryButton label="Yes, I'm 18+" onPress={() => router.replace('/(onboarding)/profile')} />
              <OutlineButton label="No, I'm not" onPress={() => setDeclined(true)} />
            </View>
          }
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  goBack: { alignItems: 'center', paddingVertical: 14 },
  goBackText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
})
