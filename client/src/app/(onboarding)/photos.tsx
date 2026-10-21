import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { OutlineButton, StepDots, PrimaryButton, Screen, GlowLinesBackground } from '@/components/ui'
import { PhotoGrid } from '@/components/profile/EditPhotosView'
import { MediaPreviewModal } from '@/components/chat/MediaPreviewModal'
import { usePhotos, MIN_PHOTOS } from '@/hooks/usePhotos'
import { Colors, FontFamily, Spacing } from '@/constants'

export default function PhotosScreen() {
  const {
    items,
    nextLoading,
    hasMinPhotos,
    onSlotPress,
    removePhoto,
    makeMain,
    handleNext,
    pendingMedia,
    confirmPendingPhotos,
    cancelPendingPhotos,
    removePendingPhoto,
    updatePendingPhoto,
  } = usePhotos()

  return (
    <View style={styles.rootWrap}>
      <GlowLinesBackground />
      <Screen transparent>
      <View style={styles.header}>
        <Text style={styles.title}>Add your photos</Text>
        <Text style={styles.subtitle}>Add at least {MIN_PHOTOS}. The first one is what people see first.</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        <PhotoGrid items={items} onSlot={onSlotPress} onRemove={removePhoto} onMakeMain={makeMain} />
      </ScrollView>

      <StepDots step={2} />

      <View style={styles.footer}>
        <OutlineButton label="Back" onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.nextBtn}>
          <PrimaryButton
            label="Next"
            onPress={handleNext}
            disabled={!hasMinPhotos}
            loading={nextLoading}
          />
        </View>
      </View>

      <MediaPreviewModal
        media={pendingMedia}
        onSend={confirmPendingPhotos}
        onCancel={cancelPendingPhotos}
        onRemove={removePendingPhoto}
        onUpdate={updatePendingPhoto}
        actionLabel="Add"
        titleLabel="Ready to add?"
      />
      </Screen>
    </View>
  )
}

const styles = StyleSheet.create({
  rootWrap: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 12 },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    letterSpacing: -0.24,
    color: Colors.inkPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
  },

  grid: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },

  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 16,
  },
  backBtn: { width: 96 },
  nextBtn: { flex: 1 },
})
