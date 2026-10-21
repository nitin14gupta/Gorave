import { useState } from 'react'
import { ActivityIndicator, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, ImagePlus, Plus, RefreshCw, Star, Trash2 } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { PrimaryButton } from '@/components/ui'
import { hSelection, hTap } from '@/lib/haptics'
import type { PhotosViewProps } from './types'

const W = Dimensions.get('window').width
const PREVIEW_W = Math.round(W * 0.62)
const THUMB = 64

/**
 * B · As others see you. Your profile card on top, exactly how people
 * will meet you, then your photos as a numbered strip in order. Pick one
 * to make it the main photo, swap it or remove it; the card updates live.
 */
export function PhotosB(p: PhotosViewProps) {
  const insets = useSafeAreaInsets()
  const [selected, setSelected] = useState(0)
  const cur = p.items[selected]
  const main = p.items[0]

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.bar}>
        <Pressable style={s.iconBtn} onPress={p.onBack} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={s.barTitle}>Your photos</Text>
        <View style={s.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Text style={s.caption}>How people see you</Text>
        <View style={s.preview}>
          {main?.uri ? <Image source={{ uri: main.uri }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : (
            <View style={s.previewEmpty}><ImagePlus size={34} color={Colors.inkDisabled} strokeWidth={1.6} /></View>
          )}
          <View style={s.dots}>
            {p.items.filter(i => i.uri).map((i, idx) => <View key={i.id} style={[s.dot, idx === 0 && s.dotOn]} />)}
          </View>
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={s.shade} />
          <View style={s.previewText}>
            <Text style={s.name} numberOfLines={1}>{p.name || 'You'}</Text>
            {p.city ? <Text style={s.city}>{p.city}</Text> : null}
          </View>
        </View>

        <View style={s.stripHead}>
          <Text style={s.section}>In this order</Text>
          <Text style={s.count}>{p.count} of {p.max} · at least {p.min}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.strip}>
          {p.items.map((it, idx) => {
            const on = idx === selected
            return (
              <Pressable key={it.id} onPress={() => { hSelection(); setSelected(idx); if (!it.uri) p.onSlot(it.id) }} style={[s.thumb, on && s.thumbOn, !it.uri && s.thumbEmpty]}>
                {it.uri ? <Image source={{ uri: it.uri }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : <Plus size={18} color={Colors.inkSecondary} strokeWidth={2} />}
                {it.state === 'uploading' ? <View style={s.busy}><ActivityIndicator size="small" color={Colors.white} /></View> : null}
                <View style={s.num}><Text style={s.numText}>{idx + 1}</Text></View>
              </Pressable>
            )
          })}
        </ScrollView>

        {cur?.uri ? (
          <View style={s.actions}>
            <Action icon={Star} label={selected === 0 ? 'Main photo' : 'Make main'} disabled={selected === 0} onPress={() => { p.onMakeMain(cur.id); setSelected(0) }} />
            <Action icon={RefreshCw} label="Swap" onPress={() => p.onSlot(cur.id)} />
            <Action icon={Trash2} label="Remove" danger onPress={() => { p.onRemove(cur.id); setSelected(0) }} />
          </View>
        ) : (
          <Text style={s.hint}>Tap an empty slot to add a photo.</Text>
        )}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <PrimaryButton label="Save photos" onPress={p.onSave} disabled={!p.canSave} loading={p.saving} />
      </View>
    </View>
  )
}

function Action({ icon: I, label, onPress, danger, disabled }: { icon: typeof Star; label: string; onPress: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <Pressable style={[s.action, disabled && { opacity: 0.45 }]} onPress={() => { hTap(); onPress() }} disabled={disabled}>
      <I size={18} color={danger ? Colors.destructive : Colors.inkPrimary} strokeWidth={2} />
      <Text style={[s.actionText, danger && { color: Colors.destructive }]}>{label}</Text>
    </Pressable>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 6 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  barTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },

  caption: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: Colors.inkDisabled, textAlign: 'center', marginTop: 8, marginBottom: 10 },
  preview: { alignSelf: 'center', width: PREVIEW_W, height: Math.round(PREVIEW_W * 1.25), borderRadius: 22, overflow: 'hidden', backgroundColor: Colors.surface },
  previewEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', top: 8, left: 10, right: 10, flexDirection: 'row', gap: 4 },
  dot: { flex: 1, height: 3, borderRadius: 2, backgroundColor: withOpacity(Colors.white, 0.4) },
  dotOn: { backgroundColor: Colors.white },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '35%' },
  previewText: { position: 'absolute', left: 14, right: 14, bottom: 12 },
  name: { fontFamily: FontFamily.displayExtraBold, fontSize: 24, color: Colors.white },
  city: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: withOpacity(Colors.white, 0.8) },

  stripHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 20, marginTop: 24, marginBottom: 10 },
  section: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  count: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  strip: { gap: 10, paddingHorizontal: 20 },
  thumb: { width: THUMB, height: Math.round(THUMB * 1.25), borderRadius: 12, overflow: 'hidden', backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  thumbOn: { borderColor: Colors.inkPrimary },
  thumbEmpty: { borderStyle: 'dashed', borderColor: withOpacity(Colors.inkPrimary, 0.2), borderWidth: 1.5 },
  busy: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  num: { position: 'absolute', left: 4, top: 4, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, color: Colors.white },

  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 16 },
  action: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  actionText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkPrimary },
  hint: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, paddingHorizontal: 20, marginTop: 16 },

  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
})
