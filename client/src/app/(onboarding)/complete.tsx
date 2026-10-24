import { View } from 'react-native'
import { router } from 'expo-router'
import { useOnboardingStore } from '@/store/onboarding'
import { useAuthStore } from '@/store/auth'
import { useProfile } from '@/hooks/useProfile'
import { OnboardingComplete, type FirstMove } from '@/components/onboarding/OnboardingComplete'

const NEXT: Record<FirstMove, string> = {
  events: '/(tabs)/events',
  host: '/(events)/create',
  safety: '/(safety)/contacts-choose',
}

export default function CompleteScreen() {
  const store = useOnboardingStore()
  const setProfileComplete = useAuthStore(s => s.setProfileComplete)
  const { profile } = useProfile()
  const name = store.name || profile?.name || ''
  const city = store.city ?? profile?.city ?? null

  const finish = (next?: FirstMove) => {
    setProfileComplete(true)
    store.reset()
    router.replace('/(tabs)')
    // Land on the tabs first so Back from the first move goes home.
    if (next) setTimeout(() => router.push(NEXT[next] as any), 50)
  }

  return (
    <View style={{ flex: 1 }}>
      <OnboardingComplete name={name} photo={profile?.photos?.[0]?.url ?? null} city={city} onFinish={finish} />
    </View>
  )
}
