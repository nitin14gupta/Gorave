import React from "react";
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, FontFamily } from '@/constants';
import type { EventSummary } from "@/api/apiService";

const CARD_MARGIN = 10;
/** One row card per swipe, the next one peeking in. */
export const COMPACT_CARD_W = Dimensions.get("window").width - 56;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// "N more events" tail card in preview strip
export function MoreCard({ count, onPress }: { count: number; onPress: () => void }) {
  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));

  return (
    <AnimatedPressable
      style={[styles.moreCard, pressStyle]}
      onPress={onPress}
      onPressIn={() => { pressScale.set(withSpring(0.97, { duration: 120 })); }}
      onPressOut={() => { pressScale.set(withSpring(1, { duration: 120 })); }}
    >
      <Text style={styles.moreCount}>+{count}</Text>
      <Text style={styles.moreLabel}>more{"\n"}events</Text>
    </AnimatedPressable>
  );
}

export function EventPreviewStrip({
  previewListRef,
  previewEvents,
  extraCount,
  paddingBottom,
  renderPreviewCard,
  onMorePress,
}: {
  previewListRef: React.RefObject<FlatList<EventSummary> | null>;
  previewEvents: EventSummary[];
  extraCount: number;
  paddingBottom: number;
  renderPreviewCard: ({ item }: { item: EventSummary }) => React.ReactElement;
  onMorePress: () => void;
}) {
  return (
    <View style={[styles.previewStrip, { paddingBottom }]}>
      <LinearGradient
        colors={['transparent', 'rgba(6,6,6,0.72)', 'rgba(6,6,6,0.94)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <FlatList
        ref={previewListRef}
        data={previewEvents}
        horizontal
        keyExtractor={(e) => e.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={COMPACT_CARD_W + CARD_MARGIN}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 14, gap: CARD_MARGIN }}
        onScrollToIndexFailed={() => { }}
        ListFooterComponent={
          extraCount > 0 ? (
            <MoreCard count={extraCount} onPress={onMorePress} />
          ) : null
        }
        renderItem={renderPreviewCard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  previewStrip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 32,
  },
  moreCard: {
    width: 80,
    height: "100%",
    alignSelf: "stretch",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  moreCount: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
  },
  moreLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.inkSecondary,
    textAlign: "center",
  },
});
