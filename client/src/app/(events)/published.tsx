import React, { useEffect, useRef, useState } from 'react'
import {
  Linking,
  Share,
  StyleSheet,
  View,
} from 'react-native'
import { hTap, hSuccess } from '@/lib/haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '@/constants'
import { ConfettiRain, ShareToChatSheet } from '@/components/ui'
import { usePillStore } from '@/store/pillStore'
import ApiService from '@/api/apiService'
import { EventShareCard } from '@/components/events/EventShareCard'
import { InviteBackdrop, PublishedInvite } from '@/components/events/published/PublishedInvite'
import { useImageShare } from '@/hooks/useImageShare'
import { buildEventShareUrl } from '@/lib/deepLink'

function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(iso.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
  return isNaN(d.getTime()) ? null : d
}

function formatDateTime(iso: string | null | undefined) {
  const d = parseDate(iso)
  if (!d) return ''
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PublishedScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const showPill = usePillStore(s => s.show)

  const eventTitle = decodeURIComponent(title ?? 'your event')

  const [coverUrl, setCoverUrl] = useState('')
  const [dateTimeLabel, setDateTimeLabel] = useState('')
  const [area, setArea] = useState('')
  const [priceLabel, setPriceLabel] = useState('')
  const [spots, setSpots] = useState(0)
  const [chatShareOpen, setChatShareOpen] = useState(false)
  const shareCardRef = useRef<View>(null)
  const { shareImage } = useImageShare()

  useEffect(() => {
    if (!id) return
    ApiService.getEvent(id)
      .then(ev => {
        setCoverUrl(ev.cover_photos?.[0]?.url ?? '')
        setDateTimeLabel(formatDateTime(ev.date_time))
        setArea([ev.area, ev.city].filter(Boolean).join(', '))
        setPriceLabel(ev.is_free ? 'Free' : `₹${ev.price_inr.toLocaleString('en-IN')}`)
        setSpots(ev.capacity ?? 0)
      })
      .catch(() => { })
  }, [id])

  const shareUrl = buildEventShareUrl(id)
  const shareText = `Check out "${eventTitle}" on GORAVE! 🔥${dateTimeLabel ? `\n${dateTimeLabel}` : ''}`

  const handleShare = async () => {
    hTap()
    try {
      if (coverUrl) {
        const result = await shareImage(shareCardRef, { message: shareText, title: eventTitle })
        if (result.shared || result.error === 'cancelled') return
      }
      await Share.share({ message: shareText })
    } catch {
      showPill('Could not share right now. Please try again.', 'error')
    }
  }

  // Straight into WhatsApp with the invite text; falls back to the system sheet.
  const shareOnWhatsApp = async () => {
    const url = `whatsapp://send?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`
    try {
      await Linking.openURL(url)
    } catch {
      handleShare()
    }
  }

  const shareInChat = () => {
    hTap()
    setChatShareOpen(true)
  }

  const copyLink = async () => {
    hTap()
    try {
      await Clipboard.setStringAsync(shareUrl)
      showPill('Link copied!', 'default')
    } catch {
      showPill('Could not copy the link. Please try again.', 'error')
    }
  }

  const goToMyEvents = () => {
    hSuccess()
    router.replace('/(settings)/my-events' as any)
  }

  const skipForNow = () => {
    hTap()
    router.replace(`/(events)/${id}` as any)
  }

  return (
    <View style={[s.root, { paddingBottom: insets.bottom + 16 }]}>
      <InviteBackdrop coverUrl={coverUrl} />
      <ConfettiRain />

      <View style={s.content}>
        {(() => {
          const props = {
            title: eventTitle, dateLabel: dateTimeLabel, area, coverUrl, shareUrl,
            onShare: handleShare, onShareInChat: shareInChat, onCopyLink: copyLink, onWhatsApp: shareOnWhatsApp,
            priceLabel, spots,
            onMyEvents: goToMyEvents, onViewEvent: skipForNow,
          }
          return <PublishedInvite {...props} />
        })()}
      </View>

      <ShareToChatSheet
        visible={chatShareOpen}
        onClose={() => setChatShareOpen(false)}
        contentType="event"
        metadata={{ event_id: id, title: eventTitle, date: dateTimeLabel, cover_url: coverUrl || null }}
        previewTitle={eventTitle}
        previewSubtitle={dateTimeLabel}
        previewImage={coverUrl || null}
      />

      {/* Off-screen — captured and shared as an image, never shown to the user */}
      {coverUrl && (
        <View style={s.shareCardHost} pointerEvents="none">
          <EventShareCard
            ref={shareCardRef}
            imageUrl={coverUrl}
            title={eventTitle}
            dateTimeLabel={dateTimeLabel}
          />
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.nearBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareCardHost: { position: 'absolute', top: 0, left: -9999 },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 420,
  },

})
