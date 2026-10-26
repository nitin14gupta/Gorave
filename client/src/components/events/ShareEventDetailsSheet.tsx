import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import RNShare from 'react-native-share'
import { Calendar, MapPin, Send, User } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { hTap } from '@/lib/haptics'
import { usePillStore } from '@/store/pillStore'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { Colors, FontFamily, withOpacity } from '@/constants'

interface Props {
  visible: boolean
  onClose: () => void
  title: string
  dateTimeLabel: string
  locationName?: string | null
  hostName?: string | null
  shareUrl: string
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.6} />
}

function ShareEventDetailsSheetCore({ onClose, title, dateTimeLabel, locationName, hostName, shareUrl }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const showPill = usePillStore(s => s.show)
  const insets = useSafeAreaInsets()

  useEffect(() => { sheetRef.current?.present() }, [])

  const handleShare = async () => {
    hTap()
    const lines = [
      `You're attending: ${title}`,
      `📅 ${dateTimeLabel}`,
      locationName ? `📍 ${locationName}` : null,
      hostName ? `👤 Hosted by ${hostName}` : null,
      '',
      shareUrl,
    ].filter((l): l is string => l != null)

    try {
      await RNShare.open({ message: lines.join('\n'), failOnCancel: false })
    } catch (e: any) {
      const cancelled = typeof e?.message === 'string' && e.message.toLowerCase().includes('cancel')
      if (!cancelled) showPill("Couldn't open share sheet, try again", 'error')
    }
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handleIndicator}
    >
      <BottomSheetView style={[s.content, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={s.title}>Tell someone{'\n'}where you&apos;ll be</Text>
        <Text style={s.subtitle}>Send a friend or family member the details of tonight. This is what they get:</Text>

        {/* Shown as the message they will receive */}
        <View style={s.bubble}>
          <Text style={s.previewLabel}>You&apos;re attending</Text>
          <Text style={s.previewTitle} numberOfLines={2}>{title}</Text>
          <View style={s.previewRow}>
            <Calendar size={14} color={Colors.inkSecondary} strokeWidth={2} />
            <Text style={s.previewText} numberOfLines={1}>{dateTimeLabel}</Text>
          </View>
          {locationName ? (
            <View style={s.previewRow}>
              <MapPin size={14} color={Colors.inkSecondary} strokeWidth={2} />
              <Text style={s.previewText} numberOfLines={2}>{locationName}</Text>
            </View>
          ) : null}
          {hostName ? (
            <View style={s.previewRow}>
              <User size={14} color={Colors.inkSecondary} strokeWidth={2} />
              <Text style={s.previewText} numberOfLines={1}>Hosted by {hostName}</Text>
            </View>
          ) : null}
          <Text style={s.link} numberOfLines={1}>{shareUrl}</Text>
        </View>

        <PrimaryButton label="Send the details" onPress={handleShare} style={s.shareBtn} icon={<Send size={17} color={Colors.background} strokeWidth={2.2} />} />
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function ShareEventDetailsSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <ShareEventDetailsSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.surface, borderRadius: 28 },
  handleIndicator: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 8 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 26, lineHeight: 29, letterSpacing: -0.6, color: Colors.inkPrimary },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, lineHeight: 20, marginBottom: 6 },
  bubble: {
    backgroundColor: withOpacity(Colors.inkPrimary, 0.06),
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    padding: 16,
    gap: 8,
    marginTop: 4,
  },
  previewLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.2, color: Colors.inkDisabled, textTransform: 'uppercase' },
  previewTitle: { fontFamily: FontFamily.displayExtraBold, fontSize: 20, letterSpacing: -0.3, color: Colors.inkPrimary, marginBottom: 2 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewText: { fontFamily: FontFamily.bodyRegular, fontSize: 13.5, color: Colors.inkPrimary, flexShrink: 1 },
  link: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary, textDecorationLine: 'underline', marginTop: 4 },
  shareBtn: { marginTop: 14 },
})
