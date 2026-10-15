import { memo } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Check, X } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hTap } from '@/lib/haptics'
import type { JoinRequest } from '@/api/apiService'

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return `${mins}m ago`
  const h = Math.floor(mins / 60)
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
}

const GENDER_SHORT: Record<string, string> = { Male: 'M', Female: 'F', 'Non-binary': 'NB' }

interface Props {
  request: JoinRequest
  busy: boolean
  disabled: boolean
  onAccept: (r: JoinRequest) => void
  onDecline: (r: JoinRequest) => void
}

export const JoinRequestRow = memo(function JoinRequestRow({ request: r, busy, disabled, onAccept, onDecline }: Props) {
  const router = useRouter()
  const meta = [
    r.age ? `${r.age}${r.gender && GENDER_SHORT[r.gender] ? ` · ${GENDER_SHORT[r.gender]}` : ''}` : null,
    r.city,
    timeAgo(r.requested_at),
  ].filter(Boolean).join(' · ')
  const signals = [
    r.attended_your_events ? 'Came to your events' : null,
    r.mutual_count > 0 ? `${r.mutual_count} mutual` : null,
    r.events_attended > 0 ? `${r.events_attended} events attended` : null,
    r.is_following ? 'You follow them' : null,
  ].filter(Boolean)

  return (
    <View style={s.row}>
      <Pressable style={s.person} onPress={() => { hTap(); router.push(`/(profile)/${r.id}` as any) }}>
        {r.avatar ? (
          <Image source={{ uri: r.avatar }} style={s.avatar} contentFit="cover" cachePolicy="memory-disk" transition={150} />
        ) : (
          <View style={[s.avatar, s.avatarFallback]}>
            <Text style={s.avatarInitial}>{(r.name ?? '?')[0].toUpperCase()}</Text>
          </View>
        )}
        <View style={s.info}>
          <Text style={s.name} numberOfLines={1}>{r.name ?? 'Unknown'}</Text>
          <Text style={s.meta} numberOfLines={1}>{meta}</Text>
          {signals.length > 0 && <Text style={s.signals} numberOfLines={1}>{signals.join(' · ')}</Text>}
          {!r.can_accept && <Text style={s.full}>No spot left for their share</Text>}
        </View>
      </Pressable>

      {busy ? (
        <ActivityIndicator color={Colors.inkSecondary} />
      ) : (
        <View style={s.actions}>
          <Pressable
            style={[s.iconBtn, s.declineBtn]}
            onPress={() => onDecline(r)}
            disabled={disabled}
            hitSlop={6}
          >
            <X size={18} color={Colors.inkSecondary} strokeWidth={2.4} />
          </Pressable>
          <Pressable
            style={[s.iconBtn, s.acceptBtn, (!r.can_accept || disabled) && s.btnDisabled]}
            onPress={() => onAccept(r)}
            disabled={!r.can_accept || disabled}
            hitSlop={6}
          >
            <Check size={18} color={Colors.background} strokeWidth={2.6} />
          </Pressable>
        </View>
      )}
    </View>
  )
})

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.divider,
    padding: 12, marginBottom: 10, gap: 10,
  },
  person: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarFallback: { backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  info: { flex: 1 },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  meta: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 2 },
  signals: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.accentGreen, marginTop: 3 },
  full: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.accentGold, marginTop: 3 },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  declineBtn: { borderWidth: 1, borderColor: Colors.divider },
  acceptBtn: { backgroundColor: Colors.inkPrimary },
  btnDisabled: { opacity: 0.3 },
})
