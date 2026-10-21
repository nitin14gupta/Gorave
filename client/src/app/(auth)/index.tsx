import { useEffect } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Colors } from '@/constants'
import { prefetchTemplateImages } from '@/lib/templateImages'
import { WelcomeView } from '@/components/auth/WelcomeView'

export default function WelcomeScreen() {
  useEffect(() => { prefetchTemplateImages() }, [])

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar style="light" />
      <WelcomeView onStart={() => router.push('/(auth)/phone')} onSignIn={() => router.push('/(auth)/phone')} />
    </View>
  )
}
