import { useCallback, useState } from 'react'
import { Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Bird, Plus, Share2, Tag } from 'lucide-react-native'
import ApiService, { type EventDeals, type PromoCode } from '@/api/apiService'
import { AppHeader, HeaderIconBtn, PrimaryButton, BrandedLoader, ConfirmSheet } from '@/components/ui'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { usePillStore } from '@/store/pillStore'
import { useProfile } from '@/hooks/useProfile'
import { hSelection, hSuccess, hTap } from '@/lib/haptics'

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

/**
 * A host's deals on one paid event: early bird (the first few tickets for
 * less) and promo codes. Guests get whichever is cheaper, never both, and the
 * ₹50 platform fee is never discounted.
 */
export default function DealsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const showPill = usePillStore(s => s.show)
  const myName = useProfile().profile?.name
  const [deals, setDeals] = useState<EventDeals | null>(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const [d, ev] = await Promise.all([ApiService.getDeals(id), ApiService.getEvent(id)])
      setDeals(d)
      setTitle(ev.title)
    } catch (e: any) {
      showPill(e?.message || "Couldn't load deals", 'error')
    } finally {
      setLoading(false)
    }
  }, [id, showPill])
  useFocusEffect(useCallback(() => { void load() }, [load]))

  const header = (
    <AppHeader
      title="Deals"
      leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
    />
  )
  if (loading || !deals || !id) return <View style={s.root}>{header}<View style={s.center}><BrandedLoader /></View></View>

  return (
    <View style={s.root}>
      {header}
      <KeyboardAwareScrollView contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 40 }]} bottomOffset={24} keyboardShouldPersistTaps="handled">
        <Text style={s.intro}>Full price is {inr(deals.price_inr)}. Deals fill your night faster. Guests get the cheapest one they qualify for, never two at once.</Text>
        <EarlyBirdCard eventId={id} deals={deals} onChange={setDeals} />
        <CodesCard eventId={id} deals={deals} onChange={setDeals} title={title} hostFirst={(myName ?? '').split(' ')[0]} />
      </KeyboardAwareScrollView>
    </View>
  )
}

// ── Early bird ─────────────────────────────────────────────────────────────

function EarlyBirdCard({ eventId, deals, onChange }: { eventId: string; deals: EventDeals; onChange: (d: EventDeals) => void }) {
  const showPill = usePillStore(s => s.show)
  const eb = deals.early_bird
  const [editing, setEditing] = useState(false)
  const [price, setPrice] = useState(eb ? String(eb.price_inr) : String(Math.max(49, Math.round(deals.price_inr * 0.6 / 10) * 10 - 1)))
  const [count, setCount] = useState(eb ? String(eb.count) : '10')
  const [busy, setBusy] = useState(false)
  const [offOpen, setOffOpen] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      onChange(await ApiService.setEarlyBird(eventId, parseInt(price, 10) || 0, parseInt(count, 10) || 0))
      hSuccess()
      setEditing(false)
      showPill('Early bird is on', 'default')
    } catch (e: any) {
      showPill(e?.message || "Couldn't save", 'error')
    } finally {
      setBusy(false)
    }
  }
  const turnOff = async () => {
    setOffOpen(false)
    try {
      onChange(await ApiService.setEarlyBird(eventId, null))
      showPill('Early bird is off', 'default')
    } catch (e: any) {
      showPill(e?.message || "Couldn't turn it off", 'error')
    }
  }

  return (
    <View style={s.card}>
      <View style={s.cardHead}>
        <View style={s.cardIcon}><Bird size={18} color={Colors.inkPrimary} strokeWidth={1.9} /></View>
        <View style={s.flex}>
          <Text style={s.cardTitle}>Early bird</Text>
          <Text style={s.cardSub}>The first few tickets go for less.</Text>
        </View>
      </View>

      {eb && !editing ? (
        <>
          <View style={s.ebNow}>
            <Text style={s.ebPrice}>{inr(eb.price_inr)}</Text>
            <Text style={s.ebFor}>for the first {eb.count} {eb.count === 1 ? 'ticket' : 'tickets'}</Text>
          </View>
          <View style={s.track}><View style={[s.fill, { width: `${Math.min(100, (eb.sold / eb.count) * 100)}%` }]} /></View>
          <Text style={s.trackText}>{eb.left === 0 ? `All ${eb.count} sold. Guests now pay ${inr(deals.price_inr)}.` : `${eb.sold} of ${eb.count} sold · ${eb.left} left`}</Text>
          <View style={s.actions}>
            <Pressable style={s.ghostBtn} onPress={() => { hTap(); setEditing(true) }}><Text style={s.ghostText}>Change</Text></Pressable>
            <Pressable style={s.ghostBtn} onPress={() => { hTap(); setOffOpen(true) }}><Text style={s.ghostText}>Turn off</Text></Pressable>
          </View>
        </>
      ) : editing || !eb ? (
        editing ? (
          <>
            <View style={s.fields}>
              <Field label="Early bird price" prefix="₹" value={price} onChange={setPrice} />
              <Field label="How many tickets" value={count} onChange={setCount} />
            </View>
            <Text style={s.help}>Between ₹49 and {inr(deals.price_inr - 1)}. Tickets already sold at early bird stay sold.</Text>
            <View style={s.actions}>
              <PrimaryButton label="Save" size="small" onPress={save} loading={busy} style={{ flex: 1 }} />
              <Pressable style={s.ghostBtn} onPress={() => { hTap(); setEditing(false) }}><Text style={s.ghostText}>Not now</Text></Pressable>
            </View>
          </>
        ) : (
          <Pressable style={s.addBtn} onPress={() => { hSelection(); setEditing(true) }}>
            <Plus size={16} color={Colors.inkPrimary} strokeWidth={2.2} />
            <Text style={s.addText}>Set up early bird</Text>
          </Pressable>
        )
      ) : null}

      <ConfirmSheet
        visible={offOpen}
        title="Turn off early bird?"
        body="New guests pay full price. Anyone who already bought keeps their early-bird ticket."
        confirmLabel="Turn off"
        onConfirm={turnOff}
        onClose={() => setOffOpen(false)}
      />
    </View>
  )
}

