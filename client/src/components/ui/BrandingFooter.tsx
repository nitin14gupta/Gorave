import { View, Text, StyleSheet, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native'
import { Heart } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { Wordmark } from './Wordmark'
import { LogoMark } from './LogoMark'

interface Props {
  style?: StyleProp<ViewStyle>
  bannerStyle?: StyleProp<ImageStyle>
}

// The sign-off at the bottom of Settings and About: the seal and the wordmark, quiet.
export function BrandingFooter({ style, bannerStyle }: Props) {
  return (
    <View style={[s.wrap, style]}>
      <LogoMark size={34} opacity={0.9} />
      <Wordmark height={22} opacity={0.5} style={bannerStyle} />
      <View style={s.row}>
        <Text style={s.text}>Made with</Text>
        <Heart size={11} color={Colors.inkDisabled} fill={Colors.inkDisabled} />
        <Text style={s.text}>in India</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  text: { fontFamily: FontFamily.bodyMedium, fontSize: 11, letterSpacing: 0.4, color: Colors.inkDisabled },
})
