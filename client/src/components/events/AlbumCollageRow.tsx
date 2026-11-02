import { Dimensions, Pressable, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useReducedMotion, type SharedValue } from 'react-native-reanimated'
import { PartyPopper } from 'lucide-react-native'
import type { AlbumPhoto } from '@/api/apiService'
import { Colors } from '@/constants'

const { width: W, height: SCREEN_H } = Dimensions.get('window')
const GAP = 2
const SMALL = (W - GAP * 2) / 3
const LARGE = SMALL * 2 + GAP
const SMALL_H = SMALL * 1.25
const LARGE_H = SMALL_H * 2 + GAP
// How far past the bottom edge of the screen a photo travels while it settles.
const REVEAL = 170
const RISE = 34
const TILE_STAGGER = 46

export type CollageShape = 'heroLeft' | 'row' | 'heroRight'
export interface CollageRow { key: string; shape: CollageShape; top: number; items: { photo: AlbumPhoto; index: number }[] }

const RHYTHM: CollageShape[] = ['heroLeft', 'row', 'heroRight', 'row']

/** Three photos per row, in a repeating rhythm of big and small. `top` is where the row sits in the list. */
export function collageRows(photos: AlbumPhoto[]): CollageRow[] {
  const rows: CollageRow[] = []
  let top = 0
  for (let i = 0, r = 0; i < photos.length; i += 3, r += 1) {
    const items = photos.slice(i, i + 3).map((photo, k) => ({ photo, index: i + k }))
    const shape = items.length === 3 ? RHYTHM[r % RHYTHM.length] : 'row'
    rows.push({ key: items[0].photo.id, shape, top, items })
    top += (shape === 'row' ? SMALL_H : LARGE_H) + GAP
  }
  return rows
}

/**
 * Tied to the scroll, not a timer: each photo rises and sharpens into place
 * as it comes up from the bottom edge, one just after the other, and goes
 * back again if you scroll up. Nothing moves once it's on screen.
 */
function Tile({ photo, width, height, top, order, scrollY, headerHeight, onPress }: {
  photo: AlbumPhoto; width: number; height: number; top: number; order: number
  scrollY: SharedValue<number>; headerHeight: SharedValue<number>; onPress: () => void
}) {
  const reduced = useReducedMotion()
  const st = useAnimatedStyle(() => {
    if (reduced) return {}
    const entered = scrollY.value + SCREEN_H - (headerHeight.value + top) - order * TILE_STAGGER
    const p = interpolate(entered, [0, REVEAL], [0, 1], Extrapolation.CLAMP)
    return { opacity: 0.25 + p * 0.75, transform: [{ translateY: (1 - p) * RISE }, { scale: 0.94 + p * 0.06 }] }
  })
  return (
    <Animated.View style={st}>
      <Pressable onPress={onPress} accessibilityLabel="Open photo">
        <Image source={{ uri: photo.url, cacheKey: photo.key }} style={[s.tile, { width, height }]} contentFit="cover" cachePolicy="memory-disk" transition={150} />
        {photo.voted ? <View style={s.mark}><PartyPopper size={13} color={Colors.background} strokeWidth={2.2} /></View> : null}
      </Pressable>
    </Animated.View>
  )
}

export function AlbumCollageRow({ row, scrollY, headerHeight, onOpen }: {
  row: CollageRow; scrollY: SharedValue<number>; headerHeight: SharedValue<number>; onOpen: (index: number) => void
}) {
  const [a, b, c] = row.items
  const motion = { scrollY, headerHeight }
  if (row.shape === 'row') {
    return (
      <View style={s.line}>
        {row.items.map((i, order) => <Tile key={i.photo.id} photo={i.photo} width={SMALL} height={SMALL_H} top={row.top} order={order} {...motion} onPress={() => onOpen(i.index)} />)}
      </View>
    )
  }
  const hero = <Tile photo={a.photo} width={LARGE} height={LARGE_H} top={row.top} order={0} {...motion} onPress={() => onOpen(a.index)} />
  const side = (
    <View style={s.stack}>
      <Tile photo={b.photo} width={SMALL} height={SMALL_H} top={row.top} order={1} {...motion} onPress={() => onOpen(b.index)} />
      <Tile photo={c.photo} width={SMALL} height={SMALL_H} top={row.top + SMALL_H + GAP} order={1} {...motion} onPress={() => onOpen(c.index)} />
    </View>
  )
  return <View style={s.line}>{row.shape === 'heroLeft' ? <>{hero}{side}</> : <>{side}{hero}</>}</View>
}

const s = StyleSheet.create({
  line: { flexDirection: 'row', gap: GAP, marginBottom: GAP },
  stack: { gap: GAP },
  tile: { backgroundColor: Colors.surface },
  mark: { position: 'absolute', right: 6, bottom: 6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
})
