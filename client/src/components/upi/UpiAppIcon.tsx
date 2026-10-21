import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Colors, FontFamily } from '@/constants'
import type { UpiApp } from '@/hooks/useInstalledUpiApps'

// Android reports icons as base64 PNG (or occasionally a uri/file path); iOS
// uses a require()'d bundled asset id (a number) instead — see UpiApp.app_icon.
function upiIconSource(app_icon: string | number) {
  if (typeof app_icon === 'number') return app_icon
  return {
    uri: (app_icon.startsWith('http') || app_icon.startsWith('file:') || app_icon.startsWith('/'))
      ? app_icon
      : `data:image/png;base64,${app_icon}`,
  }
}

/** A UPI app's own icon, or its initial if the icon can't be read. */
export function UpiAppIcon({ app, size }: { app: UpiApp; size: number }) {
  const [failed, setFailed] = useState(false)
  const box = { width: size, height: size, borderRadius: size * 0.26 }
  if (!app.app_icon || failed) {
    return (
      <View style={[box, s.fallback]}>
        <Text style={[s.initial, { fontSize: size * 0.4 }]}>{app.app_name.charAt(0)}</Text>
      </View>
    )
  }
  return <Image source={upiIconSource(app.app_icon)} style={box} contentFit="cover" cachePolicy="memory-disk" onError={() => setFailed(true)} />
}

const s = StyleSheet.create({
  fallback: { backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: FontFamily.bodySemiBold, color: Colors.inkSecondary },
})
