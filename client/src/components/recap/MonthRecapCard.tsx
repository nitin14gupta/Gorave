import { forwardRef, useMemo } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { Colors, FontFamily, Lockup, MarkCream, BRAND_ASPECT } from '@/constants'
import type { MonthRecap, MonthRecapNearby } from '@/types/api'

// "Your month on Gorave", drawn as a 9:16 story card so it can be captured and
// shared as-is. Designed at 1080 x 1920 and scaled to `width`; every size below
// is in those design pixels. Mockups: docs/mockups/month-on-gorave/.

const DESIGN_W = 1080

// [left, top, rotation] for 1, 2 or 3 photos, fanned like prints on a table.
const FANS: Record<number, [number, number, number][]> = {
  1: [[290, 0, -4]],
  2: [[170, 10, -6], [530, 30, 5]],
  3: [[90, 0, -8], [390, 40, 3], [690, 0, 9]],
}

interface Props {
  recap: MonthRecap
  width: number
  /** Quiet month only: tapping a nearby night, or the "See what's on" button. */
  onOpenEvent?: (id: string) => void
  onBrowse?: () => void
}

function nearbyWhen(n: MonthRecapNearby): string {
  const d = new Date(n.date_time)
  const day = d.toLocaleDateString('en-IN', { weekday: 'short' })
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: d.getMinutes() ? '2-digit' : undefined }).toUpperCase()
  return [`${day}, ${time}`, n.area].filter(Boolean).join(' · ')
}

