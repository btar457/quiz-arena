import React, { useState, useMemo } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useGame } from "@/lib/game-context";
import { generateLeaderboard, getRankFromXP, getCurrentSeason, getSeasonDaysLeft } from "@/lib/game-data";

const TABS = [
  { key: "daily", label: "يومي" },
  { key: "weekly", label: "أسبوعي" },
  { key: "all", label: "الكل" },
];

const PODIUM_COLORS = ["#C0C0C0", "#FFD700", "#CD7F32"];

function LeaderboardItem({ item, index, isPlayer }: { item: { name: string; xp: number; rank: ReturnType<typeof getRankFromXP> }; index: number; isPlayer: boolean }) {
  const position = index + 1;
  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 40)}>
      <View style={[styles.listItem, isPlayer && styles.listItemHighlight]}>
        <View style={[styles.positionCircle, isPlayer && { backgroundColor: Colors.dark.primary + "30" }]}>
          <Text style={[styles.positionNumber, isPlayer && { color: Colors.dark.primary }]}>{position}</Text>
        </View>
        <View style={[styles.listAvatar, { borderColor: item.rank.color }]}>
          <Text style={[styles.listAvatarText, { color: item.rank.color }]}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.listInfo}>
          <Text style={[styles.listName, isPlayer && { color: Colors.dark.primary }]}>{item.name}</Text>
          <View style={[styles.rankBadge, { backgroundColor: item.rank.color + "20" }]}>
            <Text style={[styles.rankBadgeText, { color: item.rank.color }]}>{item.rank.label}</Text>
          </View>
        </View>
        <Text style={styles.listXp}>{item.xp.toLocaleString()}</Text>
      </View>
    </Animated.View>
  );
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useGame();
  const [activeTab, setActiveTab] = useState("daily");
  const season = getCurrentSeason();
  const daysLeft = getSeasonDaysLeft();

  const leaderboard = useMemo(() => {
    return generateLeaderboard(profile.name, profile.xp);
  }, [profile.name, profile.xp, activeTab]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumPositions = top3.length >= 3 ? [2, 1, 3] : top3.map((_, i) => i + 1);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </Pressable>
        <Text style={styles.title}>لوحة المتصدرين</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 40 }}
      >
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.seasonBanner}>
          <Ionicons name={season.icon as any} size={22} color={season.color} />
          <View style={styles.seasonInfo}>
            <Text style={styles.seasonName}>{season.name}</Text>
            <Text style={styles.seasonDays}>متبقي {daysLeft} يوم</Text>
          </View>
          <View style={[styles.seasonTimer, { backgroundColor: season.color + "20" }]}>
            <Ionicons name="time-outline" size={14} color={season.color} />
            <Text style={[styles.seasonTimerText, { color: season.color }]}>{daysLeft}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.tabRow}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.podiumContainer}>
          {podiumOrder.map((player, i) => {
            const pos = podiumPositions[i];
            const isFirst = pos === 1;
            const avatarSize = isFirst ? 72 : 56;
            const podiumHeight = isFirst ? 90 : pos === 2 ? 65 : 50;
            const crownColor = pos === 1 ? "#FFD700" : pos === 2 ? "#C0C0C0" : "#CD7F32";
            const crownIcon = pos === 1 ? "trophy" : "medal";
            const isPlayer = player.name === profile.name;

            return (
              <View key={pos} style={styles.podiumPlayer}>
                <View style={styles.podiumAvatarContainer}>
                  {pos <= 2 && (
                    <View style={[styles.crownBadge, { backgroundColor: crownColor + "30" }]}>
                      <Ionicons name={crownIcon as any} size={pos === 1 ? 20 : 16} color={crownColor} />
                    </View>
                  )}
                  {pos === 3 && (
                    <View style={[styles.crownBadge, { backgroundColor: crownColor + "30" }]}>
                      <Ionicons name="medal" size={16} color={crownColor} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.podiumAvatar,
                      {
                        width: avatarSize,
                        height: avatarSize,
                        borderRadius: avatarSize / 2,
                        borderColor: crownColor,
                        borderWidth: isFirst ? 3 : 2,
                      },
                      isPlayer && { shadowColor: Colors.dark.primary, shadowOpacity: 0.6, shadowRadius: 12 },
                    ]}
                  >
                    <Text style={[styles.podiumAvatarText, { fontSize: isFirst ? 28 : 22, color: crownColor }]}>
                      {player.name.charAt(0)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.podiumName, isPlayer && { color: Colors.dark.primary }]} numberOfLines={1}>
                  {player.name}
                </Text>
                <Text style={styles.podiumXp}>{player.xp.toLocaleString()}</Text>
                <View style={[styles.podiumBar, { height: podiumHeight, backgroundColor: crownColor + "25", borderColor: crownColor + "50" }]}>
                  <Text style={[styles.podiumPosition, { color: crownColor }]}>{pos}</Text>
                </View>
              </View>
            );
          })}
        </Animated.View>

        <View style={styles.listContainer}>
          {rest.map((item, idx) => (
            <LeaderboardItem
              key={idx}
              item={item}
              index={idx + 3}
              isPlayer={item.name === profile.name}
            />
          ))}
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.card,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 22,
    color: Colors.dark.text,
  },
  seasonBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.card,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 12,
  },
  seasonInfo: {
    flex: 1,
  },
  seasonName: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 15,
    color: Colors.dark.text,
  },
  seasonDays: {
    fontFamily: "Rajdhani_400Regular",
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  seasonTimer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  seasonTimerText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 14,
  },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: Colors.dark.primary,
  },
  tabText: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
  tabTextActive: {
    color: "#0B1121",
  },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginHorizontal: 16,
    marginBottom: 24,
    paddingTop: 30,
  },
  podiumPlayer: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  podiumAvatarContainer: {
    alignItems: "center",
    marginBottom: 4,
  },
  crownBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 6,
  },
  podiumAvatar: {
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  podiumAvatarText: {
    fontFamily: "Rajdhani_700Bold",
  },
  podiumName: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 13,
    color: Colors.dark.text,
    maxWidth: 90,
    textAlign: "center",
  },
  podiumXp: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  podiumBar: {
    width: "80%",
    borderRadius: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  podiumPosition: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 24,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  listItemHighlight: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.primary + "08",
  },
  positionCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  positionNumber: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
  listAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  listAvatarText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 16,
  },
  listInfo: {
    flex: 1,
    gap: 2,
  },
  listName: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 14,
    color: Colors.dark.text,
  },
  rankBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankBadgeText: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 11,
  },
  listXp: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 15,
    color: Colors.dark.textSecondary,
  },
});
