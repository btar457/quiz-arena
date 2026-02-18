import React, { useMemo } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useGame } from "@/lib/game-context";
import { ACHIEVEMENTS, Achievement } from "@/lib/game-data";

function toArabicNumeral(n: number): string {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return n.toString().split("").map(d => arabicDigits[parseInt(d)] || d).join("");
}

function getProgressValue(type: Achievement["type"], profile: { wins: number; gamesPlayed: number; streak: number; xp: number }): number {
  switch (type) {
    case "wins": return profile.wins;
    case "games": return profile.gamesPlayed;
    case "streak": return profile.streak;
    case "xp": return profile.xp;
    default: return 0;
  }
}

function AchievementCard({ achievement, currentValue, index }: { achievement: Achievement; currentValue: number; index: number }) {
  const unlocked = currentValue >= achievement.requirement;
  const progress = Math.min(currentValue / achievement.requirement, 1);

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 60)}>
      <View style={[styles.card, unlocked && styles.cardUnlocked, !unlocked && styles.cardLocked]}>
        {unlocked && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.dark.success} />
          </View>
        )}
        <View style={styles.cardRow}>
          <View style={[styles.iconCircle, { backgroundColor: achievement.color + "20", borderColor: achievement.color + "40" }]}>
            <Ionicons name={achievement.icon as any} size={28} color={achievement.color} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, !unlocked && styles.dimText]}>{achievement.title}</Text>
            <Text style={[styles.cardDesc, !unlocked && styles.dimTextSecondary]}>{achievement.description}</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: unlocked ? Colors.dark.success : achievement.color }]} />
              </View>
              <Text style={styles.progressText}>
                {toArabicNumeral(Math.min(currentValue, achievement.requirement))} / {toArabicNumeral(achievement.requirement)}
              </Text>
            </View>
            <View style={styles.rewardRow}>
              <View style={styles.rewardItem}>
                <Ionicons name="flash" size={14} color={Colors.dark.primary} />
                <Text style={styles.rewardText}>+{toArabicNumeral(achievement.reward.xp)} خبرة</Text>
              </View>
              <View style={styles.rewardItem}>
                <Ionicons name="logo-bitcoin" size={14} color={Colors.dark.gold} />
                <Text style={styles.rewardText}>+{toArabicNumeral(achievement.reward.coins)} عملة</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useGame();

  const achievementData = useMemo(() => {
    return ACHIEVEMENTS.map(a => {
      const current = getProgressValue(a.type, profile);
      return { achievement: a, currentValue: current, unlocked: current >= a.requirement };
    });
  }, [profile]);

  const completedCount = achievementData.filter(a => a.unlocked).length;
  const totalCount = ACHIEVEMENTS.length;
  const overallProgress = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </Pressable>
        <Text style={styles.headerTitle}>الإنجازات</Text>
        <Text style={styles.headerProgress}>{toArabicNumeral(completedCount)} / {toArabicNumeral(totalCount)} مكتمل</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.overallProgressSection}>
          <View style={styles.overallBarBg}>
            <View style={[styles.overallBarFill, { width: `${overallProgress * 100}%` }]} />
          </View>
          <Text style={styles.overallPercentText}>{toArabicNumeral(Math.round(overallProgress * 100))}٪</Text>
        </View>

        {achievementData.map((item, index) => (
          <AchievementCard
            key={item.achievement.id}
            achievement={item.achievement}
            currentValue={item.currentValue}
            index={index}
          />
        ))}

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontFamily: "Rajdhani_700Bold",
    color: Colors.dark.text,
  },
  headerProgress: {
    fontSize: 14,
    fontFamily: "Rajdhani_600SemiBold",
    color: Colors.dark.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  overallProgressSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  overallBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 5,
    overflow: "hidden",
  },
  overallBarFill: {
    height: "100%",
    backgroundColor: Colors.dark.primary,
    borderRadius: 5,
  },
  overallPercentText: {
    fontSize: 14,
    fontFamily: "Rajdhani_600SemiBold",
    color: Colors.dark.primary,
    minWidth: 40,
    textAlign: "right",
  },
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    position: "relative",
  },
  cardUnlocked: {
    borderColor: Colors.dark.success + "40",
    backgroundColor: Colors.dark.card,
  },
  cardLocked: {
    opacity: 0.75,
  },
  checkBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 1,
  },
  cardRow: {
    flexDirection: "row",
    gap: 14,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: "Rajdhani_700Bold",
    color: Colors.dark.text,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: "Rajdhani_500Medium",
    color: Colors.dark.textSecondary,
    marginBottom: 10,
  },
  dimText: {
    color: Colors.dark.textSecondary,
  },
  dimTextSecondary: {
    color: Colors.dark.textMuted,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: "Rajdhani_600SemiBold",
    color: Colors.dark.textMuted,
    minWidth: 50,
    textAlign: "right",
  },
  rewardRow: {
    flexDirection: "row",
    gap: 16,
  },
  rewardItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rewardText: {
    fontSize: 12,
    fontFamily: "Rajdhani_500Medium",
    color: Colors.dark.textSecondary,
  },
});
