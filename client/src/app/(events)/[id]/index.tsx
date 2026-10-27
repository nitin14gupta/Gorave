import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { useLocalSearchParams } from 'expo-router'
import { useGoBack } from '@/hooks/useGoBack'
import { useEventDetail } from '@/hooks/useEventDetail'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Ghost, LogOut, TriangleAlert } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { BrandedLoader, BrandedRefreshControl } from '@/components/ui'
import { ConfirmSheet, GuestListSheet, EventShareSheet, DotsSheet } from '@/components/ui'
import { ReportEventSheet } from '@/components/events/ReportEventSheet'
import { EventOptionsSheet } from '@/components/events/EventOptionsSheet'
import { EventHeroControls, EventHeroPhotos } from '@/components/events/EventPhotoHero'
import { EventInfoHeader } from '@/components/events/EventInfoHeader'
import { EventHostCard } from '@/components/events/EventHostCard'
import { EventGuestListPreview } from '@/components/events/EventGuestListPreview'
import { EventDetailsSection } from '@/components/events/EventDetailsSection'
import { EventSafetySection } from '@/components/events/EventSafetySection'
import { useSafetyAgreementGate } from '@/components/safety/useSafetyAgreementGate'
import { EventRsvpBar } from '@/components/events/EventRsvpBar'
import { RequestTries } from '@/components/events/RequestTries'
import { EventCancelledScreen } from '@/components/events/EventCancelledScreen'
import { EventLockedScreen } from '@/components/events/EventLockedScreen'
import { buildEventShareUrl } from '@/lib/deepLink'
import { formatDateTime } from '@/components/events/eventDetailUtils'

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const goBack = useGoBack()
  const d = useEventDetail(id)
  const { runGated, sheet: safetyAgreementSheet } = useSafetyAgreementGate()
  const scrollY = useSharedValue(0)
  const onScroll = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y })

  if (d.loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <BrandedLoader />
      </View>
    )
  }

  if (!d.event) {
    return (
      <View style={[styles.root, styles.center]}>
        <Pressable onPress={goBack} style={[styles.backBtn, { position: 'absolute', top: insets.top + 8, left: 0 }]}>
          <ArrowLeft size={24} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <View style={styles.deletedIconWrap}>
          <Ghost size={40} color={Colors.inkDisabled} strokeWidth={1.5} />
        </View>
        <Text style={styles.deletedTitle}>Event Not Found</Text>
        <Text style={styles.deletedBody}>This event may not exist or has been removed.</Text>
      </View>
    )
  }

  const { event } = d

  if (d.lockedReason) {
    return <EventLockedScreen reason={d.lockedReason} event={event} onBack={() => d.setLockedReason(null)} />
  }

  if (event.is_cancelled) {
    return <EventCancelledScreen event={event} isHost={event.host_id === d.myId} onBack={goBack} />
  }

  const isHost = event.host_id === d.myId

  return (
    <View style={styles.root}>
      {/* One scroll: the 4:5 photo first, then the details sheet sliding up over it */}
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={<BrandedRefreshControl refreshing={d.refreshing} onRefresh={d.handleRefresh} />}
      >
        <EventHeroPhotos event={event} scrollY={scrollY} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetContent}>
            <EventInfoHeader event={event} eventId={id ?? ''} onPressAddress={() => d.setAddressSheetOpen(true)} />

            <EventHostCard event={event} isHost={isHost} />

            <EventGuestListPreview
              guests={d.guests}
              guestTotal={d.guestTotal}
              onPress={() => d.setGuestSheetOpen(true)}
            />

            <EventDetailsSection event={event} eventId={id ?? ''} />

            <EventSafetySection event={event} />
          </View>
        </View>
      </Animated.ScrollView>

      <EventHeroControls
        event={event}
        isHost={isHost}
        topInset={insets.top}
        onBack={goBack}
        onShare={d.handleShare}
        onOptions={() => d.setOptionsOpen(true)}
        onReport={() => d.setReportOpen(true)}
      />

      <EventRsvpBar
        event={event}
        eventId={id ?? ''}
        isHost={isHost}
        rsvpStatus={d.rsvpStatus}
        attendeesCount={d.attendees.length}
        attendeesLoading={d.attendeesLoading}
        isPast={d.isPast}
        isInProgress={d.isInProgress}
        isGoing={d.isGoing}
        isWaitlist={d.isWaitlist}
        hasTicket={d.hasTicket}
        shouldWaitlist={d.shouldWaitlist}
        spotsLow={d.spotsLow}
        offerSecondsLeft={d.offerSecondsLeft}
        bottomInset={insets.bottom}
        onScanner={d.handleScanner}
        onRsvp={() => runGated(d.handleRsvp)}
        onJoinWaitlist={() => runGated(d.handleJoinWaitlist)}
        isRequestMode={d.isRequestMode}
        crowdIneligible={d.crowdIneligible}
        crowdFull={d.crowdFull}
        myBucket={d.myBucket}
        requestBusy={d.requestBusy}
        onWithdrawRequest={() => d.setWithdrawConfirm(true)}
      />

      <EventOptionsSheet
        visible={d.optionsOpen}
        onEdit={d.handleEditEvent}
        onCancel={d.handleCancelEvent}
        onWaitlist={d.handleManageWaitlist}
        onClose={() => d.setOptionsOpen(false)}
        showWaitlist={(event?.waitlist_count ?? 0) > 0}
      />
      <ConfirmSheet
        visible={d.withdrawConfirm}
        icon={<LogOut size={28} color={Colors.destructive} strokeWidth={2} />}
        title="Withdraw your request?"
        body={event.my_requests_left === 0 ? 'Your place in the host’s queue goes, and you won’t be able to request this event again.' : 'Your place in the host’s queue goes. You get one more chance to request this event after this.'}
        confirmLabel="Withdraw"
        cancelLabel="Keep my request"
        destructive
        onConfirm={d.withdrawRequest}
        onClose={() => d.setWithdrawConfirm(false)}
      >
        {event.my_requests_left != null ? (
          <View style={styles.tries}>
            <RequestTries
              left={event.my_requests_left}
              max={event.max_join_requests ?? 2}
              note={event.my_requests_left === 0 ? 'That was your last chance, so you won’t be able to request again.' : 'You’ll get one more chance to request after this.'}
            />
          </View>
        ) : null}
      </ConfirmSheet>
      <ConfirmSheet
        visible={d.lastRequestConfirm}
        icon={<TriangleAlert size={28} color={Colors.inkPrimary} strokeWidth={2} />}
        title="This is your last chance"
        body="You withdrew once already. If you withdraw again, you won’t be able to request this event."
        confirmLabel="Send my last request"
        cancelLabel="Not now"
        onConfirm={() => d.sendRequest({ confirmed: true })}
        onClose={() => d.setLastRequestConfirm(false)}
      >
        <View style={styles.tries}><RequestTries left={1} max={event.max_join_requests ?? 2} /></View>
      </ConfirmSheet>
      <ConfirmSheet
        visible={d.cancelConfirm}
        title="Cancel Event"
        body="Are you sure? Attendees will be notified. This cannot be undone."
        confirmLabel="Cancel Event"
        destructive
        onConfirm={d.doCancelEvent}
        onClose={() => d.setCancelConfirm(false)}
      />
      <ReportEventSheet
        visible={d.reportOpen}
        eventId={id ?? ''}
        onClose={() => d.setReportOpen(false)}
      />
      <DotsSheet
        visible={d.addressSheetOpen}
        title={event.location_name}
        actions={[
          { key: 'copy', label: 'Copy Address' },
          { key: 'maps', label: 'Open in Google Maps' },
        ]}
        onAction={d.handleAddressAction}
        onClose={() => d.setAddressSheetOpen(false)}
      />
      <GuestListSheet
        visible={d.guestSheetOpen}
        eventId={id ?? ''}
        guests={d.guests}
        total={d.guestTotal}
        waitlist={d.guestWaitlist}
        canViewFull={isHost || d.isGoing || d.hasTicket}
        loading={d.guestsLoading}
        onClose={() => d.setGuestSheetOpen(false)}
      />

      <EventShareSheet
        visible={d.shareSheetOpen}
        onClose={() => d.setShareSheetOpen(false)}
        eventId={event.id}
        title={event.title}
        dateTimeLabel={formatDateTime(event.date_time)}
        coverUrl={event.cover_photos?.[0]?.url}
        shareUrl={buildEventShareUrl(event.id)}
        hostName={event.host_name}
        hostAvatarUrl={event.host_avatar}
      />

      {safetyAgreementSheet}
    </View>
  )
}

const styles = StyleSheet.create({
  tries: { padding: 14, borderRadius: 16, backgroundColor: withOpacity(Colors.inkPrimary, 0.05) },
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },

  sheet: {
    minHeight: 600,
    marginTop: -28,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.14),
    marginTop: 10,
  },
  scroll: { flex: 1 },
  sheetContent: { padding: 20, paddingTop: 14 },

  backBtn: { marginTop: 8 },

  deletedIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: Colors.inkDisabled,
  },
  deletedTitle: { fontFamily: FontFamily.headingBold, fontSize: 24, color: Colors.inkPrimary, marginBottom: 8 },
  deletedBody: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary, textAlign: 'center' },
})
