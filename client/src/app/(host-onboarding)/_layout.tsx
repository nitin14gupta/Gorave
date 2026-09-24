import { Platform, Pressable } from 'react-native'
import { router, Stack } from 'expo-router'
import { X } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'

export default function HostOnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="agreement" />
      <Stack.Screen
        name="signature-sheet"
        options={{
          headerShown: true,
          title: 'Add Signature',
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.inkPrimary,
          headerTitleStyle: { fontFamily: FontFamily.headingBold, fontSize: 18 },
          presentation: 'formSheet',
          sheetAllowedDetents: [0.5],
          contentStyle: {
            ...(Platform.OS === 'ios' && { backgroundColor: 'transparent' }),
          },
          headerRight: () => (
            <Pressable
              onPress={router.back}
              hitSlop={8}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={22} color={Colors.inkSecondary} strokeWidth={2} />
            </Pressable>
          ),
        }}
      />
    </Stack>
  )
}
