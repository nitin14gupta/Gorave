import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image, type ImageSource } from 'expo-image'
import { Plus, Search } from 'lucide-react-native'
import { Colors, FontFamily, EVENT_CARD_CAROUSEL_W, withOpacity } from '@/constants'
import { hTap } from '@/lib/haptics'

/**
 * The last card in a Home rail ("You're Hosting", "You're Going"): the next
 * step, same size as the event cards beside it, so the row reads as a set
 * with one open slot at the end.
 */
export function RailEndCard({ kind, posters, onPress }: {
  kind: 'host' | 'find'
  /** Two or three 4:5 posters, fanned. */
  posters: ImageSource[]
  onPress: () => void
}) {
  const Icon = kind === 'host' ? Plus : Search
  const title = kind === 'host' ? 'Host another night' : 'Find your next night'
  const sub = kind === 'host' ? 'Start from a template or from scratch' : "See what's on near you"
  return (
    <Pressable
      style={s.card}
      onPress={() => { hTap(); onPress() }}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={s.fan}>
        {posters.slice(0, 3).map((src, i, arr) => {
          const mid = (arr.length - 1) / 2
          return (
            <Image
              key={i}
              source={src}
              style={[s.poster, { zIndex: i === Math.round(mid) ? 2 : 1, marginLeft: i ? -26 : 0, transform: [{ rotate: `${(i - mid) * 8}deg` }, { translateY: Math.abs(i - mid) * 6 }] }]}
              contentFit="cover"
            />
          )
        })}
      </View>
      <View style={s.icon}><Icon size={18} color={Colors.inkPrimary} strokeWidth={2.2} /></View>
      <Text style={s.title}>{title}</Text>
      <Text style={s.sub}>{sub}</Text>
    </Pressable>
  )
}

const s = StyleSheet.create({
  card: {
    width: EVENT_CARD_CAROUSEL_W,
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 18,
    gap: 6,
  },
  fan: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  poster: { width: 58, height: 72, borderRadius: 10, borderWidth: 2, borderColor: Colors.surface },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: withOpacity(Colors.inkPrimary, 0.08), alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.headingBold, fontSize: 15, color: Colors.inkPrimary, textAlign: 'center', marginTop: 4 },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, lineHeight: 16, color: Colors.inkSecondary, textAlign: 'center' },
})
