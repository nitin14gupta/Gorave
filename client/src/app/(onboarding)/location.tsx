import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { OutlineButton, StepDots, PrimaryButton, Screen, GlowLinesBackground } from '@/components/ui'
import { CityPickerView } from '@/components/profile/CityPickerView'
import { useLocation } from '@/hooks/useLocation'
import { Colors, FontFamily, Spacing } from '@/constants'

export default function LocationScreen() {
  const {
    filtered, query, setQuery, selectedCity, loading, detecting,
    citiesLoading, citiesError, retryCities, selectCity, detectLocation, handleContinue,
  } = useLocation()

  return (
    <View style={styles.rootWrap}>
      <GlowLinesBackground />
      <Screen transparent>
        <CityPickerView
          embedded
          title="Where are you based?"
          subtitle="We'll show you events and people near you"
          cities={filtered}
          query={query}
          onQuery={setQuery}
          selected={selectedCity}
          onSelect={selectCity}
          detecting={detecting}
          onDetect={detectLocation}
          empty={
            citiesLoading ? null : (
              <View style={styles.emptyState}>
                {citiesError ? (
                  <>
                    <Text style={styles.emptyTitle}>Couldn&apos;t load cities</Text>
                    <Text style={styles.emptyBody}>Check your connection and try again</Text>
                    <PrimaryButton label="Retry" onPress={retryCities} style={styles.emptyBtn} />
                  </>
                ) : query ? (
                  <>
                    <Text style={styles.emptyTitle}>No cities match &quot;{query}&quot;</Text>
                    <PrimaryButton label="Clear search" onPress={() => setQuery('')} style={styles.emptyBtn} />
                  </>
                ) : null}
              </View>
            )
          }
          footer={
            <>
              <StepDots step={5} />
              <View style={styles.footer}>
                <OutlineButton label="Back" onPress={() => router.back()} style={styles.backBtn} />
                <View style={styles.nextBtn}>
                  <PrimaryButton label="Continue" onPress={handleContinue} disabled={!selectedCity} loading={loading} />
                </View>
              </View>
            </>
          }
        />
      </Screen>
    </View>
  )
}

const styles = StyleSheet.create({
  rootWrap: { flex: 1, backgroundColor: Colors.background },
  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: Spacing.screenPadding, paddingBottom: 16 },
  backBtn: { width: 96 },
  nextBtn: { flex: 1 },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary, marginBottom: 6, textAlign: 'center' },
  emptyBody: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginBottom: 20, textAlign: 'center' },
  emptyBtn: { width: '100%', marginTop: 16 },
})
