import React, { useCallback, useRef, useState } from 'react'
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontFamily, withOpacity } from '@/constants'

// ── DateTimePickerSheet (iOS sheet wrapper) ───────────────────────────────

interface SheetProps {
  visible: boolean
  mode: 'date' | 'time'
  value: Date
  onConfirm: (date: Date) => void
  onDismiss: () => void
  minimumDate?: Date
  maximumDate?: Date
}

export function DateTimePickerSheet({
  visible,
  mode,
  value,
  onConfirm,
  onDismiss,
  minimumDate,
  maximumDate,
}: SheetProps) {
  const insets = useSafeAreaInsets()
  const slideAnim = useRef(new Animated.Value(400)).current
  const [localDate, setLocalDate] = useState(value)

  React.useEffect(() => {
    setLocalDate(value)
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start()
    } else {
      slideAnim.setValue(400)
    }
  }, [visible, value])

  const dismiss = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 220,
      useNativeDriver: true,
    }).start(onDismiss)
  }

  const confirm = () => {
    onConfirm(localDate)
    dismiss()
  }

  // On Android the picker renders as a native dialog — no sheet needed.
  if (Platform.OS === 'android') {
    if (!visible) return null
    return (
      <DateTimePicker
        value={value}
        mode={mode}
        display="default"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={(event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'set' && date) onConfirm(date)
          else onDismiss()
        }}
      />
    )
  }

  // iOS: slide-up sheet with spinner picker + Done button
  if (!visible) return null
  return (
    <Modal transparent visible animationType="none" onRequestClose={dismiss}>
      <Pressable style={s.backdrop} onPress={dismiss} />
      <Animated.View
        style={[
          s.sheet,
          { paddingBottom: insets.bottom + 8, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={s.handle} />
        <Text style={s.eyebrow}>{mode === 'date' ? 'PICK A DATE' : 'PICK A TIME'}</Text>
        <Text style={s.value}>
          {mode === 'date'
            ? localDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
            : localDate.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
        </Text>
        <DateTimePicker
          value={localDate}
          mode={mode}
          display="spinner"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          textColor={Colors.inkPrimary}
          themeVariant="dark"
          onChange={(_: DateTimePickerEvent, date?: Date) => {
            if (date) setLocalDate(date)
          }}
          style={{ height: 200, alignSelf: 'stretch' }}
        />
        <View style={s.actions}>
          <Pressable onPress={dismiss} style={[s.btn, s.cancel]}>
            <Text style={s.cancelTxt}>Cancel</Text>
          </Pressable>
          <Pressable onPress={confirm} style={[s.btn, s.done]}>
            <Text style={s.doneTxt}>Done</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  )
}

// ── useDateTimePicker hook ────────────────────────────────────────────────

export function useDateTimePicker(initial?: Date) {
  const [visible, setVisible]   = useState(false)
  const [mode,    setMode]      = useState<'date' | 'time'>('date')
  const [value,   setValue]     = useState<Date>(initial ?? new Date())
  const resolveRef = useRef<((d: Date) => void) | null>(null)

  const open = useCallback((m: 'date' | 'time', seed?: Date): Promise<Date> => {
    if (seed) setValue(seed)
    setMode(m)
    setVisible(true)
    return new Promise(res => { resolveRef.current = res })
  }, [])

  const confirm = useCallback((d: Date) => {
    setValue(d)
    setVisible(false)
    resolveRef.current?.(d)
    resolveRef.current = null
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    resolveRef.current?.(value)
    resolveRef.current = null
  }, [value])

  return { visible, mode, value, setValue, open, confirm, dismiss }
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: withOpacity(Colors.background, 0.55),
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.18),
    marginBottom: 14,
  },
  eyebrow: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkDisabled },
  value: { fontFamily: FontFamily.displayExtraBold, fontSize: 26, letterSpacing: -0.6, color: Colors.inkPrimary, marginTop: 4, marginBottom: 4 },
  actions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 12 },
  btn: { flex: 1, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  done: { backgroundColor: Colors.inkPrimary },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  cancelTxt: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.inkPrimary },
  doneTxt: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.background },
})
