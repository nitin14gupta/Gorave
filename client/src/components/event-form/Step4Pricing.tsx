import React, { useEffect } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { Bird, Plus, Tag, X } from 'lucide-react-native'
import { Colors, PLATFORM_FEE_INR, HOST_COMMISSION_RATE, HOST_COMMISSION_PERCENT_LABEL, withOpacity } from '@/constants'
import type { CreateEventForm } from '@/hooks/useCreateEvent'
import { ef } from './styles'
import { usePillStore } from '@/store/pillStore'
import { MAX_OFF_PCT, earlyBirdFloor, earlyBirdMaxSpots } from '@/lib/dealRules'

interface Props {
  form: CreateEventForm
  set: <K extends keyof CreateEventForm>(key: K, value: CreateEventForm[K]) => void
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  submitError?: string | null
  /** Lock price/free toggle (attendees already booked) */
  priceLocked?: boolean
  priceLockNote?: string
  disabled?: boolean
  scrollable?: boolean
  /** Monthly free event slot info */
  freeUsed?: number
  resetsOn?: string
  /** Create flow only: early bird and promo code next to the price. Editing uses the event's Deals screen. */
  showDeals?: boolean
}


function Inner({ form, set, errors, setErrors, submitError, priceLocked, priceLockNote, disabled, freeUsed = 0, resetsOn = '', showDeals = false }: Omit<Props, 'scrollable'>) {
  const showPill = usePillStore.getState().show
  const effectivelyLocked = disabled || priceLocked
  const slotsExhausted = freeUsed >= 2

  // Auto-switch to Paid if free slots are exhausted
  useEffect(() => {
    if (slotsExhausted && form.isFree) {
      set('isFree', false)
    }
  }, [slotsExhausted])

  // Format resets_on as "Jul 1"
  const resetsOnFormatted = resetsOn
    ? new Date(resetsOn).toLocaleDateString([], { month: 'short', day: 'numeric' })
    : ''

  return (
    <>
      {/* Pricing card */}
      <View style={ef.fieldLabelRow}>
        <Text style={ef.fieldLabel}>Pricing</Text>
        {priceLocked && priceLockNote && <Text style={ef.fieldLockNote}>{priceLockNote}</Text>}
      </View>
      <View style={[ef.pricingCard, priceLocked && s.lockedSection]}>
        <View style={ef.pricingToggle}>
          <Pressable
            style={[ef.pricingBtn, form.isFree && ef.pricingBtnActive, slotsExhausted && s.freeDisabled]}
            onPress={() => {
              if (slotsExhausted) {
                const msg = resetsOnFormatted
                  ? `Free events reset on ${resetsOnFormatted}`
                  : "You've used your 2 free events this month"
                showPill(msg, 'error')
                return
              }
              if (!effectivelyLocked) { set('isFree', true); set('priceInr', 0) }
            }}
          >
            <Text style={[ef.pricingBtnText, form.isFree && ef.pricingBtnTextActive]}>Free</Text>
          </Pressable>
          <Pressable
            style={[ef.pricingBtn, !form.isFree && ef.pricingBtnActive]}
            onPress={() => { if (!effectivelyLocked) set('isFree', false) }}
          >
            <Text style={[ef.pricingBtnText, !form.isFree && ef.pricingBtnTextActive]}>Paid</Text>
          </Pressable>
        </View>

        {!form.isFree && (
          <View style={[ef.inputWrap, { marginTop: 12 }, errors.priceInr && ef.inputWrapError]}>
            <Text style={ef.currencySymbol}>₹</Text>
            <TextInput
              style={[ef.textInput, { flex: 1 }]}
              value={form.priceInr > 0 ? String(form.priceInr) : ''}
              onChangeText={v => { const n = parseInt(v, 10); set('priceInr', isNaN(n) ? 0 : n); setErrors(e => ({ ...e, priceInr: '' })) }}
              placeholder="Ticket price"
              placeholderTextColor={Colors.glassTextDisabled}
              keyboardType="numeric"
              editable={!effectivelyLocked}
            />
          </View>
        )}
        {errors.priceInr ? <Text style={ef.errorText}>{errors.priceInr}</Text> : null}

        {form.isFree ? (
          <View style={s.feeBreakdown}>
            <Text style={s.feeBreakdownText}>
              Free events are request-to-join — guests ask, you accept or decline each one,
              so free spots can&apos;t all get grabbed at once.
            </Text>
          </View>
        ) : null}

        {!form.isFree && form.priceInr > 0 ? (
          <View style={s.feeBreakdown}>
            <Text style={s.feeBreakdownText}>
              Attendees pay ₹{form.priceInr + PLATFORM_FEE_INR} total
              (₹{form.priceInr} ticket + ₹{PLATFORM_FEE_INR} platform fee). You receive
              ₹{form.priceInr - Math.round(form.priceInr * HOST_COMMISSION_RATE)} after our {HOST_COMMISSION_PERCENT_LABEL} platform commission.
            </Text>
          </View>
        ) : null}
      </View>

      {/* Deals: optional, right where the price is set. Edit later from the event's Deals. */}
      {showDeals && !form.isFree && form.priceInr >= 99 && !priceLocked ? (
        <>
          <View style={[ef.fieldLabelRow, { marginTop: 22 }]}>
            <Text style={ef.fieldLabel}>Deals</Text>
            <Text style={ef.fieldLockNote}>Optional</Text>
          </View>
          <View style={ef.pricingCard}>
            <View style={s.dealHead}>
              <View style={s.dealIcon}><Bird size={17} color={Colors.inkPrimary} strokeWidth={1.9} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.dealTitle}>Early bird</Text>
                <Text style={s.dealSub}>The first few tickets go for less. Fills nights faster.</Text>
              </View>
              <Switch
                value={form.earlyBirdOn}
                onValueChange={v => {
                  set('earlyBirdOn', v)
                  if (v && !form.earlyBirdPrice) set('earlyBirdPrice', Math.max(earlyBirdFloor(form.priceInr), Math.round(form.priceInr * 0.7 / 10) * 10 - 1))
                  if (v) set('earlyBirdCount', Math.min(form.earlyBirdCount || 10, earlyBirdMaxSpots(form.capacity)))
                  setErrors(e => ({ ...e, earlyBird: '' }))
                }}
                trackColor={{ false: Colors.divider, true: Colors.inkPrimary }}
                thumbColor={Colors.white}
                disabled={disabled}
              />
            </View>
            {form.earlyBirdOn ? (
              <View style={s.dealFields}>
                <DealInput label="Price" prefix="₹" value={form.earlyBirdPrice} onChange={n => { set('earlyBirdPrice', n); setErrors(e => ({ ...e, earlyBird: '' })) }} />
                <DealInput label="How many tickets" value={form.earlyBirdCount} onChange={n => { set('earlyBirdCount', n); setErrors(e => ({ ...e, earlyBird: '' })) }} />
              </View>
            ) : null}
            {form.earlyBirdOn && errors.earlyBird ? <Text style={ef.errorText}>{errors.earlyBird}</Text> : null}
            {form.earlyBirdOn && !errors.earlyBird && form.earlyBirdPrice > 0 ? (
              <Text style={s.dealNote}>First {form.earlyBirdCount} pay ₹{form.earlyBirdPrice}, then ₹{form.priceInr}. Up to half off, for up to half the seats.</Text>
            ) : null}

            <View style={s.dealDivider} />

            <View style={s.dealHead}>
              <View style={s.dealIcon}><Tag size={17} color={Colors.inkPrimary} strokeWidth={1.9} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.dealTitle}>Promo code</Text>
                <Text style={s.dealSub}>A code for your crowd, like RIYA20.</Text>
              </View>
              <Switch
                value={form.promoOn}
                onValueChange={v => { set('promoOn', v); setErrors(e => ({ ...e, promo: '' })) }}
                trackColor={{ false: Colors.divider, true: Colors.inkPrimary }}
                thumbColor={Colors.white}
                disabled={disabled}
              />
            </View>
            {form.promoOn ? (
              <View style={s.dealFields}>
                <View style={{ flex: 1.3, gap: 6 }}>
                  <Text style={s.dealLabel}>Code</Text>
                  <View style={s.dealInput}>
                    <TextInput
                      style={[s.dealText, { letterSpacing: 1.2 }]}
                      value={form.promoCode}
                      onChangeText={t => { set('promoCode', t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 20)); setErrors(e => ({ ...e, promo: '' })) }}
                      placeholder="RIYA20"
                      placeholderTextColor={Colors.inkDisabled}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>
                </View>
                <DealInput label="% off" suffix="%" value={form.promoPercent} onChange={n => { set('promoPercent', Math.min(MAX_OFF_PCT, n)); setErrors(e => ({ ...e, promo: '' })) }} />
              </View>
            ) : null}
            {form.promoOn && errors.promo ? <Text style={ef.errorText}>{errors.promo}</Text> : null}
            {form.promoOn && !errors.promo && form.promoPercent > 0 ? (
              <Text style={s.dealNote}>With the code, guests pay ₹{form.priceInr - Math.round(form.priceInr * form.promoPercent / 100)}. Up to {MAX_OFF_PCT}% off; guests get the cheapest deal, never two.</Text>
            ) : null}
          </View>
        </>
      ) : null}

      {submitError ? (
        <View style={s.submitError}>
          <Text style={s.submitErrorText}>{submitError}</Text>
        </View>
      ) : null}
    </>
  )
}

