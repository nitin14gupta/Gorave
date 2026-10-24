import { useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft } from 'lucide-react-native'
import { AppHeader, APP_HEADER_BAR_HEIGHT, HeaderIconBtn } from '@/components/ui'
import { SafetyView } from '@/components/safety/SafetyView'
import { useActiveEvent } from '@/components/safety/useActiveEvent'
import { useHeaderScroll } from '@/hooks/useHeaderScroll'
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts'
import { Colors, Spacing } from '@/constants'

export default function SafetyHubScreen() {
  const { hideProgress, onScroll } = useHeaderScroll()
  const insets = useSafeAreaInsets()
  const headerHeight = APP_HEADER_BAR_HEIGHT + insets.top
  const { contacts, load } = useEmergencyContacts()

  useFocusEffect(useCallback(() => { load() }, [load]))

  const activeEvent = useActiveEvent()

  return (
    <View style={s.root}>
      <AppHeader
        title="Gorave Safety"
        hideProgress={hideProgress}
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[s.content, { paddingTop: headerHeight + 8 }]}
      >
        <SafetyView
          contacts={contacts}
          activeEvent={activeEvent}
          onContacts={() => router.push('/(safety)/contacts' as any)}
          onAddContact={() => router.push('/(safety)/contacts-choose' as any)}
          onHelp={() => router.push('/(settings)/help' as any)}
        />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 40 },
})
