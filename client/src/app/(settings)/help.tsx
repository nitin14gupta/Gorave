import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { router } from 'expo-router'
import { ChevronDown, HeadphonesIcon, ChevronRight } from 'lucide-react-native'
import { ParallaxScreen, POSTER } from '@/components/ui/ParallaxScreen'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity, SUPPORT_EMAIL } from '@/constants'

type Topic = 'Events' | 'Payments' | 'People' | 'Safety' | 'Account'

const FAQS: { topic: Topic; q: string; a: string }[] = [
  { topic: 'Events', q: 'How do I join a free event?', a: 'Free events are request to join. Tap Request to join on the event, and the host accepts or passes. You will get a notification either way.' },
  { topic: 'Events', q: 'What is the waitlist?', a: 'When an event is full you can join the waitlist. If a spot opens, the next person in line gets it.' },
  { topic: 'Events', q: 'Where is my ticket?', a: 'Open the event you are going to and tap your ticket. The host scans its QR code at the door.' },
  { topic: 'Payments', q: 'How do refunds work?', a: 'Refunds from Gorave go to your Gorave Wallet as credits. Credits can be used on any Gorave event and expire 6 months after you get them.' },
  { topic: 'Events', q: 'Can I cancel my spot?', a: 'Yes, from your ticket. A free event can be cancelled up to 2 hours before it starts. A paid ticket can be cancelled up to 48 hours before: the ticket price goes back to your wallet and the ₹50 platform fee is kept. If the host cancels, or moves the event by more than a week, you get everything back, fee included.' },
  { topic: 'Payments', q: 'I want my money back in my bank', a: `Write to us from Contact support or at ${SUPPORT_EMAIL} and we will help.` },
  { topic: 'People', q: 'What are Vibers and Vibing?', a: 'Vibers are people who follow you. Vibing is the people you follow.' },
  { topic: 'People', q: 'What is a vibe?', a: 'A vibe is how you start a chat. Send one from someone\'s profile; once they accept, the chat opens.' },
  { topic: 'People', q: 'How do I report or block someone?', a: 'Open their profile, tap the three dots at the top, then Report or Block.' },
  { topic: 'Safety', q: 'What does SOS do?', a: 'At an event you have joined, SOS texts your emergency contacts once, with a map link to where you are. It is not a call or a live track. If you are in danger, call 112.' },
  { topic: 'Safety', q: 'Who sees my phone number?', a: 'No one. Your number is never shown on your profile.' },
  { topic: 'Account', q: 'How do I change my city or photos?', a: 'Settings, then Edit profile. Tap Change next to your city, or Change photos on the cover.' },
  { topic: 'Account', q: 'How do I delete my account?', a: `Settings, then Account, then Delete account at the bottom. You confirm your number with a code and type DELETE. Changed your mind? Email ${SUPPORT_EMAIL} within 30 days.` },
]

const TOPICS: ('All' | Topic)[] = ['All', 'Events', 'Payments', 'People', 'Safety', 'Account']

export default function HelpScreen() {
  const [topic, setTopic] = useState<'All' | Topic>('All')
  const [open, setOpen] = useState<string | null>(null)
  const list = topic === 'All' ? FAQS : FAQS.filter(f => f.topic === topic)

  return (
    <ParallaxScreen
      image={POSTER.squad}
      eyebrow="HELP & FAQ"
      title="How can we help?"
      subtitle="Quick answers about events, payments and staying safe."
      onBack={() => router.back()}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsBleed} contentContainerStyle={s.chips}>
        {TOPICS.map(t => (
          <Pressable key={t} style={[s.chip, topic === t && s.chipOn]} onPress={() => { hTap(); setTopic(t); setOpen(null) }}>
            <Text style={[s.chipText, topic === t && s.chipTextOn]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={s.list}>
        {list.map((f, i) => {
          const isOpen = open === f.q
          return (
            <Pressable key={f.q} style={[s.item, i > 0 && s.itemBorder]} onPress={() => { hTap(); setOpen(isOpen ? null : f.q) }}>
              <View style={s.qRow}>
                <Text style={s.q}>{f.q}</Text>
                <ChevronDown size={18} color={Colors.inkDisabled} style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
              </View>
              {isOpen ? <Animated.Text entering={FadeIn.duration(180)} style={s.a}>{f.a}</Animated.Text> : null}
            </Pressable>
          )
        })}
      </View>

      <Pressable style={s.support} onPress={() => router.push('/(settings)/support' as any)}>
        <View style={s.supportIcon}><HeadphonesIcon size={18} color={Colors.inkPrimary} strokeWidth={1.8} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.q}>Still stuck?</Text>
          <Text style={s.supportSub}>Write to us. We reply within 24 hours.</Text>
        </View>
        <ChevronRight size={18} color={Colors.inkDisabled} />
      </Pressable>
    </ParallaxScreen>
  )
}

const s = StyleSheet.create({
  chipsBleed: { marginHorizontal: -20 },
  chips: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  chip: { paddingHorizontal: 14, height: 36, borderRadius: 18, justifyContent: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  chipOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  chipText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
  chipTextOn: { color: Colors.background },

  list: { borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, overflow: 'hidden' },
  item: { paddingHorizontal: 16, paddingVertical: 15, gap: 8 },
  itemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  q: { flex: 1, fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  a: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 21, color: Colors.inkSecondary },

  support: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8, padding: 16, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  supportIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: withOpacity(Colors.inkPrimary, 0.06), alignItems: 'center', justifyContent: 'center' },
  supportSub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginTop: 2 },
})
