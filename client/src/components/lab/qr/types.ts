import type { RefObject } from 'react'
import type { View } from 'react-native'

export interface MyQrViewProps {
  /** The card that Save and Share capture. */
  cardRef: RefObject<View | null>
  shareUrl: string
  name: string
  handle: string
  avatar: string | null
  city: string | null
  onShare: () => void
  onSave: () => void
  onChat: () => void
  onClose: () => void
}