function DealInput({ label, value, onChange, prefix, suffix }: { label: string; value: number; onChange: (n: number) => void; prefix?: string; suffix?: string }) {
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text style={s.dealLabel}>{label}</Text>
      <View style={s.dealInput}>
        {prefix ? <Text style={s.dealAffix}>{prefix}</Text> : null}
        <TextInput
          style={s.dealText}
          value={value > 0 ? String(value) : ''}
          onChangeText={t => { const n = parseInt(t.replace(/\D/g, ''), 10); onChange(isNaN(n) ? 0 : n) }}
          keyboardType="number-pad"
          maxLength={6}
        />
        {suffix ? <Text style={s.dealAffix}>{suffix}</Text> : null}
      </View>
    </View>
  )
}

export function Step4Pricing({ scrollable = true, ...props }: Props) {
  if (!scrollable) {
    return <View><Inner {...props} /></View>
  }
  return (
    <ScrollView style={ef.stepScroll} contentContainerStyle={ef.stepContent} keyboardShouldPersistTaps="handled">
      <Text style={ef.stepTitle}>Pricing</Text>
      <Text style={ef.stepSub}>Set a ticket price or keep it free</Text>
      <Inner {...props} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  dealHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dealIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: withOpacity(Colors.inkPrimary, 0.08), alignItems: 'center', justifyContent: 'center' },
  dealTitle: { fontFamily: 'Satoshi-Bold', fontSize: 15, color: Colors.inkPrimary },
  dealSub: { fontFamily: 'Satoshi-Regular', fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
  dealFields: { flexDirection: 'row', gap: 10, marginTop: 12 },
  dealLabel: { fontFamily: 'Satoshi-Medium', fontSize: 12, color: Colors.inkSecondary },
  dealInput: { flexDirection: 'row', alignItems: 'center', height: 46, paddingHorizontal: 12, borderRadius: 12, backgroundColor: withOpacity(Colors.inkPrimary, 0.06), gap: 4 },
  dealText: { flex: 1, fontFamily: 'CabinetGrotesk-Bold', fontSize: 17, color: Colors.inkPrimary, paddingVertical: 0 },
  dealAffix: { fontFamily: 'CabinetGrotesk-Bold', fontSize: 17, color: Colors.inkSecondary },
  dealNote: { fontFamily: 'Satoshi-Medium', fontSize: 12, color: Colors.inkSecondary, marginTop: 8 },
  dealDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider, marginVertical: 14 },
  lockedSection: { opacity: 0.45 },
  uploadOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: withOpacity(Colors.background, 0.45),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitError: {
    backgroundColor: withOpacity(Colors.destructive, 0.15),
    borderRadius: 10, padding: 12, marginTop: 12,
    borderWidth: 1, borderColor: Colors.destructive,
  },
  submitErrorText: { color: Colors.destructive, fontFamily: 'Satoshi-Medium', fontSize: 13 },
  freeDisabled: { opacity: 0.35 },
  feeBreakdown: {
    marginTop: 10,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.05),
    borderRadius: 10,
    padding: 10,
  },
  feeBreakdownText: {
    color: Colors.glassTextSecondary,
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    lineHeight: 17,
  },
})
