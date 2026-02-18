import React from "react";
import { StyleSheet, Text, View, ScrollView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useGame } from "@/lib/game-context";
import { RANK_TIERS, getRankFromXP } from "@/lib/game-data";

export default function RanksScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useGame();
  const currentRank = getRankFromXP(profile.xp);

  let accXP = 0;
  const allRanks: { tier: string; level: number; label: string; color: string; icon: string; minXP: number; maxXP: number; isCurrent: boolean; isUnlocked: boolean }[] = [];
  for (const t of RANK_TIERS) {
    for (let lvl = 1; lvl <= t.levels; lvl++) {
      const min = accXP;
      const max = accXP + 200;
      const label = t.tier === "mastermind" ? "نابغة" : `${t.label} ${lvl}`;
      allRanks.push({
        tier: t.tier,
        level: lvl,
        label,
        color: t.color,
        icon: t.icon,
        minXP: min,
        maxXP: max,
        isCurrent: currentRank.label === label,
        isUnlocked: profile.xp >= min,
      });
      accXP += 200;
    }
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 100 }]}
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.title}>سلّم التصنيف</Text>
          <Text style={styles.subtitle}>تسلّق عبر ٢٦ رتبة للوصول إلى النابغة</Text>
        </Animated.View>

        {allRanks.reverse().map((rank, idx) => (
          <Animated.View key={`${rank.tier}-${rank.level}`} entering={FadeInDown.duration(300).delay(idx * 40)}>
            <View style={[
              styles.rankRow,
              rank.isCurrent && { borderColor: rank.color, borderWidth: 2 },
              !rank.isUnlocked && { opacity: 0.4 },
            ]}>
              <View style={styles.rankLeft}>
                <View style={[styles.rankIcon, { backgroundColor: rank.color + "20", borderColor: rank.color + "40" }]}>
                  <Ionicons name={rank.icon as any} size={20} color={rank.color} />
                </View>
                <View>
                  <Text style={[styles.rankName, { color: rank.isUnlocked ? rank.color : Colors.dark.textMuted }]}>{rank.label}</Text>
                  <Text style={styles.rankXP}>{rank.minXP} - {rank.maxXP} نقطة خبرة</Text>
                </View>
              </View>
              {rank.isCurrent && (
                <View style={[styles.currentBadge, { backgroundColor: rank.color + "25" }]}>
                  <Text style={[styles.currentText, { color: rank.color }]}>أنت</Text>
                </View>
              )}
              {rank.isUnlocked && !rank.isCurrent && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.dark.success} />
              )}
              {!rank.isUnlocked && (
                <Ionicons name="lock-closed" size={16} color={Colors.dark.textMuted} />
              )}
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 28,
    color: Colors.dark.text,
    marginTop: 12,
  },
  subtitle: {
    fontFamily: "Rajdhani_400Regular",
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 20,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  rankLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rankIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  rankName: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 16,
  },
  rankXP: {
    fontFamily: "Rajdhani_400Regular",
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  currentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 12,
  },
});
