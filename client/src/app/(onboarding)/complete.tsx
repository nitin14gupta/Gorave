import { View } from 'react-native'
import { router } from 'expo-router'
import { useOnboardingStore } from '@/store/onboarding'
import { useAuthStore } from '@/store/auth'
import { useProfile } from '@/hooks/useProfile'
import { OnboardingComplete } from '@/components/onboarding/OnboardingComplete'

export default function CompleteScreen() {
  const store = useOnboardingStore()
  const setProfileComplete = useAuthStore(s => s.setProfileComplete)
  const { profile } = useProfile()

  const navigate = () => {
    setProfileComplete(true)
    store.reset()
    router.replace('/(tabs)')
  }

  return (
    <View style={{ flex: 1 }}>
      <OnboardingComplete
        name={store.name || profile?.name || ''}
        photo={profile?.photos?.[0]?.url ?? null}
        city={store.city ?? profile?.city ?? null}
        onExplore={navigate}
      />
    </View>
  )
}
