import { useState } from 'react'
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, ChevronRight } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { useParallaxHero } from '@/hooks/useParallaxHero'
import { hTap } from '@/lib/haptics'
import type { ReactNode } from 'react'

export interface EditSection {
  key: string
  title: string
  /** One line of what's set now, e.g. "Sat 25 Oct · 8 pm · 60 people". */
  summary: string
  icon: ReactNode
  /** Some fields lock once guests have joined. */
  note?: string
  render: () => ReactNode
}

export interface EditViewProps {
  cover: string | null
  title: string
  sections: EditSection[]
  /** Locked / date-shift banners. */
  banners: ReactNode
  /** The save bar, or null when the event can't be edited. */
  footer: ReactNode | null
  dirty: boolean
  onBack: () => void
}

const HERO_H = Math.round(Dimensions.get('window').height * 0.36)

/**
 * Edit event, as a listing editor. Like editing an Airbnb listing: the cover on top
 * (parallax), then one row per part of the event with what's set now. Tap
 * a row to edit just that part on its own page, then come back and save.
 */
export function EditEventView(p: EditViewProps) {
  const insets = useSafeAreaInsets()
  const { onScroll, photoStyle, textStyle } = useParallaxHero(HERO_H)
  const [open, setOpen] = useState<string | null>(null)
  const section = p.sections.find(x => x.key === open)

  if (section) {
    return (
      <View style={s.root}>
        <View style={[s.pageBar, { paddingTop: insets.top + 6 }]}>
          <Pressable style={s.iconBtn} onPress={() => setOpen(null)} hitSlop={8}>
            <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={2} />
          </Pressable>
          <Text style={s.pageTitle}>{section.title}</Text>
          <Pressable style={s.done} onPress={() => { hTap(); setOpen(null) }} hitSlop={8}>
            <Text style={s.doneText}>Done</Text>
          </Pressable>
        </View>
        {p.banners}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 12 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {section.note ? <Text style={s.note}>{section.note}</Text> : null}
          {section.render()}
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={s.root}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <View style={s.hero}>
          <Animated.View style={[StyleSheet.absoluteFill, photoStyle]}>
            {p.cover ? <Image source={{ uri: p.cover }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />}
          </Animated.View>
          <LinearGradient colors={['rgba(0,0,0,0.45)', 'transparent', Colors.background]} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
          <Animated.View style={[s.heroText, textStyle]}>
            <Text style={s.kicker}>EDIT EVENT</Text>
            <Text style={s.title} numberOfLines={2}>{p.title || 'Untitled event'}</Text>
          </Animated.View>
        </View>

        {p.banners}

        <View style={s.list}>
          {p.sections.map((x, i) => (
            <Pressable key={x.key} style={[s.row, i > 0 && s.rowBorder]} onPress={() => { hTap(); setOpen(x.key) }}>
              <View style={s.rowIcon}>{x.icon}</View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{x.title}</Text>
                <Text style={s.rowSummary} numberOfLines={2}>{x.summary}</Text>
                {x.note ? <Text style={s.rowNote} numberOfLines={1}>{x.note}</Text> : null}
              </View>
              <ChevronRight size={18} color={Colors.inkDisabled} strokeWidth={2} />
            </Pressable>
          ))}
        </View>
        <Text style={s.hint}>Guests going or waiting get a notification when you save changes.</Text>
      </Animated.ScrollView>

      <Pressable style={[s.back, { top: insets.top + 8 }]} onPress={p.onBack} hitSlop={8}>
        <ArrowLeft size={20} color={Colors.white} strokeWidth={2} />
      </Pressable>

      {p.footer ? <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>{p.dirty ? <Text style={s.unsaved}>You have unsaved changes</Text> : null}{p.footer}</View> : null}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hero: { height: HERO_H, overflow: 'hidden' },
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 10, gap: 6 },
  kicker: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.8, color: withOpacity(Colors.white, 0.75) },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 30, lineHeight: 33, letterSpacing: -0.6, color: Colors.white },
  back: { position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },

  list: { marginHorizontal: 16, marginTop: 12, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 16 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  rowIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: withOpacity(Colors.inkPrimary, 0.07), alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  rowSummary: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 18, color: Colors.inkSecondary, marginTop: 2 },
  rowNote: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.inkDisabled, marginTop: 3 },
  hint: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, marginHorizontal: 20, marginTop: 14 },

  pageBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
  done: { paddingHorizontal: 10, height: 40, justifyContent: 'center' },
  doneText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  note: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary },

  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 10, gap: 8, backgroundColor: Colors.background, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  unsaved: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary, textAlign: 'center' },
})
