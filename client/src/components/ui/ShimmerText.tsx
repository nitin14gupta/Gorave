import { Text, type StyleProp, type TextStyle } from 'react-native'

interface Props {
  children: string
  style?: StyleProp<TextStyle>
  numberOfLines?: number
  /** Resting color while the sweep isn't over it — must read as visibly
   * dimmer than `style`'s color, since the whole effect is the sweep
   * brightening the text back up as it passes. Defaults to inkSecondary. */
  dimColor?: string
}

// Used to sweep a bright streak across the text on a loop. Decorative loops
// are out, so it now renders the text still, in its normal colour. The
// component (and its props) stay so callers don't change.
export function ShimmerText({ children, style, numberOfLines }: Props) {
  return <Text style={style} numberOfLines={numberOfLines}>{children}</Text>
}
