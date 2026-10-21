import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { hSuccess } from '@/lib/haptics'
import { Colors } from '@/constants'
import ApiService, { type EventDetail } from '@/api/apiService'
import { invalidate } from '@/lib/queryCache'
import { CacheKeys } from '@/constants'
import { usePillStore } from '@/store/pillStore'
import { BrandedLoader } from '@/components/ui'
import { NotCheckedInGate, ReviewSuccessState } from '@/components/reviews/ReviewSubmitParts'
import { RateNightView } from '@/components/reviews/RateNightView'

const MAX_BODY = 300

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const showPill = usePillStore(s => s.show)

  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [checkedIn, setCheckedIn] = useState<boolean | null>(null)
  const [done, setDone] = useState(false)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (!id) return
    ApiService.getEvent(id)
      .then(ev => {
        setEvent(ev)
        setCheckedIn(!!ev.my_checked_in_at)
      })
      .catch(() => showPill("Couldn't load this event", 'error'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async () => {
    if (rating === 0) { showPill('Pick a star rating first', 'error'); return }
    if (submitting) return
    setSubmitting(true)
    try {
      await ApiService.submitReview(id!, rating, body.trim() || undefined)
      invalidate(CacheKeys.homeJoinedEvents)
      hSuccess()
      setDone(true)
      let secs = 5
      const tick = setInterval(() => {
        secs -= 1
        setCountdown(secs)
        if (secs <= 0) {
          clearInterval(tick)
          router.replace(`/(events)/${id}` as any)
        }
      }, 1000)
    } catch (e: any) {
      const msg = e?.message || "Couldn't submit review, try again"
      showPill(msg, 'error')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <BrandedLoader />
      </View>
    )
  }

  if (checkedIn === false) {
    return <NotCheckedInGate onBack={() => router.back()} />
  }

  if (done) {
    return (
      <View style={[s.root, s.center]}>
        <ReviewSuccessState countdown={countdown} onBack={() => router.replace(`/(events)/${id}` as any)} />
      </View>
    )
  }

  return (
    <View style={s.root}>
      <RateNightView
        event={event}
        rating={rating}
        onRate={setRating}
        body={body}
        onBody={setBody}
        maxBody={MAX_BODY}
        submitting={submitting}
        onSubmit={handleSubmit}
        onBack={() => router.back()}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
