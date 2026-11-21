import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Flame, Plus } from "lucide-react-native";
import { Colors, FontFamily } from "@/constants";
import { PrimaryButton } from "@/components/ui";
import { TemplateFan } from "@/components/home/TemplateFan";
import { hTap } from "@/lib/haptics";

export function MapErrorOverlay({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.mapEmpty} pointerEvents="box-none">
      <View style={styles.mapEmptyCard}>
        <Text style={styles.mapEmptyTitle}>Couldn&apos;t load events</Text>
        <PrimaryButton label="Retry" size="small" style={styles.mapEmptyCta} onPress={() => { hTap(); onRetry() }} />
      </View>
    </View>
  );
}

/** Nothing here: a filter is hiding things, or the city is waiting for its first host. */
export function emptyCopy(city: string | null | undefined, filtered: boolean) {
  return filtered
    ? { title: 'Nothing matches that filter', sub: 'Try another one, or host the night you were looking for' }
    : { title: `Be the first to host${city ? ` in ${city}` : ' here'}`, sub: 'Pick a template, set a date, and your night is live' }
}

export function MapEmptyOverlay({ onCreate, city, filtered = false }: { onCreate: () => void; city?: string | null; filtered?: boolean }) {
  const copy = emptyCopy(city, filtered)
  return (
    <View style={styles.mapEmpty} pointerEvents="box-none">
      <View style={styles.mapEmptyCard}>
        <Flame size={28} color={Colors.inkDisabled} strokeWidth={1.5} />
        <Text style={styles.mapEmptyTitle}>{copy.title}</Text>
        <PrimaryButton
          label="Create one"
          size="small"
          style={styles.mapEmptyCta}
          onPress={onCreate}
        />
      </View>
    </View>
  );
}

export function ListErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={[styles.listEmpty, { flex: 1 }]}>
      <Text style={styles.listEmptyTitle}>Couldn&apos;t load events</Text>
      <Text style={styles.listEmptySub}>Check your connection and try again</Text>
      <PrimaryButton label="Retry" size="small" style={styles.listEmptyCta} onPress={() => { hTap(); onRetry() }} />
    </View>
  );
}

export function ListEmptyState({ onCreate, city, filtered = false, onClearFilter }: { onCreate: () => void; city?: string | null; filtered?: boolean; onClearFilter?: () => void }) {
  const copy = emptyCopy(city, filtered)
  return (
    // Centering within the space left below the header+chips row lands
    // visually low (that leftover region's own middle sits well under the
    // screen's true vertical middle) — nudge up so the fan reads as
    // centered on the screen, not just on its flex parent.
    <View style={[styles.listEmpty, { flex: 1 }, styles.listEmptyFanShift]}>
      <TemplateFan onCreatePress={onCreate} />
      <Text style={styles.listEmptyTitle}>{copy.title}</Text>
      <Text style={styles.listEmptySub}>{copy.sub}</Text>
      {filtered && onClearFilter ? (
        <Text style={styles.listEmptyClear} onPress={() => { hTap(); onClearFilter() }}>Show all events</Text>
      ) : null}
      <PrimaryButton
        label="Create Event"
        size="small"
        style={styles.listEmptyCta}
        icon={<Plus size={16} color={Colors.background} strokeWidth={2.5} />}
        onPress={onCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listEmptyClear: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary, textDecorationLine: 'underline', marginTop: 10 },
  mapEmpty: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  mapEmptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 10,
    marginHorizontal: 40,
  },
  mapEmptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  mapEmptyCta: { marginTop: 4 },
  listEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  listEmptyFanShift: { marginTop: -70 },
  listEmptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  listEmptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary },
  listEmptyCta: { marginTop: 8 },
});
