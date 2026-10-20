import CropPicker from 'react-native-image-crop-picker'
import { Colors, EVENT_IMAGE_ASPECT } from '@/constants'

// Every event photo goes through this 4:5 cropper (create and edit), so
// what the host frames is exactly what every card and the event page show.
const W = 1200
const H = Math.round(W / EVENT_IMAGE_ASPECT) // 1500

/** Opens the cropper locked to 4:5. Resolves to the cropped photo, or null if cancelled. */
export async function cropEventPhoto(uri: string): Promise<{ uri: string; width: number; height: number } | null> {
  try {
    const r = await CropPicker.openCropper({
      path: uri,
      mediaType: 'photo',
      width: W,
      height: H,
      cropping: true,
      freeStyleCropEnabled: false,
      cropperToolbarTitle: 'Frame your photo (4:5)',
      cropperToolbarColor: Colors.background,
      cropperStatusBarLight: false,
      cropperToolbarWidgetColor: Colors.inkPrimary,
      cropperActiveWidgetColor: Colors.background,
      cropperChooseColor: Colors.brandOrange,
      cropperCancelColor: Colors.inkPrimary,
      hideBottomControls: false,
      enableRotationGesture: true,
    } as any)
    return { uri: r.path, width: r.width, height: r.height }
  } catch {
    return null
  }
}
