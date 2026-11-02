import { Dimensions, Pressable, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { PartyPopper } from 'lucide-react-native'
import type { AlbumPhoto } from '@/api/apiService'
import { Colors } from '@/constants'

const W = Dimensions.get('window').width
const GAP = 2
const SMALL = (W - GAP * 2) / 3
const LARGE = SMALL * 2 + GAP
const SMALL_H = SMALL * 1.25
const LARGE_H = SMALL_H * 2 + GAP

export type CollageShape = 'heroLeft' | 'row' | 'heroRight'
export interface CollageRow { key: string; shape: CollageShape; items: { photo: AlbumPhoto; index: number }[] }

const RHYTHM: CollageShape[] = ['heroLeft', 'row', 'heroRight', 'row']

/** Three photos per row, in a repeating rhythm of big and small. */
export function collageRows(photos: AlbumPhoto[]): CollageRow[] {
  const rows: CollageRow[] = []
  for (let i = 0, r = 0; i < photos.length; i += 3, r += 1) {
    const items = photos.slice(i, i + 3).map((photo, k) => ({ photo, index: i + k }))
    rows.push({ key: items[0].photo.id, shape: items.length === 3 ? RHYTHM[r % RHYTHM.length] : 'row', items })
  }
  return rows
}

function Tile({ photo, width, height, onPress }: { photo: AlbumPhoto; width: number; height: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel="Open photo">
      <Image source={{ uri: photo.url, cacheKey: photo.key }} style={[s.tile, { width, height }]} contentFit="cover" cachePolicy="memory-disk" transition={150} />
      {photo.voted ? <View style={s.mark}><PartyPopper size={13} color={Colors.background} strokeWidth={2.2} /></View> : null}
    </Pressable>
  )
}

export function AlbumCollageRow({ row, onOpen }: { row: CollageRow; onOpen: (index: number) => void }) {
  const [a, b, c] = row.items
  if (row.shape === 'row') {
    return (
      <View style={s.line}>
        {row.items.map(i => <Tile key={i.photo.id} photo={i.photo} width={SMALL} height={SMALL_H} onPress={() => onOpen(i.index)} />)}
      </View>
    )
  }
  const hero = <Tile photo={a.photo} width={LARGE} height={LARGE_H} onPress={() => onOpen(a.index)} />
  const side = (
    <View style={s.stack}>
      <Tile photo={b.photo} width={SMALL} height={SMALL_H} onPress={() => onOpen(b.index)} />
      <Tile photo={c.photo} width={SMALL} height={SMALL_H} onPress={() => onOpen(c.index)} />
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
