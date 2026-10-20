import type { ReactNode } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors, FontFamily } from '@/constants'
import { PrimaryButton } from './PrimaryButton'
import { LogoMark } from './LogoMark'

interface Props {
  icon?: ReactNode
  title: string
  subtitle?: string
  ctaLabel?: string
  onCtaPress?: () => void
  ctaIcon?: ReactNode
  compact?: boolean
  /** Kept for existing call sites; icons are always still now. */
  staticIcon?: boolean
}

export function EmptyState({ icon, title, subtitle, ctaLabel, onCtaPress, ctaIcon, compact }: Props) {
  const resolvedIcon = icon ?? <LogoMark size={64} opacity={0.12} />
  return (
    <View style={[s.wrap, compact && s.wrapCompact]}>
      {resolvedIcon}
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      {ctaLabel && onCtaPress ? (
        <PrimaryButton label={ctaLabel} onPress={onCtaPress} size="small" style={s.cta} icon={ctaIcon} />
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 24 },
  wrapCompact: { paddingVertical: 24 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary, textAlign: 'center' },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, textAlign: 'center' },
  cta: { marginTop: 4 },
})
