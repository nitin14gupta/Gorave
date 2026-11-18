import { Dimensions, View, Text, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import {
  Bell, HelpCircle, MessageSquare, Info, LogOut, Calendar, Ticket, Wallet,
  HeadphonesIcon, CalendarHeart, Landmark, Bookmark, ShieldCheck, UserCog,
} from 'lucide-react-native'
import { ConfirmSheet, BrandingFooter } from '@/components/ui'
import { ParallaxScreen, POSTER } from '@/components/ui/ParallaxScreen'
import { SettingsMenuSection } from '@/components/settings/SettingsMenuSection'
import { useProfile } from '@/hooks/useProfile'
import { useSettings } from '@/hooks/useSettings'
import { useGoBack } from '@/hooks/useGoBack'
import { useLogoutConfirm } from '@/hooks/useLogoutConfirm'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'

const W = Dimensions.get('window').width
const iconColor = Colors.inkSecondary

// Your stuff, one tap away: the four places people come to most.
const TILES = [
  { label: 'My events', Icon: Calendar, route: '/(settings)/my-events' },
  { label: 'Joined', Icon: Ticket, route: '/(settings)/joined-events' },
  { label: 'Hotlist', Icon: Bookmark, route: '/(settings)/hotlist' },
  { label: 'Wallet', Icon: Wallet, route: '/(settings)/wallet' },
] as const

export default function SettingsScreen() {
  const { appVersion } = useSettings()
  const goBack = useGoBack()
  const { profile } = useProfile()
  const { visible: logoutConfirm, show: showLogout, confirm: confirmLogout, dismiss: dismissLogout } = useLogoutConfirm()
  const avatar = profile?.photos?.[0]?.url

  return (
    <>
    <ParallaxScreen
      image={avatar ?? POSTER.houseParty}
      title={profile?.name ?? 'Settings'}
      subtitle={[profile?.username ? `@${profile.username}` : null, profile?.city].filter(Boolean).join(' · ') || undefined}
      eyebrow="SETTINGS"
      onBack={goBack}
      heroHeight={W}
      heroExtra={
        <Pressable style={styles.editPill} onPress={() => { hTap(); router.push('/(profile)/edit') }} hitSlop={6}>
          <Text style={styles.editPillText}>Edit profile</Text>
        </Pressable>
      }
    >
        <View style={styles.tiles}>
          {TILES.map(({ label, Icon, route }) => (
            <Pressable key={label} style={styles.tile} onPress={() => { hTap(); router.push(route as any) }}>
              <Icon size={22} color={Colors.inkPrimary} strokeWidth={1.6} />
              <Text style={styles.tileLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <SettingsMenuSection
          title="YOUR NIGHTS"
          items={[
            { icon: <CalendarHeart size={18} color={iconColor} strokeWidth={1.5} />, label: 'Calendar', onPress: () => router.push('/(settings)/calendar' as any) },
            { icon: <Bell size={18} color={iconColor} strokeWidth={1.5} />, label: 'Notifications', onPress: () => router.push('/(settings)/notifications') },
            { icon: <Landmark size={18} color={iconColor} strokeWidth={1.5} />, label: 'Payout details', onPress: () => router.push('/(settings)/payout-details' as any) },
          ]}
        />

        <SettingsMenuSection
          title="SAFETY AND ACCOUNT"
          items={[
            { icon: <ShieldCheck size={18} color={iconColor} strokeWidth={1.5} />, label: 'Gorave Safety', onPress: () => router.push('/(safety)' as any) },
            { icon: <UserCog size={18} color={iconColor} strokeWidth={1.5} />, label: 'Account', onPress: () => router.push('/(settings)/account' as any) },
          ]}
        />

        <SettingsMenuSection
          title="SUPPORT"
          items={[
            { icon: <HelpCircle size={18} color={iconColor} strokeWidth={1.5} />, label: 'Help & FAQ', onPress: () => router.push('/(settings)/help') },
            { icon: <HeadphonesIcon size={18} color={iconColor} strokeWidth={1.5} />, label: 'Contact support', onPress: () => router.push('/(settings)/support' as any) },
            { icon: <MessageSquare size={18} color={iconColor} strokeWidth={1.5} />, label: 'Send feedback', onPress: () => router.push('/(settings)/feedback') },
            { icon: <Info size={18} color={iconColor} strokeWidth={1.5} />, label: 'About Gorave', value: `v${appVersion}`, onPress: () => router.push('/(settings)/about') },
          ]}
        />

        <SettingsMenuSection
          style={styles.logoutWrap}
          items={[
            { icon: <LogOut size={18} color={iconColor} strokeWidth={1.5} />, label: 'Log out', onPress: showLogout },
          ]}
        />

        <BrandingFooter style={styles.footer} />
    </ParallaxScreen>

      <ConfirmSheet
        visible={logoutConfirm}
        title="Log out?"
        body="You'll need to verify your phone number to log back in."
        confirmLabel="Log Out"
        destructive
        onConfirm={confirmLogout}
        onClose={dismissLogout}
      />
    </>
  )
}

const styles = StyleSheet.create({
  editPill: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 14, height: 34, borderRadius: 17, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  editPillText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.white },

  tiles: { flexDirection: 'row', gap: 8, marginTop: 4 },
  tile: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 16, borderRadius: 18, backgroundColor: Colors.surface },
  tileLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkPrimary },

  logoutWrap: { marginTop: 12 },
  footer: { marginTop: 20 },
})
