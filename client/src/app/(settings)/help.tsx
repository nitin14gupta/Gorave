import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { router } from 'expo-router'
import { ArrowLeft, BadgeCheck, ChevronDown, ChevronRight, CreditCard, HeadphonesIcon, PartyPopper, Search, ShieldCheck, UserCog, Users, X } from 'lucide-react-native'
import { AppHeader, HeaderIconBtn } from '@/components/ui'
import { hSelection, hTap } from '@/lib/haptics'
import { Colors, FontFamily, Spacing, withOpacity, SUPPORT_EMAIL } from '@/constants'

type Topic = 'Events' | 'Hosting' | 'Payments' | 'People' | 'Safety' | 'Account'

const TOPICS: { key: Topic; Icon: typeof PartyPopper; blurb: string }[] = [
  { key: 'Events', Icon: PartyPopper, blurb: 'Joining, tickets, cancelling' },
  { key: 'Hosting', Icon: BadgeCheck, blurb: 'Becoming a host, your ID check' },
  { key: 'Payments', Icon: CreditCard, blurb: 'Refunds and your wallet' },
  { key: 'People', Icon: Users, blurb: 'Vibes, following, blocking' },
  { key: 'Safety', Icon: ShieldCheck, blurb: 'SOS and your privacy' },
  { key: 'Account', Icon: UserCog, blurb: 'Profile, city, deleting' },
]

const FAQS: { topic: Topic; q: string; a: string; popular?: boolean }[] = [
  { topic: 'Events', q: 'How do I join a free event?', a: 'Free events are request to join. Tap Request to join on the event, and the host accepts or passes. You will get a notification either way.', popular: true },
  { topic: 'Events', q: 'What is the waitlist?', a: 'When an event is full you can join the waitlist. If a spot opens, the next person in line gets it.' },
  { topic: 'Events', q: 'Where is my ticket?', a: 'Open the event you are going to and tap your ticket. The host scans its QR code at the door.', popular: true },
  { topic: 'Events', q: 'Can I cancel my spot?', a: 'Yes, from your ticket. A free event can be cancelled up to 2 hours before it starts. A paid ticket can be cancelled up to 48 hours before: the ticket price goes back to your wallet and the ₹50 platform fee is kept. If the host cancels, or moves the event by more than a week, you get everything back, fee included.', popular: true },
  { topic: 'Hosting', q: 'How do I become a host?', a: 'Tap Create. First you verify your ID with your PAN, then set up how you get paid and sign the host agreement. After that you can create your first night.', popular: true },
  { topic: 'Hosting', q: 'Why do you need my PAN?', a: 'Every host on Gorave shows a real ID, so guests know who they are going to. We check your PAN with the Income Tax records and keep only the last 4 characters. Guests never see it.' },
  { topic: 'Hosting', q: 'How long does the ID check take?', a: 'The PAN check is instant. Then a person on our team reviews it, usually in less than a day. You get a notification as soon as it is done.' },
  { topic: 'Hosting', q: 'My PAN was not accepted. What now?', a: 'You will see why on the Verify screen. Fix it and try again: everyone gets two tries. After that, write to us from Contact support and a person will sort it out with you.' },
  { topic: 'Payments', q: 'How do refunds work?', a: 'Refunds from Gorave go to your Gorave Wallet as credits. Credits can be used on any Gorave event and expire 6 months after you get them.', popular: true },
  { topic: 'Payments', q: 'I want my money back in my bank', a: `Write to us from Contact support or at ${SUPPORT_EMAIL} and we will help.` },
  { topic: 'People', q: 'What are Vibers and Vibing?', a: 'Vibers are people who follow you. Vibing is the people you follow.' },
  { topic: 'People', q: 'What is a vibe?', a: 'A vibe is how you start a chat. Send one from someone\'s profile; once they accept, the chat opens.' },
  { topic: 'People', q: 'How do I report or block someone?', a: 'Open their profile, tap the three dots at the top, then Report or Block.' },
  { topic: 'Safety', q: 'What does SOS do?', a: 'At an event you have joined, SOS texts your emergency contacts once, with a map link to where you are. It is not a call or a live track. If you are in danger, call 112.' },
  { topic: 'Safety', q: 'Who sees my phone number?', a: 'No one. Your number is never shown on your profile.' },
  { topic: 'Account', q: 'How do I change my city or photos?', a: 'Settings, then Edit profile. Tap Change next to your city, or Change photos on the cover.' },
  { topic: 'Account', q: 'How do I delete my account?', a: `Settings, then Account, then Delete account at the bottom. You confirm your number with a code and type DELETE. Changed your mind? Email ${SUPPORT_EMAIL} within 30 days. You can't delete it while you're hosting an event or have a ticket to one that hasn't ended yet.` },
]

function Answers({ items, open, onToggle }: { items: typeof FAQS; open: string | null; onToggle: (q: string) => void }) {
  return (
    <View style={s.list}>
      {items.map((f, i) => {
        const isOpen = open === f.q
        return (
          <Pressable key={f.q} style={[s.item, i > 0 && s.itemBorder]} onPress={() => onToggle(f.q)} accessibilityRole="button" accessibilityState={{ expanded: isOpen }}>
            <View style={s.qRow}>
              <Text style={s.q}>{f.q}</Text>
              <ChevronDown size={18} color={Colors.inkDisabled} style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
            </View>
            {isOpen ? <Animated.Text entering={FadeIn.duration(180)} style={s.a}>{f.a}</Animated.Text> : null}
          </Pressable>
        )
      })}
    </View>
  )
}

