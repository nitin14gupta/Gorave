import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { AppHeader, HeaderIconBtn, Screen } from '@/components/ui'
import { ArrowLeft } from 'lucide-react-native'
import { MediaPreviewModal } from '@/components/chat/MediaPreviewModal'
import { useEditPhotos, MIN_PHOTOS, PHOTO_SLOTS } from '@/hooks/useEditPhotos'
import { useProfile } from '@/hooks/useProfile'
import { Colors } from '@/constants'
import { LabSwitch } from '@/components/lab/LabSwitch'
import { useLabVariant } from '@/store/labStore'
import { PhotosA } from '@/components/lab/photos/PhotosA'
import { PhotosB } from '@/components/lab/photos/PhotosB'

export default function EditPhotosScreen() {
  const Layout = useLabVariant('photos') === 'b' ? PhotosB : PhotosA
  const { profile } = useProfile()
  const {
    loading,
    saving,
    items,
    canSave,
    onSlotPress,
    removePhoto,
    makeMain,
    validPhotoCount,
    handleSave,
    pendingMedia,
    confirmPendingPhotos,
    cancelPendingPhotos,
    removePendingPhoto,
    updatePendingPhoto,
  } = useEditPhotos()

  if (loading) {
    return (
      <Screen top={false}>
        <AppHeader title="Edit Photos" leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>} />
        <View style={styles.center}><ActivityIndicator color={Colors.inkSecondary} /></View>
      </Screen>
    )
  }

  return (
    <View style={styles.root}>
      <Layout
        items={items}
        count={validPhotoCount}
        min={MIN_PHOTOS}
        max={PHOTO_SLOTS}
        onSlot={onSlotPress}
        onRemove={removePhoto}
        onMakeMain={makeMain}
        canSave={canSave}
        saving={saving}
        onSave={handleSave}
        onBack={() => router.back()}
        name={profile?.name ?? ''}
        city={profile?.city ?? null}
      />
      <LabSwitch screen="photos" />

      <MediaPreviewModal
        media={pendingMedia}
        onSend={confirmPendingPhotos}
        onCancel={cancelPendingPhotos}
        onRemove={removePendingPhoto}
        onUpdate={updatePendingPhoto}
        actionLabel="Add"
        titleLabel="Ready to add?"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