// ── Promo codes ────────────────────────────────────────────────────────────

function CodesCard({ eventId, deals, onChange, title, hostFirst }: { eventId: string; deals: EventDeals; onChange: (d: EventDeals) => void; title: string; hostFirst: string }) {
  const showPill = usePillStore(s => s.show)
  const [adding, setAdding] = useState(false)
  const suggestion = `${(hostFirst || 'GUEST').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)}20`
  const [code, setCode] = useState(suggestion)
  const [kind, setKind] = useState<'percent' | 'amount'>('percent')
  const [value, setValue] = useState('20')
  const [limit, setLimit] = useState('')
  const [busy, setBusy] = useState(false)
  const [stopping, setStopping] = useState<PromoCode | null>(null)

  const n = parseInt(value, 10) || 0
  const preview = kind === 'percent' ? Math.max(0, deals.price_inr - Math.round(deals.price_inr * n / 100)) : Math.max(0, deals.price_inr - n)

  const create = async () => {
    setBusy(true)
    try {
      onChange(await ApiService.createPromoCode(eventId, {
        code,
        ...(kind === 'percent' ? { percent_off: n } : { amount_off: n }),
        max_uses: limit ? parseInt(limit, 10) : null,
      }))
      hSuccess()
      setAdding(false)
      showPill(`${code} is live`, 'default')
    } catch (e: any) {
      showPill(e?.message || "Couldn't create that code", 'error')
    } finally {
      setBusy(false)
    }
  }
  const stop = async () => {
    const c = stopping
    setStopping(null)
    if (!c) return
    try {
      onChange(await ApiService.stopPromoCode(eventId, c.id))
      showPill(`${c.code} stopped`, 'default')
    } catch (e: any) {
      showPill(e?.message || "Couldn't stop it", 'error')
    }
  }
  const share = (c: PromoCode) => {
    hTap()
    void Share.share({ message: `Use code ${c.code} on Gorave to get ${title} tickets for ${inr(c.price_inr)} instead of ${inr(deals.price_inr)}.` })
  }

  return (
    <View style={s.card}>
      <View style={s.cardHead}>
        <View style={s.cardIcon}><Tag size={18} color={Colors.inkPrimary} strokeWidth={1.9} /></View>
        <View style={s.flex}>
          <Text style={s.cardTitle}>Promo codes</Text>
          <Text style={s.cardSub}>Share a code with your crowd, like {suggestion}.</Text>
        </View>
      </View>

      {deals.codes.map(c => (
        <View key={c.id} style={[s.codeRow, !c.active && s.codeOff]}>
          <View style={s.codeChip}><Text style={s.codeText}>{c.code}</Text></View>
          <View style={s.flex}>
            <Text style={s.codeLine}>{c.percent_off ? `${c.percent_off}% off` : `${inr(c.amount_off ?? 0)} off`} · {inr(c.price_inr)}</Text>
            <Text style={s.codeUses}>{!c.active ? 'Stopped · ' : ''}{c.max_uses ? `${c.uses} of ${c.max_uses} used` : `Used ${c.uses} ${c.uses === 1 ? 'time' : 'times'}`}</Text>
          </View>
          {c.active ? (
            <>
              <Pressable onPress={() => share(c)} hitSlop={8} style={s.iconBtn} accessibilityLabel={`Share ${c.code}`}><Share2 size={16} color={Colors.inkPrimary} strokeWidth={2} /></Pressable>
              <Pressable onPress={() => { hTap(); setStopping(c) }} hitSlop={8}><Text style={s.stop}>Stop</Text></Pressable>
            </>
          ) : null}
        </View>
      ))}

      {adding ? (
        <View style={s.form}>
          <Field label="Code" value={code} onChange={t => setCode(t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 20))} caps />
          <View style={s.toggle}>
            {(['percent', 'amount'] as const).map(k => (
              <Pressable key={k} style={[s.toggleOpt, kind === k && s.toggleOn]} onPress={() => { hSelection(); setKind(k); setValue(k === 'percent' ? '20' : '100') }}>
                <Text style={[s.toggleText, kind === k && s.toggleTextOn]}>{k === 'percent' ? '% off' : '₹ off'}</Text>
              </Pressable>
            ))}
          </View>
          <View style={s.fields}>
            <Field label={kind === 'percent' ? 'Percent off' : 'Amount off'} prefix={kind === 'amount' ? '₹' : undefined} suffix={kind === 'percent' ? '%' : undefined} value={value} onChange={setValue} />
            <Field label="Limit uses (optional)" value={limit} onChange={setLimit} placeholder="No limit" />
          </View>
          <Text style={s.help}>Guests with this code pay {inr(preview)} instead of {inr(deals.price_inr)}.</Text>
          <View style={s.actions}>
            <PrimaryButton label="Create code" size="small" onPress={create} loading={busy} disabled={code.length < 3 || !n} style={{ flex: 1 }} />
            <Pressable style={s.ghostBtn} onPress={() => { hTap(); setAdding(false) }}><Text style={s.ghostText}>Cancel</Text></Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={s.addBtn} onPress={() => { hSelection(); setAdding(true) }}>
          <Plus size={16} color={Colors.inkPrimary} strokeWidth={2.2} />
          <Text style={s.addText}>New code</Text>
        </Pressable>
      )}

      <ConfirmSheet
        visible={!!stopping}
        title={`Stop ${stopping?.code ?? 'this code'}?`}
        body="It stops working straight away. Tickets already bought with it are fine."
        confirmLabel="Stop code"
        onConfirm={stop}
        onClose={() => setStopping(null)}
      />
    </View>
  )
}

