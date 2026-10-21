import { ActivityIndicator, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Plus, Star, X } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { PrimaryButton } from '@/components/ui'
import { hTap } from '@/lib/haptics'
import type { PhotoItem } from '@/hooks/useEditPhotos'
import type { PhotosViewProps } from './types'

const W = Dimensions.get('window').width
const GAP = 10
const SMALL = Math.floor((W - 40 - GAP * 2) / 3)
const BIG = SMALL * 2 + GAP

/**
 * A · The grid. Hinge's photo editor: your main photo takes a big square,
 * the other five squares sit around it (profile photos are 1:1). Tap a tile to add or swap, the cross to
 * remove, the star to make it your main photo.
 */
export function PhotosA(p: PhotosViewProps) {
  const insets = useSafeAreaInsets()
  const [main, ...rest] = p.items

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.bar}>
        <Pressable style={s.iconBtn} onPress={p.onBack} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={s.barTitle}>Photos</Text>
        <Text style={s.count}>{p.count}/{p.max}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Text style={s.lede}>Your first photo is the one people see first. Add at least {p.min}.</Text>

        <View style={s.top}>
          <Tile item={main} size={BIG} main p={p} />
          <View style={{ gap: GAP }}>
            <Tile item={rest[0]} size={SMALL} p={p} />
            <Tile item={rest[1]} size={SMALL} p={p} />
          </View>
        </View>
        <View style={[s.row, { marginTop: GAP }]}>
          {rest.slice(2, 5).map(it => <Tile key={it.id} item={it} size={SMALL} p={p} />)}
        </View>

        <View style={s.tips}>
          <Text style={s.tipsTitle}>What works</Text>
          <Text style={s.tip}>Your face, clearly, in the first one.</Text>
          <Text style={s.tip}>One from a night out, one doing something you love.</Text>
          <Text style={s.tip}>No group shots as your main photo.</Text>
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <PrimaryButton label="Save photos" onPress={p.onSave} disabled={!p.canSave} loading={p.saving} />
      </View>
    </View>
  )
}

function Tile({ item, size, main, p }: { item: PhotoItem | undefined; size: number; main?: boolean; p: PhotosViewProps }) {
  if (!item) return null
  const filled = !!item.uri
  return (
    <Pressable style={[s.tile, { width: size, height: size }, !filled && s.empty]} onPress={() => { hTap(); p.onSlot(item.id) }}>
      {filled ? (
        <>
          <Image source={{ uri: item.uri! }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
          {item.state === 'uploading' ? <View style={s.busy}><ActivityIndicator color={Colors.white} /></View> : null}
          {main ? (
            <View style={s.mainTag}><Text style={s.mainText}>Main</Text></View>
          ) : (
            <Pressable style={s.star} onPress={() => { hTap(); p.onMakeMain(item.id) }} hitSlop={6}>
              <Star size={13} color={Colors.white} strokeWidth={2.4} />
            </Pressable>
          )}
          <Pressable style={s.remove} onPress={() => { hTap(); p.onRemove(item.id) }} hitSlop={6}>
            <X size={14} color={Colors.nearBlack} strokeWidth={3} />
          </Pressable>
        </>
      ) : (
        <View style={s.add}><Plus size={main ? 30 : 22} color={Colors.inkSecondary} strokeWidth={2} /></View>
      )}
    </Pressable>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 6 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  barTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
  count: { width: 40, textAlign: 'center', fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkSecondary },
  lede: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, marginTop: 6, marginBottom: 16 },

  top: { flexDirection: 'row', gap: GAP },
  row: { flexDirection: 'row', gap: GAP },
  tile: { borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.surface },
  empty: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: withOpacity(Colors.inkPrimary, 0.2) },
  add: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  busy: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  mainTag: { position: 'absolute', left: 8, bottom: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: Colors.white },
  mainText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.nearBlack },
  star: { position: 'absolute', left: 6, bottom: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  remove: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },

  tips: { marginTop: 26, gap: 6 },
  tipsTitle: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary, marginBottom: 2 },
  tip: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },

  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
})
