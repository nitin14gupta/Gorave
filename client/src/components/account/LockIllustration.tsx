import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg'
import Animated, { FadeIn } from 'react-native-reanimated'
import { Colors, withOpacity } from '@/constants'

type Kind = 'locked' | 'review' | 'final'

const BRAND = ['#FFB830', '#FF6B35', '#FF3864']
const MUTED = [withOpacity(Colors.destructive, 0.85), withOpacity(Colors.destructive, 0.55), withOpacity(Colors.destructive, 0.3)]

/**
 * The picture at the top of the locked screens: an icon in a soft circle with
 * twelve short rays around it, in the brand's warm colours (muted red once the
 * decision is final). Drawn, so it stays sharp; fades in once, never loops.
 */
export function LockIllustration({ kind, size = 132 }: { kind: Kind; size?: number }) {
  const palette = kind === 'final' ? MUTED : BRAND
  const c = 66
  const ink = Colors.inkPrimary
  return (
    <Animated.View entering={FadeIn.duration(500)}>
      <Svg width={size} height={size} viewBox="0 0 132 132" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {/* Rays: short strokes all the way round, colours stepping through the palette. */}
        <G>
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 - 90) * (Math.PI / 180)
            const r1 = 56, r2 = 64
            return (
              <Line
                key={i}
                x1={c + Math.cos(a) * r1} y1={c + Math.sin(a) * r1}
                x2={c + Math.cos(a) * r2} y2={c + Math.sin(a) * r2}
                stroke={palette[i % palette.length]}
                strokeWidth={3.5}
                strokeLinecap="round"
              />
            )
          })}
        </G>
        <Circle cx={c} cy={c} r={40} fill={Colors.surface} />
        <Circle cx={c} cy={c} r={40} fill="none" stroke={withOpacity(Colors.inkPrimary, 0.08)} strokeWidth={1} />

        {kind === 'locked' ? (
          <G>
            <Path d="M53 63 v-7 a13 13 0 0 1 26 0 v7" fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />
            <Rect x={47} y={62} width={38} height={28} rx={7} fill={ink} />
            <Circle cx={66} cy={74} r={3.5} fill={Colors.surface} />
            <Rect x={64.5} y={75} width={3} height={7} rx={1.5} fill={Colors.surface} />
          </G>
        ) : kind === 'review' ? (
          <G>
            <Circle cx={c} cy={c} r={22} fill="none" stroke={ink} strokeWidth={4} />
            <Line x1={c} y1={c} x2={c} y2={52} stroke={ink} strokeWidth={4} strokeLinecap="round" />
            <Line x1={c} y1={c} x2={76} y2={72} stroke={ink} strokeWidth={4} strokeLinecap="round" />
            <Circle cx={c} cy={c} r={3} fill={ink} />
          </G>
        ) : (
          <G>
            <Path d="M66 44 l18 7 v13 c0 12 -8 20 -18 24 c-10 -4 -18 -12 -18 -24 v-13 z" fill="none" stroke={Colors.destructive} strokeWidth={4} strokeLinejoin="round" />
            <Line x1={59} y1={59} x2={73} y2={73} stroke={Colors.destructive} strokeWidth={4} strokeLinecap="round" />
            <Line x1={73} y1={59} x2={59} y2={73} stroke={Colors.destructive} strokeWidth={4} strokeLinecap="round" />
          </G>
        )}
      </Svg>
    </Animated.View>
  )
}
