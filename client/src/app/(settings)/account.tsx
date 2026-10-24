import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Phone, UserX, FileText, Lock } from 'lucide-react-native'
import { AppHeader, APP_HEADER_BAR_HEIGHT, HeaderIconBtn } from '@/components/ui'
import { SettingsMenuSection } from '@/components/settings/SettingsMenuSection'
import { useAuthStore } from '@/store/auth'
import { useHeaderScroll } from '@/hooks/useHeaderScroll'
import { Colors, FontFamily, Spacing } from '@/constants'

const iconColor = Colors.inkSecondary

/**
 * Your account: the number you sign in with, who you have blocked, the legal
 * pages. Deleting the account lives at the very bottom as plain text, a few
 * taps in, the way other apps keep it.
 */
export default function AccountScreen() {
  const insets = useSafeAreaInsets()
  const { hideProgress, onScroll } = useHeaderScroll()
  const headerHeight = APP_HEADER_BAR_HEIGHT + insets.top
  const phone = useAuthStore(s => s.phone ?? '')
  const masked = phone ? `+91 ${'*'.repeat(6)}${phone.replace(/\D/g, '').slice(-4)}` : ''

  return (
    <View style={s.root}>
      <AppHeader
        title="Account"
        hideProgress={hideProgress}
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[s.content, { paddingTop: headerHeight + 8, paddingBottom: insets.bottom + 40 }]}
      >
        <SettingsMenuSection
          title="SIGN-IN"
          items={[
            { icon: <Phone size={18} color={iconColor} strokeWidth={1.5} />, label: 'Phone number', value: masked, onPress: () => {} },
          ]}
        />
        <SettingsMenuSection
          title="PEOPLE AND PRIVACY"
          items={[
            { icon: <UserX size={18} color={iconColor} strokeWidth={1.5} />, label: 'Blocked people', onPress: () => router.push('/(settings)/blocked') },
            { icon: <FileText size={18} color={iconColor} strokeWidth={1.5} />, label: 'Terms of service', onPress: () => router.push('/(settings)/terms' as any) },
            { icon: <Lock size={18} color={iconColor} strokeWidth={1.5} />, label: 'Privacy policy', onPress: () => router.push('/(settings)/privacy' as any) },
          ]}
        />

        <Pressable style={s.delete} onPress={() => router.push('/(settings)/delete-account' as any)} hitSlop={8}>
          <Text style={s.deleteText}>Delete account</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, gap: 8 },
  delete: { alignSelf: 'center', marginTop: 56, paddingVertical: 12, paddingHorizontal: 16 },
  deleteText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkDisabled },
})
