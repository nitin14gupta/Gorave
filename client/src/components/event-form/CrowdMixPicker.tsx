import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Minus, Plus } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { CROWD_PRESETS, crowdSplit } from '@/lib/crowdMix'
import { hSelection } from '@/lib/haptics'
import { ef } from './styles'

interface Props {
  womenPct: number | null
  capacity: number
  onChange: (v: number | null) => void
  locked?: boolean
  lockNote?: string
  disabled?: boolean
}

export function CrowdMixPicker({ womenPct, capacity, onChange, locked, lockNote, disabled }: Props) {
  const presetMatch = CROWD_PRESETS.find(p => p.value === womenPct)
  const [custom, setCustom] = useState(!presetMatch)
  const editable = !disabled && !locked
  const split = crowdSplit(capacity, womenPct)

  const pick = (v: number | null) => {
    if (!editable) return
    hSelection()
    setCustom(false)
    onChange(v)
  }

  const step = (delta: number) => {
    if (!editable) return
    hSelection()
    const next = Math.min(90, Math.max(10, (womenPct ?? 50) + delta))
    onChange(next)
  }

  return (
    <>
      <View style={[ef.fieldLabelRow, { marginTop: 20 }]}>
        <Text style={ef.fieldLabel}>Crowd mix</Text>
        {locked && lockNote ? <Text style={ef.fieldLockNote}>{lockNote}</Text> : null}
      </View>
      <View style={[s.chips, locked && ef.sectionLocked]}>
        {CROWD_PRESETS.map(p => {
          const active = !custom && p.value === womenPct
          return (
            <Pressable key={p.key} style={[ef.ageChip, active && ef.ageChipActive]} onPress={() => pick(p.value)}>
              <Text style={[ef.ageText, active && ef.ageTextActive]}>{p.label}</Text>
            </Pressable>
          )
        })}
        <Pressable
          style={[ef.ageChip, custom && ef.ageChipActive]}
          onPress={() => {
            if (!editable) return
            hSelection()
            setCustom(true)
            if (womenPct == null || womenPct === 0 || womenPct === 100) onChange(70)
          }}
        >
          <Text style={[ef.ageText, custom && ef.ageTextActive]}>Custom</Text>
        </Pressable>
      </View>

      {custom && womenPct != null && (
        <View style={s.customRow}>
          <Pressable style={ef.stepperBtn} onPress={() => step(-10)}>
            <Minus size={18} color={Colors.inkPrimary} />
          </Pressable>
          <Text style={s.customValue}>{womenPct}% women · {100 - womenPct}% men</Text>
          <Pressable style={ef.stepperBtn} onPress={() => step(10)}>
            <Plus size={18} color={Colors.inkPrimary} />
          </Pressable>
        </View>
      )}

      <Text style={s.preview}>
        {split
          ? [
              split.women ? `${split.women} women` : null,
              split.men ? `${split.men} men` : null,
              split.open ? `${split.open} open to anyone` : null,
            ].filter(Boolean).join(' · ')
          : 'Anyone can join, no ratio'}
      </Text>
    </>
  )
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  customRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12, padding: 8, borderRadius: 14,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.05),
  },
  customValue: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  preview: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 10 },
})
