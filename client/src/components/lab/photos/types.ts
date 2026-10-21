import type { PhotoItem } from '@/hooks/useEditPhotos'

export interface PhotosViewProps {
  items: PhotoItem[]
  count: number
  min: number
  max: number
  onSlot: (id: string) => void
  onRemove: (id: string) => void
  onMakeMain: (id: string) => void
  canSave: boolean
  saving: boolean
  onSave: () => void
  onBack: () => void
  name: string
  city: string | null
}