export const MonthRecapCard = forwardRef<View, Props>(({ recap, width, onOpenEvent, onBrowse }, ref) => {
  const k = width / DESIGN_W
  const z = (n: number) => Math.round(n * k * 10) / 10
  const st = useMemo(() => makeStyles(z), [width]) // eslint-disable-line react-hooks/exhaustive-deps
  const photos = recap.photos.slice(0, 3)
  const fan = FANS[photos.length] ?? []
  const big = photos.length === 1 ? 1.5 : 1

  return (
    <View ref={ref} collapsable={false} style={[st.card, { width, height: z(1920) }]}>
      <View style={st.top}>
        <Image source={Lockup} style={{ height: z(46), width: z(46) * BRAND_ASPECT.lockup }} contentFit="contain" />
        <Text style={st.chip}>{`${recap.month_label.slice(0, 3).toUpperCase()} ${recap.year}`}</Text>
      </View>

      <Text style={st.kicker} numberOfLines={1}>{recap.kicker}</Text>
      <View style={st.head}>
        <Text style={st.headLine} numberOfLines={1} adjustsFontSizeToFit>{recap.headline[0]}</Text>
        <Text style={st.headLine} numberOfLines={1} adjustsFontSizeToFit>
          {recap.headline[1]}<Text style={st.dot}>.</Text>
        </Text>
      </View>

      {recap.kind !== 'quiet' ? (
        <>
          <View style={st.photos}>
            {photos.map((p, i) => {
              const [x, y, r] = fan[i]
              return (
                <View
                  key={p.url + i}
                  style={[st.ph, { left: z(x), top: z(y), width: z(300 * big), height: z(375 * big), transform: [{ rotate: `${r}deg` }] }]}
                >
                  <Image source={{ uri: p.url }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
                  <Text style={st.phLabel} numberOfLines={1}>{p.title}</Text>
                </View>
              )
            })}
          </View>

          <View style={st.stats}>
            {recap.stats.map(s => (
              <View key={s.label} style={st.stat}>
                <View style={st.statValueBox}>
                  <Text
                    style={s.style === 'word' ? st.statWord : st.statNum}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {s.value}
                    {s.style === 'rating' ? <Text style={st.star}> ★</Text> : null}
                  </Text>
                </View>
                <Text style={st.statLabel} numberOfLines={1}>{s.label}</Text>
              </View>
            ))}
          </View>

          <View style={st.foot}>
            <Text style={st.footText}>
              Find your next night <Text style={st.footMuted}>on gorave.in</Text>
            </Text>
            <Image source={MarkCream} style={{ width: z(64), height: z(64) }} contentFit="contain" />
          </View>
        </>
      ) : (
        <>
          <Text style={st.quietLead}>
            {recap.nearby?.length
              ? 'No nights out this month. These are on near you this week:'
              : 'No nights out this month. New nights go up every day.'}
          </Text>
          <View style={st.nearby}>
            {(recap.nearby ?? []).map(n => (
              <Pressable key={n.id} style={st.ev} onPress={() => onOpenEvent?.(n.id)}>
                {n.photo ? <Image source={{ uri: n.photo }} style={st.evImg} contentFit="cover" /> : <View style={st.evImg} />}
                <View style={st.evBody}>
                  <Text style={st.evTitle} numberOfLines={1}>{n.title}</Text>
                  <Text style={st.evMeta} numberOfLines={1}>
                    {nearbyWhen(n)} · <Text style={st.evPrice}>{n.price_inr ? `₹${n.price_inr}` : 'Free'}</Text>
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
          {recap.met_going ? (
            <Text style={st.note}>
              {recap.met_going === 1 ? 'Someone you partied with is going to one of these.' : `${recap.met_going} people you partied with are going to one of these.`}
            </Text>
          ) : null}
          <Pressable style={st.cta} onPress={onBrowse}>
            <Text style={st.ctaText}>{"See what's on this weekend"}</Text>
          </Pressable>
        </>
      )}
    </View>
  )
})
MonthRecapCard.displayName = 'MonthRecapCard'

function makeStyles(z: (n: number) => number) {
  const pad = z(84)
  return StyleSheet.create({
    card: { backgroundColor: Colors.background, overflow: 'hidden' },
    top: { position: 'absolute', left: pad, right: pad, top: z(84), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chip: {
      fontFamily: FontFamily.bodySemiBold, fontSize: z(25), letterSpacing: z(2.5), color: Colors.inkSecondary,
      borderWidth: z(2), borderColor: Colors.divider, borderRadius: 999, paddingVertical: z(12), paddingHorizontal: z(24),
    },
    kicker: { position: 'absolute', left: pad, right: pad, top: z(236), fontFamily: FontFamily.bodyMedium, fontSize: z(40), color: Colors.inkSecondary },
    head: { position: 'absolute', left: pad, right: pad, top: z(300) },
    headLine: {
      fontFamily: FontFamily.displayExtraBold, fontSize: z(196), lineHeight: z(184), letterSpacing: -z(196 * 0.045),
      color: Colors.inkPrimary, includeFontPadding: false,
    },
    dot: { color: Colors.brandOrange },
    photos: { position: 'absolute', left: 0, right: 0, top: z(760), height: z(560) },
    ph: {
      position: 'absolute', borderRadius: z(28), overflow: 'hidden', borderWidth: z(6), borderColor: '#222222',
      backgroundColor: Colors.surface,
    },
    phLabel: {
      position: 'absolute', left: z(16), right: z(16), bottom: z(16), fontFamily: FontFamily.bodySemiBold, fontSize: z(23),
      color: Colors.inkPrimary, backgroundColor: 'rgba(17,17,17,0.72)', borderRadius: z(14), overflow: 'hidden',
      paddingVertical: z(10), paddingHorizontal: z(14),
    },
    stats: { position: 'absolute', left: pad, right: pad, top: z(1330), flexDirection: 'row', flexWrap: 'wrap', rowGap: z(44) },
    stat: { width: '50%', paddingRight: z(20) },
    statValueBox: { height: z(104), justifyContent: 'flex-end' },
    statNum: { fontFamily: FontFamily.displayExtraBold, fontSize: z(108), lineHeight: z(110), letterSpacing: -z(4.3), color: Colors.inkPrimary, includeFontPadding: false },
    statWord: { fontFamily: FontFamily.displayExtraBold, fontSize: z(80), lineHeight: z(88), letterSpacing: -z(3), color: Colors.inkPrimary, includeFontPadding: false },
    star: { color: Colors.brandOrange, fontSize: z(70) },
    statLabel: { marginTop: z(10), fontFamily: FontFamily.bodyMedium, fontSize: z(31), color: Colors.inkSecondary },
    foot: {
      position: 'absolute', left: pad, right: pad, bottom: z(84), borderTopWidth: z(2), borderTopColor: Colors.divider,
      paddingTop: z(36), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    footText: { fontFamily: FontFamily.bodySemiBold, fontSize: z(32), color: Colors.inkPrimary },
    footMuted: { fontFamily: FontFamily.bodyMedium, color: Colors.inkSecondary },
    quietLead: { position: 'absolute', left: pad, right: pad, top: z(710), fontFamily: FontFamily.bodyRegular, fontSize: z(38), lineHeight: z(53), color: Colors.inkSecondary },
    nearby: { position: 'absolute', left: pad, right: pad, top: z(880), rowGap: z(22) },
    ev: { flexDirection: 'row', alignItems: 'center', columnGap: z(26), backgroundColor: Colors.surface, borderRadius: z(28), padding: z(18) },
    evImg: { width: z(128), height: z(160), borderRadius: z(18), backgroundColor: Colors.elevated },
    evBody: { flex: 1 },
    evTitle: { fontFamily: FontFamily.headingBold, fontSize: z(38), letterSpacing: -z(0.8), color: Colors.inkPrimary, marginBottom: z(8) },
    evMeta: { fontFamily: FontFamily.bodyRegular, fontSize: z(28), color: Colors.inkSecondary },
    evPrice: { fontFamily: FontFamily.bodySemiBold, color: Colors.brandOrange },
    note: { position: 'absolute', left: pad, right: pad, top: z(1560), fontFamily: FontFamily.bodyRegular, fontSize: z(30), color: Colors.inkSecondary, textAlign: 'center' },
    cta: { position: 'absolute', left: pad, right: pad, bottom: z(84), height: z(116), borderRadius: z(30), backgroundColor: Colors.brandOrange, alignItems: 'center', justifyContent: 'center' },
    ctaText: { fontFamily: FontFamily.bodySemiBold, fontSize: z(38), color: Colors.inkOnAccent },
  })
}