/** Help centre: search everything, browse by topic, or write to us. */
export default function HelpScreen() {
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState<Topic | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const toggle = (q: string) => { hTap(); setOpen(o => (o === q ? null : q)) }

  const needle = query.trim().toLowerCase()
  const results = useMemo(
    () => (needle ? FAQS.filter(f => `${f.q} ${f.a} ${f.topic}`.toLowerCase().includes(needle)) : []),
    [needle],
  )
  const counts = useMemo(() => Object.fromEntries(TOPICS.map(t => [t.key, FAQS.filter(f => f.topic === t.key).length])), [])

  return (
    <View style={s.root}>
      <AppHeader
        title="Help"
        leftAction={<HeaderIconBtn onPress={() => (topic && !needle ? setTopic(null) : router.back())}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={s.title}>How can we help?</Text>

        <View style={s.search}>
          <Search size={17} color={Colors.inkSecondary} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={t => { setQuery(t); setOpen(null) }}
            placeholder="Search refunds, tickets, hosting…"
            placeholderTextColor={Colors.inkDisabled}
            style={s.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <X size={16} color={Colors.inkSecondary} strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>

        {needle ? (
          results.length ? (
            <>
              <Text style={s.label}>{results.length} {results.length === 1 ? 'ANSWER' : 'ANSWERS'}</Text>
              <Answers items={results} open={open} onToggle={toggle} />
            </>
          ) : (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>Nothing for “{query.trim()}”</Text>
              <Text style={s.emptyBody}>Try another word, or ask us directly. A real person answers.</Text>
            </View>
          )
        ) : topic ? (
          <>
            <Pressable style={s.crumb} onPress={() => { hTap(); setTopic(null) }}>
              <Text style={s.crumbText}>All topics</Text>
              <ChevronRight size={14} color={Colors.inkDisabled} strokeWidth={2} />
              <Text style={[s.crumbText, s.crumbNow]}>{topic}</Text>
            </Pressable>
            <Answers items={FAQS.filter(f => f.topic === topic)} open={open} onToggle={toggle} />
          </>
        ) : (
          <>
            <Text style={s.label}>BROWSE BY TOPIC</Text>
            <View style={s.grid}>
              {TOPICS.map(({ key, Icon, blurb }) => (
                <Pressable key={key} style={s.tile} onPress={() => { hSelection(); setTopic(key); setOpen(null) }} accessibilityRole="button">
                  <View style={s.tileIcon}><Icon size={18} color={Colors.inkPrimary} strokeWidth={1.8} /></View>
                  <Text style={s.tileTitle}>{key}</Text>
                  <Text style={s.tileBlurb} numberOfLines={2}>{blurb}</Text>
                  <Text style={s.tileCount}>{counts[key]} answers</Text>
                </Pressable>
              ))}
            </View>
            <Text style={s.label}>POPULAR QUESTIONS</Text>
            <Answers items={FAQS.filter(f => f.popular)} open={open} onToggle={toggle} />
          </>
        )}

        <Pressable style={s.support} onPress={() => { hTap(); router.push('/(settings)/support' as any) }} accessibilityRole="button">
          <View style={s.supportIcon}><HeadphonesIcon size={18} color={Colors.inkPrimary} strokeWidth={1.8} /></View>
          <View style={s.supportText}>
            <Text style={s.supportTitle}>Still stuck?</Text>
            <Text style={s.supportSub}>Write to us. A real person replies within 1 to 2 business days.</Text>
          </View>
          <ChevronRight size={18} color={Colors.inkDisabled} />
        </Pressable>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingTop: 8, paddingBottom: 40 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 32, lineHeight: 36, letterSpacing: -0.8, color: Colors.inkPrimary },

  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, marginTop: 18, paddingHorizontal: 16, borderRadius: 25, backgroundColor: Colors.surface },
  searchInput: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkPrimary, paddingVertical: 0 },

  label: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkDisabled, marginTop: 28, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48.4%', padding: 14, borderRadius: 20, backgroundColor: Colors.surface, gap: 4 },
  tileIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.inkPrimary, 0.06), marginBottom: 8 },
  tileTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  tileBlurb: { fontFamily: FontFamily.bodyRegular, fontSize: 12, lineHeight: 16, color: Colors.inkSecondary, minHeight: 32 },
  tileCount: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.inkDisabled, marginTop: 4 },

  crumb: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 24, marginBottom: 12 },
  crumbText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
  crumbNow: { fontFamily: FontFamily.bodySemiBold, color: Colors.inkPrimary },

  list: { borderRadius: 20, backgroundColor: Colors.surface, overflow: 'hidden' },
  item: { paddingHorizontal: 16, paddingVertical: 15, gap: 8 },
  itemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  q: { flex: 1, fontFamily: FontFamily.bodySemiBold, fontSize: 15, lineHeight: 20, color: Colors.inkPrimary },
  a: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 21, color: Colors.inkSecondary },

  empty: { marginTop: 28, padding: 20, borderRadius: 20, backgroundColor: Colors.surface, gap: 6 },
  emptyTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.inkPrimary },
  emptyBody: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkSecondary },

  support: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 24, padding: 16, borderRadius: 20, backgroundColor: Colors.surface },
  supportIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: withOpacity(Colors.inkPrimary, 0.06), alignItems: 'center', justifyContent: 'center' },
  supportText: { flex: 1, gap: 2 },
  supportTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  supportSub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 18, color: Colors.inkSecondary },
})
