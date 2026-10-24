import type { ReactNode } from 'react'
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Camera } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { ProfileEditPhotoStrip } from '@/components/profile/ProfileEditPhotoStrip'
import type { PhotoResponse } from '@/types/api'

const W = Dimensions.get('window').width

export interface EditLayoutProps {
  photos?: PhotoResponse[]
  name: string
  bio: string
  city: string | null
  interests: string[]
  /** The existing form sections, in order. */
  nameField: ReactNode
  usernameField: ReactNode
  bioField: ReactNode
  cityField: ReactNode
  badgeField: ReactNode
  interestField: ReactNode
  voiceField: ReactNode
}

const goPhotos = () => router.push('/(profile)/edit-photos' as any)

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={s.card}>
      {title ? <Text style={s.cardTitle}>{title}</Text> : null}
      {children}
    </View>
  )
}

/**
 * Cover first. Your first photo, square at full width, is the top of the
 * page with a "Change photos" button on it; the rest of the form sits in
 * grouped cards underneath.
 */
export function EditLayout(p: EditLayoutProps) {
  const first = p.photos?.[0]
  return (
    <View style={{ gap: 14 }}>
      <Pressable style={s.cover} onPress={goPhotos}>
        {first ? <Image source={first.url} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : <Camera size={32} color={Colors.inkDisabled} />}
        <View style={s.coverBtn}><Camera size={14} color={Colors.white} strokeWidth={2.2} /><Text style={s.coverBtnText}>Change photos</Text></View>
      </Pressable>
      <Card title="Photos"><ProfileEditPhotoStrip photos={p.photos} /></Card>
      <Card title="Basics">{p.nameField}{p.usernameField}{p.bioField}{p.cityField}</Card>
      <Card>{p.badgeField}</Card>
      <Card>{p.interestField}</Card>
      <Card title="Voice intro">{p.voiceField}</Card>
    </View>
  )
}

const s = StyleSheet.create({
  cover: { width: W - 40, height: W - 40, borderRadius: 28, overflow: 'hidden', backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  coverBtn: { position: 'absolute', right: 14, bottom: 14, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.55)' },
  coverBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.white },
  card: { padding: 16, borderRadius: 22, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, gap: 18 },
  cardTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.3, textTransform: 'uppercase', color: Colors.inkDisabled },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  manage: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkSecondary },

})
