import { Image, type ImageStyle, type StyleProp } from 'react-native'
import { BRAND_ASPECT, Lockup, Sticker, Wordmark as WordmarkCream, WordmarkBlack } from '@/constants'

type Kind = 'wordmark' | 'wordmark-black' | 'sticker' | 'lockup'

const SOURCE = { 'wordmark': WordmarkCream, 'wordmark-black': WordmarkBlack, 'sticker': Sticker, 'lockup': Lockup }
const ASPECT = { 'wordmark': BRAND_ASPECT.wordmark, 'wordmark-black': BRAND_ASPECT.wordmark, 'sticker': BRAND_ASPECT.sticker, 'lockup': BRAND_ASPECT.lockup }

/** "gorave" in the brand's own lettering, sized by height. */
export function Wordmark({ kind = 'wordmark', height = 22, opacity = 1, style }: {
  kind?: Kind
  height?: number
  opacity?: number
  style?: StyleProp<ImageStyle>
}) {
  return (
    <Image
      source={SOURCE[kind]}
      style={[{ height, width: Math.round(height * ASPECT[kind]), opacity }, style]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Gorave"
    />
  )
}
