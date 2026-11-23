import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { hTap } from '@/lib/haptics'
import { getLatestRecap, peekLatestRecap } from '@/lib/recapSeen'
import type { MonthRecap } from '@/types/api'

// Last month's "Your month on Gorave" on your own profile, all month long:
// November's recap replaces October's on the 1st. Nothing shows if there's no
// recap or the month was quiet. Tapping opens the full card to share.

const FAN: [number, number, number][] = [[0, 6, -8], [22, 0, 4], [44, 8, 11]] // left, top, rotation

export function MonthRecapTile() {
  // Cached on the phone for the month (see lib/recapSeen), so this is instant
  // after the first load and never refetches until the 1st.
  const [recap, setRecap] = useState<MonthRecap | null>(peekLatestRecap)

  useEffect(() => {
    let alive = true
    getLatestRecap().then(r => { if (alive) setRecap(r) }).catch(() => {})
    return () => { alive = false }
  }, [])

  if (!recap || !recap.shareable) return null

  const photos = recap.photos.slice(0, 3)
  const stats = recap.stats.slice(0, 2)

  return (
    <Pressable style={s.card} onPress={() => { hTap(); router.push(`/(profile)/month/${recap.month}`) }}>
      <View style={[s.fan, { width: 58 + (photos.length - 1) * 22 }]}>
        {photos.map((p, i) => (
          <Image
            key={p.url + i}
            source={{ uri: p.url }}
            style={[s.print, { left: FAN[i][0], top: FAN[i][1], transform: [{ rotate: `${FAN[i][2]}deg` }], zIndex: i }]}
            contentFit="cover"
          />
        ))}
      </View>
      <View style={s.text}>
        <Text style={s.eyebrow}>{`YOUR ${recap.month_label.toUpperCase()}`}</Text>
        <Text style={s.headline} numberOfLines={1}>
          {recap.headline.join(' ')}<Text style={s.dot}>.</Text>
        </Text>
        {stats.length ? (
          <Text style={s.stats} numberOfLines={1}>
            {stats.map(st => `${st.value}${st.style === 'rating' ? '★' : ''} ${st.label}`).join(' · ')}
          </Text>
        ) : null}
        <View style={s.cta}>
          <Text style={s.ctaText}>See it and share</Text>
          <ChevronRight size={14} color={Colors.inkPrimary} strokeWidth={2.4} />
        </View>
      </View>
    </Pressable>
  )
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: 24,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider,
  },
  fan: { height: 84 },
  print: {
    position: 'absolute', width: 58, height: 72, borderRadius: 10, borderWidth: 2, borderColor: Colors.surface,
    backgroundColor: Colors.elevated,
  },
  text: { flex: 1, gap: 3 },
  eyebrow: { fontFamily: FontFamily.bodySemiBold, fontSize: 10.5, letterSpacing: 1.4, color: Colors.inkSecondary },
  headline: { fontFamily: FontFamily.displayExtraBold, fontSize: 24, letterSpacing: -0.7, color: Colors.inkPrimary },
  dot: { color: Colors.brandOrange },
  stats: { fontFamily: FontFamily.bodyRegular, fontSize: 12.5, color: Colors.inkSecondary },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  ctaText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
})
