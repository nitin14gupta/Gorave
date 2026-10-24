import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Plus, LifeBuoy, ChevronRight, Users, Eye, MapPin, Wine } from 'lucide-react-native'
import type { EventSummary } from '@/api/apiService'
import type { EmergencyContact } from '@/types/api'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { SosPill } from '@/components/events/SosButton'
import { ContactAvatar } from '@/components/safety/ContactAvatar'
import { MAX_EMERGENCY_CONTACTS } from '@/hooks/useEmergencyContacts'

export interface SafetyViewProps {
  contacts: EmergencyContact[]
  /** The event you're at right now, if there is one. */
  activeEvent: EventSummary | null
  onContacts: () => void
  onAddContact: () => void
  onHelp: () => void
}

export const TIPS = [
  { key: 'tell', title: 'Tell someone', body: 'Send a friend the event and where it is before you leave.' },
  { key: 'public', title: 'Meet in public first', body: 'If it is a new host or crowd, arrive while it is still early and busy.' },
  { key: 'drink', title: 'Watch your drink', body: 'Keep it in your hand and skip anything you did not see poured.' },
  { key: 'gut', title: 'Trust your gut', body: 'If it feels off, leave. You never owe anyone an explanation.' },
] as const

const TIP_ICON = { tell: Users, public: MapPin, drink: Wine, gut: Eye } as const

/**
 * Tonight. The top card answers "what do I do if something feels
 * wrong": when you are at an event it shows that event with a big SOS
 * button, otherwise it explains what SOS does. Under it, your circle (the
 * people who get the text), then short tips for before you go.
 */
export function SafetyView(p: SafetyViewProps) {
  const has = p.contacts.length > 0
  return (
    <View style={{ gap: 24 }}>
      <View style={s.hero}>
        {p.activeEvent ? (
          <>
            <View style={s.liveRow}><View style={s.liveDot} /><Text style={s.liveText}>YOU&apos;RE AT</Text></View>
            <Text style={s.heroTitle} numberOfLines={2}>{p.activeEvent.title}</Text>
            <Text style={s.heroBody}>
              {has ? 'If something feels wrong, one tap texts your circle a map link to where you are.' : 'Add someone to your circle first, then SOS can reach them.'}
            </Text>
            {has ? <SosPill eventId={p.activeEvent.id} style={s.sos} /> : null}
          </>
        ) : (
          <>
            <Text style={s.heroTitle}>Out tonight? We&apos;ve got your back.</Text>
            <Text style={s.heroBody}>
              At any event you have joined, an SOS button appears on Happening Now and the event page. One tap texts your circle a map link to where you are.
            </Text>
          </>
        )}
      </View>

      <View style={{ gap: 12 }}>
        <View style={s.rowHead}>
          <Text style={s.label}>YOUR CIRCLE</Text>
          <Text style={s.count}>{p.contacts.length} of {MAX_EMERGENCY_CONTACTS}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.circle} style={s.circleBleed}>
          {p.contacts.length < MAX_EMERGENCY_CONTACTS ? (
            <Pressable style={s.person} onPress={p.onAddContact}>
              <View style={s.addCircle}><Plus size={22} color={Colors.inkPrimary} strokeWidth={2} /></View>
              <Text style={s.personName}>Add</Text>
            </Pressable>
          ) : null}
          {p.contacts.map(c => (
            <Pressable key={c.id} style={s.person} onPress={p.onContacts}>
              <ContactAvatar name={c.name} size={56} />
              <Text style={s.personName} numberOfLines={1}>{c.name.split(' ')[0]}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={s.caption}>
          {has ? 'These people get one text with your location when you send SOS.' : 'Pick someone you trust. They only hear from us if you send SOS.'}
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        <Text style={s.label}>BEFORE YOU GO</Text>
        <View style={s.tips}>
          {TIPS.map((t, i) => {
            const Icon = TIP_ICON[t.key]
            return (
              <View key={t.key} style={[s.tip, i > 0 && s.tipBorder]}>
                <View style={s.tipIcon}><Icon size={18} color={Colors.inkPrimary} strokeWidth={1.8} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.tipTitle}>{t.title}</Text>
                  <Text style={s.tipBody}>{t.body}</Text>
                </View>
              </View>
            )
          })}
        </View>
      </View>

      <Pressable style={s.help} onPress={p.onHelp}>
        <LifeBuoy size={20} color={Colors.inkSecondary} strokeWidth={1.7} />
        <View style={{ flex: 1 }}>
          <Text style={s.tipTitle}>Help &amp; FAQ</Text>
          <Text style={s.tipBody}>Get answers or reach support</Text>
        </View>
        <ChevronRight size={18} color={Colors.inkDisabled} />
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  hero: { padding: 20, borderRadius: 24, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, gap: 8 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.destructive },
  liveText: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.destructive },
  heroTitle: { fontFamily: FontFamily.displayExtraBold, fontSize: 26, lineHeight: 30, letterSpacing: -0.6, color: Colors.inkPrimary },
  heroBody: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkSecondary },
  sos: { alignSelf: 'flex-start', marginTop: 10, height: 48, paddingHorizontal: 28, borderRadius: 24 },

  label: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkDisabled },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  count: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary },
  circleBleed: { marginHorizontal: -20 },
  circle: { flexDirection: 'row', gap: 18, paddingHorizontal: 20 },
  person: { alignItems: 'center', gap: 6, width: 60 },
  personName: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkPrimary },
  addCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.inkDisabled, alignItems: 'center', justifyContent: 'center' },
  caption: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 18, color: Colors.inkSecondary },

  tips: { borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, overflow: 'hidden' },
  tip: { flexDirection: 'row', gap: 14, padding: 16 },
  tipBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  tipIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: withOpacity(Colors.inkPrimary, 0.06), alignItems: 'center', justifyContent: 'center' },
  tipTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  tipBody: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 18, color: Colors.inkSecondary, marginTop: 2 },
  help: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
})
