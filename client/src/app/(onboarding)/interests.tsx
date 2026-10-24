import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { InterestChip } from '@/components/ui'
import { OnboardingShell, OnboardingNext } from '@/components/onboarding/OnboardingShell'
import { POSTER } from '@/components/ui/ParallaxScreen'
import { useInterests } from '@/hooks/useInterests'
import { Colors, FontFamily } from '@/constants'

export default function InterestsScreen() {
  const { availableInterests, loadingList, selected, atMax, canProceed, remaining, loading, toggle, handleNext } = useInterests()

  return (
    <View style={{ flex: 1 }}>
      <OnboardingShell
        step={4}
        poster={POSTER.danceFloor}
        title={"What's your\nscene?"}
        sub={
          <>
            Pick 3 or 4. They show on your profile.
            {selected.length > 0 ? <Text style={s.count}>  {selected.length} of 4</Text> : null}
          </>
        }
        onBack={() => router.back()}
        footer={
          <OnboardingNext
            onPress={handleNext}
            disabled={!canProceed}
            loading={loading}
            hint={atMax ? 'That is 4. Tap one to swap it.' : !canProceed ? `Pick ${remaining} more` : undefined}
          />
        }
      >
        {loadingList ? (
          <ActivityIndicator color={Colors.inkSecondary} style={{ marginTop: 40 }} />
        ) : (
          <View style={s.chips}>
            {availableInterests.map(({ name, emoji }) => (
              <InterestChip bordered key={name} label={name} emoji={emoji} selected={selected.includes(name)} onPress={() => toggle(name)} />
            ))}
          </View>
        )}
      </OnboardingShell>
    </View>
  )
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 4 },
  count: { fontFamily: FontFamily.bodySemiBold, color: Colors.inkPrimary },
})
