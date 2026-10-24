import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, TextInput, Pressable, BackHandler } from 'react-native'
import { OnboardingShell, OnboardingNext } from '@/components/onboarding/OnboardingShell'
import { POSTER } from '@/components/ui/ParallaxScreen'
import { hSelection } from '@/lib/haptics'
import { router } from 'expo-router'
import { useFocusEffect } from 'expo-router'
import { DateTimePickerSheet, useDateTimePicker } from '@/components/ui'
import { BioField } from '@/components/ui/BioField'
import { useOnboardingStore } from '@/store/onboarding'
import { createProfile } from '@/api/user'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { usePillStore } from '@/store/pillStore'
import { CalendarDays } from 'lucide-react-native'


const MIN_DOB_DATE = new Date(new Date().setFullYear(new Date().getFullYear() - 100))
const MAX_DOB_DATE = new Date(new Date().setFullYear(new Date().getFullYear() - 18))
const MIN_NAME_LENGTH = 2
const MIN_BIO_LENGTH = 10

export default function ProfileScreen() {
  const store = useOnboardingStore()
  const showPill = usePillStore(s => s.show)
  const datePicker = useDateTimePicker(MAX_DOB_DATE)
  const [loading, setLoading] = useState(false)
  const [dobError, setDobError] = useState('')

  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true)
    return () => sub.remove()
  }, []))

  const canProceed = store.name.trim().length >= MIN_NAME_LENGTH && store.dob.replace(/\D/g, '').length === 8 && !!store.gender && !dobError && (store.bio?.trim().length ?? 0) >= MIN_BIO_LENGTH

  const validateDOB = (dob: string): string => {
    const digits = dob.replace(/\D/g, '')
    if (digits.length < 8) return 'Enter your full date of birth'
    const day = parseInt(digits.slice(0, 2), 10)
    const month = parseInt(digits.slice(2, 4), 10)
    const year = parseInt(digits.slice(4, 8), 10)
    if (month < 1 || month > 12) return 'Invalid month, must be 01 to 12'
    const daysInMonth = new Date(year, month, 0).getDate()
    if (day < 1 || day > daysInMonth) return `Invalid day for this month`
    const today = new Date()
    const birth = new Date(year, month - 1, day)
    if (year < 1900 || birth > today) return 'Invalid date'
    let age = today.getFullYear() - birth.getFullYear()
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
    if (age < 18) return 'You must be 18 or older to use Gorave'
    return ''
  }

  const handleDOBChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 8)
    let formatted = digits
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)} / ${digits.slice(2, 4)} / ${digits.slice(4)}`
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)} / ${digits.slice(2)}`
    }
    store.setField('dob', formatted)
    if (dobError) setDobError(digits.length === 8 ? validateDOB(formatted) : '')
  }

  const handleDOBBlur = () => {
    if (store.dob) setDobError(validateDOB(store.dob))
  }

  const handlePickedDate = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, '0')
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const yyyy = String(date.getFullYear())
    const formatted = `${dd} / ${mm} / ${yyyy}`
    store.setField('dob', formatted)
    setDobError(validateDOB(formatted))
  }

  const dobToISO = (dob: string): string => {
    const d = dob.replace(/\D/g, '')
    return `${d.slice(4, 8)}-${d.slice(2, 4)}-${d.slice(0, 2)}`
  }

  const handleNext = async () => {
    if (store.name.trim().length < MIN_NAME_LENGTH) { showPill(`Name must be at least ${MIN_NAME_LENGTH} characters`, 'error'); return }
    const dobErr = validateDOB(store.dob)
    if (dobErr) { setDobError(dobErr); showPill(dobErr, 'error'); return }
    if (!store.gender) { showPill('Select your gender', 'error'); return }
    if ((store.bio?.trim().length ?? 0) < MIN_BIO_LENGTH) { showPill(`Bio must be at least ${MIN_BIO_LENGTH} characters`, 'error'); return }
    setLoading(true)
    try {
      await createProfile({
        name: store.name.trim(),
        dob: dobToISO(store.dob),
        gender: store.gender,
        bio: store.bio?.trim() || undefined,
      })
      router.push('/(onboarding)/photos')
    } catch (e: any) {
      const msg = e?.status === 400 ? (e.message || 'You must be 18+ to use Gorave.') : 'Something went wrong. Please try again.'
      showPill(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <OnboardingShell
        step={1}
        poster={POSTER.girlsNight}
        title={'Tell us\nabout you'}
        sub="Your name and age show on your profile. Gender is set once."
        footer={<OnboardingNext onPress={handleNext} loading={loading} />}
      >
        <TextInput
          value={store.name}
          onChangeText={v => store.setField('name', v)}
          placeholder="Your name"
          placeholderTextColor={withOpacity(Colors.inkPrimary, 0.2)}
          autoCapitalize="words"
          style={styles.bigInput}
        />
        <View style={styles.rule} />

        <View style={styles.dobRow}>
          <TextInput
            value={store.dob}
            onChangeText={handleDOBChange}
            onBlur={handleDOBBlur}
            placeholder="DD / MM / YYYY"
            placeholderTextColor={withOpacity(Colors.inkPrimary, 0.2)}
            keyboardType="number-pad"
            style={[styles.bigInput, { flex: 1 }]}
          />
          <Pressable style={styles.calBtn} onPress={() => datePicker.open('date', datePicker.value)} hitSlop={8}>
            <CalendarDays size={18} color={Colors.inkPrimary} strokeWidth={1.8} />
          </Pressable>
        </View>
        <View style={[styles.rule, dobError ? { backgroundColor: Colors.destructive } : null]} />
        <Text style={dobError ? styles.error : styles.hint}>{dobError || 'Date of birth. You must be 18 or older.'}</Text>

        <Text style={styles.label}>I AM</Text>
        <View style={styles.chips}>
          {GENDERS.map(g => {
            const on = store.gender === g
            return (
              <Pressable key={g} style={[styles.chip, on && styles.chipOn]} onPress={() => { hSelection(); store.setField('gender', g) }}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{g}</Text>
              </Pressable>
            )
          })}
        </View>

        <Text style={styles.label}>A LINE ABOUT YOU</Text>
        <BioField value={store.bio} onChangeText={v => store.setField('bio', v)} />
      </OnboardingShell>

      <DateTimePickerSheet
        visible={datePicker.visible}
        mode="date"
        value={datePicker.value}
        minimumDate={MIN_DOB_DATE}
        maximumDate={MAX_DOB_DATE}
        onConfirm={(date) => { datePicker.confirm(date); handlePickedDate(date) }}
        onDismiss={datePicker.dismiss}
      />
    </View>
  )
}

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'] as const

const styles = StyleSheet.create({
  bigInput: { fontFamily: FontFamily.displayExtraBold, fontSize: 28, letterSpacing: -0.5, color: Colors.inkPrimary, paddingVertical: 4 },
  rule: { height: 2, borderRadius: 1, backgroundColor: withOpacity(Colors.inkPrimary, 0.15), marginTop: 4 },
  dobRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22 },
  calBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: withOpacity(Colors.inkPrimary, 0.06), alignItems: 'center', justifyContent: 'center' },
  hint: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkDisabled, marginTop: 8 },
  error: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.destructive, marginTop: 8 },
  label: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkDisabled, marginTop: 26, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, height: 40, borderRadius: 20, justifyContent: 'center', borderWidth: 1, borderColor: Colors.divider, backgroundColor: Colors.surface },
  chipOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  chipText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  chipTextOn: { color: Colors.background },
})
