import { useFonts } from 'expo-font'

// Bricolage Grotesque (headings, the same face as the logo) and Figtree
// (everything you read). Fixed-weight cuts made from the variable fonts by
// docs/brand/cut_fonts.py, so Android and iOS render them the same.
const FONT_MAP = {
  'BricolageGrotesque-ExtraBold': require('../../assets/fonts/BricolageGrotesque-ExtraBold.ttf'),
  'BricolageGrotesque-Bold': require('../../assets/fonts/BricolageGrotesque-Bold.ttf'),
  'BricolageGrotesque-Medium': require('../../assets/fonts/BricolageGrotesque-Medium.ttf'),
  'Figtree-Regular': require('../../assets/fonts/Figtree-Regular.ttf'),
  'Figtree-Medium': require('../../assets/fonts/Figtree-Medium.ttf'),
  'Figtree-Bold': require('../../assets/fonts/Figtree-Bold.ttf'),
} as const

export function useVibeFonts() {
  return useFonts(FONT_MAP)
}