function Field({ label, value, onChange, prefix, suffix, placeholder, caps }: {
  label: string; value: string; onChange: (t: string) => void; prefix?: string; suffix?: string; placeholder?: string; caps?: boolean
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.input}>
        {prefix ? <Text style={s.affix}>{prefix}</Text> : null}
        <TextInput
          style={[s.inputText, caps && s.inputCaps]}
          value={value}
          onChangeText={caps ? onChange : t => onChange(t.replace(/\D/g, '').slice(0, 6))}
          keyboardType={caps ? 'default' : 'number-pad'}
          autoCapitalize={caps ? 'characters' : 'none'}
          autoCorrect={false}
          placeholder={placeholder}
          placeholderTextColor={Colors.inkDisabled}
        />
        {suffix ? <Text style={s.affix}>{suffix}</Text> : null}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  body: { paddingHorizontal: 20, paddingTop: 6, gap: 16 },
  intro: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkSecondary },

  card: { padding: 16, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, gap: 14 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: withOpacity(Colors.inkPrimary, 0.07), alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
  cardSub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginTop: 1 },

  ebNow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  ebPrice: { fontFamily: FontFamily.displayExtraBold, fontSize: 34, letterSpacing: -1, color: Colors.inkPrimary },
  ebFor: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary },
  track: { height: 6, borderRadius: 3, backgroundColor: withOpacity(Colors.inkPrimary, 0.08), overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: Colors.inkPrimary },
  trackText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary, marginTop: -6 },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ghostBtn: { height: 40, paddingHorizontal: 16, borderRadius: 999, backgroundColor: withOpacity(Colors.inkPrimary, 0.08), alignItems: 'center', justifyContent: 'center' },
  ghostText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: withOpacity(Colors.inkPrimary, 0.25) },
  addText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  help: { fontFamily: FontFamily.bodyRegular, fontSize: 12, lineHeight: 17, color: Colors.inkDisabled, marginTop: -4 },

  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  codeOff: { opacity: 0.45 },
  codeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: withOpacity(Colors.inkPrimary, 0.4) },
  codeText: { fontFamily: FontFamily.headingBold, fontSize: 13, letterSpacing: 1.4, color: Colors.inkPrimary },
  codeLine: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  codeUses: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: withOpacity(Colors.inkPrimary, 0.07), alignItems: 'center', justifyContent: 'center' },
  stop: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.destructive },

  form: { gap: 12, paddingTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  toggle: { flexDirection: 'row', gap: 8 },
  toggleOpt: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.inkPrimary, 0.06) },
  toggleOn: { backgroundColor: Colors.inkPrimary },
  toggleText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkSecondary },
  toggleTextOn: { color: Colors.background },

  fields: { flexDirection: 'row', gap: 10 },
  field: { flex: 1, gap: 6 },
  fieldLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary },
  input: { flexDirection: 'row', alignItems: 'center', height: 48, paddingHorizontal: 12, borderRadius: 12, backgroundColor: Colors.elevated, gap: 4 },
  inputText: { flex: 1, fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary, paddingVertical: 0 },
  inputCaps: { letterSpacing: 1.4 },
  affix: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkSecondary },
})
