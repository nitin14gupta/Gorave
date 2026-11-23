import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { ChevronRight, X } from 'lucide-react-native'
import { Colors, FontFamily, MarkCream } from '@/constants'
import { hTap } from '@/lib/haptics'
import { getLatestRecap, getRecapFlag, setRecapFlag } from '@/lib/recapSeen'
import type { MonthRecap } from '@/types/api'

const SHOW_DAYS = 7 // the card stays on Home for the first week of the month
const REVEAL_DELAY_MS = 700

function istDayOfMonth(): number {
  return new Date(Date.now() + 5.5 * 3600 * 1000).getUTCDate()
}

// "Your month on Gorave" on Home, for the first week of the month. The first
// time a shareable recap is ready, it also opens full screen once by itself;
// after that it's this card until it's closed or the week is over. A quiet
// month only gets the card (it points to what's on), never the auto-open.
export function MonthRecapBanner() {
  const [recap, setRecap] = useState<MonthRecap | null>(null)

  useEffect(() => {
    if (istDayOfMonth() > SHOW_DAYS) return
    let alive = true
    let timer: ReturnType<typeof setTimeout> | undefined
    getLatestRecap()
      .then(async r => {
        if (!r || !alive || (await getRecapFlag('dismissed', r.month))) return
        setRecap(r)
        if (r.shareable && !(await getRecapFlag('revealed', r.month))) {
          timer = setTimeout(() => {
            if (!alive) return
            setRecapFlag('revealed', r.month)
            router.push(`/(profile)/month/${r.month}`)
          }, REVEAL_DELAY_MS)
        }
      })
      .catch(() => {}) // no recap (new member, or nothing yet): no card
    return () => {
      alive = false
      if (timer) clearTimeout(timer)
    }
  }, [])

  if (!recap) return null

  const quiet = recap.kind === 'quiet'
  const photo = recap.photos[0]?.url

  return (
    <Pressable style={s.card} onPress={() => { hTap(); router.push(`/(profile)/month/${recap.month}`) }}>
      {photo ? (
        <Image source={{ uri: photo }} style={s.photo} contentFit="cover" />
      ) : (
        <View style={s.markBox}><Image source={MarkCream} style={s.mark} contentFit="contain" /></View>
      )}
      <View style={s.text}>
        <Text style={s.label} numberOfLines={1}>{`Your ${recap.month_label} on Gorave`.toUpperCase()}</Text>
        <Text style={s.title} numberOfLines={1}>
          {recap.headline.join(' ')}<Text style={s.dot}>.</Text>
        </Text>
        <Text style={s.body} numberOfLines={1}>{quiet ? "See what's on near you this week" : 'See your month and share it'}</Text>
      </View>
      <ChevronRight size={18} color={Colors.inkSecondary} strokeWidth={2.2} />
      <Pressable
        style={s.dismiss}
        hitSlop={10}
        accessibilityLabel="Hide"
        onPress={() => { hTap(); setRecapFlag('dismissed', recap.month); setRecap(null) }}
      >
        <X size={14} color={Colors.inkSecondary} strokeWidth={2.4} />
      </Pressable>
    </Pressable>
  )
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingRight: 14, borderRadius: 20, backgroundColor: Colors.surface },
  photo: { width: 44, height: 55, borderRadius: 10, backgroundColor: Colors.elevated },
  markBox: { width: 44, height: 55, borderRadius: 10, backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center' },
  mark: { width: 26, height: 26 },
  text: { flex: 1, gap: 2 },
  label: { fontFamily: FontFamily.bodySemiBold, fontSize: 10.5, letterSpacing: 1, color: Colors.inkSecondary },
  title: { fontFamily: FontFamily.headingBold, fontSize: 19, letterSpacing: -0.4, color: Colors.inkPrimary },
  dot: { color: Colors.brandOrange },
  body: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },
  dismiss: { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.elevated },
})
