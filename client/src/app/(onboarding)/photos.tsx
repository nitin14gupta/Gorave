import { View } from 'react-native'
import { router } from 'expo-router'
import { EditPhotosView } from '@/components/profile/EditPhotosView'
import { MediaPreviewModal } from '@/components/chat/MediaPreviewModal'
import { usePhotos, MIN_PHOTOS } from '@/hooks/usePhotos'
import { useOnboardingStore } from '@/store/onboarding'
import { Colors } from '@/constants'

const SLOTS = 6

// The same photo screen as Edit photos, with Next in place of Save.
export default function PhotosScreen() {
  const name = useOnboardingStore(s => s.name)
  const {
    items, nextLoading, hasMinPhotos, onSlotPress, removePhoto, makeMain, handleNext,
    pendingMedia, confirmPendingPhotos, cancelPendingPhotos, removePendingPhoto, updatePendingPhoto,
  } = usePhotos()

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <EditPhotosView
        items={items}
        count={items.filter(i => i.uri).length}
        min={MIN_PHOTOS}
        max={SLOTS}
        onSlot={onSlotPress}
        onRemove={removePhoto}
        onMakeMain={makeMain}
        canSave={hasMinPhotos}
        saving={nextLoading}
        onSave={handleNext}
        onBack={() => router.back()}
        name={name}
        city={null}
        barTitle="Add your photos"
        saveLabel="Next"
      />

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
