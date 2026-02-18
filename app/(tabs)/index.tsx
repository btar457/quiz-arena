import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, Dimensions, Alert, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInRight, FadeIn, ZoomIn } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";
import { useGame } from "@/lib/game-context";
import { getRankFromXP, DAILY_REWARDS, getCurrentSeason, getSeasonDaysLeft } from "@/lib/game-data";
import AdBanner from "@/components/AdBanner";

const { width } = Dimensions.get("window");
const DAILY_KEY = "@quiz_daily_reward";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { profile, loadProfile, addCoins, addXP } = useGame();
  const rank = getRankFromXP(profile.xp);
  const xpProgress = (profile.xp - rank.minXP) / (rank.maxXP - rank.minXP);
  const season = getCurrentSeason();
  const daysLeft = getSeasonDaysLeft();

  const [dailyStreak, setDailyStreak] = useState(0);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [claimedToday, setClaimedToday] = useState(false);

  useEffect(() => {
    loadProfile();
    checkDailyReward();
  }, []);

  const checkDailyReward = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(DAILY_KEY);
      if (data) {
        const { lastClaim, streak } = JSON.parse(data);
        const lastDate = new Date(lastClaim).toDateString();
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (lastDate === today) {
          setDailyStreak(streak);
          setCanClaimDaily(false);
          setClaimedToday(true);
        } else if (lastDate === yesterday) {
          setDailyStreak(streak);
          setCanClaimDaily(true);
        } else {
          setDailyStreak(0);
          setCanClaimDaily(true);
        }
      } else {
        setCanClaimDaily(true);
      }
    } catch {}
  }, []);

  const claimDailyReward = async () => {
    const newStreak = (dailyStreak % 7) + 1;
    const reward = DAILY_REWARDS[newStreak - 1];
    if (!reward) return;

    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addCoins(reward.coins);
    addXP(reward.xp);
    setDailyStreak(newStreak);
    setCanClaimDaily(false);
    setClaimedToday(true);

    await AsyncStorage.setItem(DAILY_KEY, JSON.stringify({
      lastClaim: new Date().toISOString(),
      streak: newStreak,
    }));

    setShowDailyModal(false);
    Alert.alert(
      "مكافأة يومية!",
      `حصلت على ${reward.coins} عملة و ${reward.xp} نقطة خبرة!${reward.bonus ? "\nمكافأة إضافية لليوم السابع!" : ""}`
    );
  };

  const handlePlay = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/mode-select");
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 100 }]}
      >
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>أهلاً بعودتك،</Text>
            <Text style={styles.playerName}>{profile.name}</Text>
          </View>
          <View style={styles.coinBadge}>
            <Ionicons name="diamond" size={16} color={Colors.dark.gold} />
            <Text style={styles.coinText}>{profile.coins}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(50)}>
          <Pressable
            onPress={() => {
              if (canClaimDaily) {
                setShowDailyModal(true);
              } else {
                Alert.alert("المكافأة اليومية", "لقد حصلت على مكافأة اليوم بالفعل! عد غداً.");
              }
            }}
            style={({ pressed }) => [styles.dailyBanner, pressed && { opacity: 0.9 }]}
          >
            <LinearGradient
              colors={canClaimDaily ? ["#FFD700" + "25", "#F59E0B" + "10"] : [Colors.dark.card, Colors.dark.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dailyGradient}
            >
              <View style={styles.dailyLeft}>
                <View style={[styles.dailyIcon, { backgroundColor: canClaimDaily ? "#FFD700" + "30" : Colors.dark.surfaceLight }]}>
                  <Ionicons name="gift" size={22} color={canClaimDaily ? "#FFD700" : Colors.dark.textMuted} />
                </View>
                <View>
                  <Text style={styles.dailyTitle}>المكافأة اليومية</Text>
                  <Text style={styles.dailySubtext}>
                    {canClaimDaily ? "اضغط لجمع مكافأتك!" : `اليوم ${((dailyStreak - 1) % 7) + 1} من ٧`}
                  </Text>
                </View>
              </View>
              <View style={styles.dailyStreakBadge}>
                <Ionicons name="flame" size={14} color={canClaimDaily ? "#EF4444" : Colors.dark.textMuted} />
                <Text style={[styles.dailyStreakText, { color: canClaimDaily ? "#EF4444" : Colors.dark.textMuted }]}>
                  {dailyStreak}
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(80)}>
          <Pressable onPress={() => router.push("/leaderboard" as any)} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
            <LinearGradient
              colors={[season.color + "15", Colors.dark.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.seasonBanner}
            >
              <View style={styles.seasonLeft}>
                <Ionicons name={season.icon as any} size={20} color={season.color} />
                <View>
                  <Text style={styles.seasonName}>{season.name}</Text>
                  <Text style={styles.seasonDays}>{daysLeft} يوم متبقي</Text>
                </View>
              </View>
              <Ionicons name="podium-outline" size={18} color={Colors.dark.textMuted} />
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(100)}>
          <Pressable onPress={handlePlay} style={({ pressed }) => [styles.playButton, pressed && { transform: [{ scale: 0.97 }] }]}>
            <LinearGradient
              colors={["#00E5FF", "#0091EA"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.playGradient}
            >
              <Ionicons name="play" size={28} color="#fff" />
              <Text style={styles.playText}>ابدأ اللعب</Text>
              <Text style={styles.playSubtext}>١ ضد ١ | ٢ ضد ٢ | ١٠ لاعبين</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(150)} style={styles.quickActions}>
          <QuickAction icon="podium" label="المتصدرين" color="#FFD700" onPress={() => router.push("/leaderboard" as any)} />
          <QuickAction icon="ribbon" label="الإنجازات" color="#A855F7" onPress={() => router.push("/achievements" as any)} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.rankCard}>
          <LinearGradient
            colors={[rank.color + "20", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rankGradient}
          >
            <View style={styles.rankHeader}>
              <View style={[styles.rankIconContainer, { borderColor: rank.color }]}>
                <Ionicons name={rank.icon as any} size={24} color={rank.color} />
              </View>
              <View style={styles.rankInfo}>
                <Text style={[styles.rankLabel, { color: rank.color }]}>{rank.label}</Text>
                <Text style={styles.xpText}>{profile.xp} نقطة خبرة</Text>
              </View>
              <View style={styles.rankProgress}>
                <Text style={styles.progressPercent}>{Math.round(xpProgress * 100)}%</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${xpProgress * 100}%`, backgroundColor: rank.color }]} />
            </View>
            <Text style={styles.progressLabel}>{rank.maxXP - profile.xp} نقطة خبرة للرتبة التالية</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.statsRow}>
          <StatCard icon="trophy" label="فوز" value={profile.wins.toString()} color={Colors.dark.gold} />
          <StatCard icon="trending-up" label="سلسلة" value={profile.streak.toString()} color={Colors.dark.primary} />
          <StatCard icon="game-controller" label="لعب" value={profile.gamesPlayed.toString()} color={Colors.dark.accent} />
          <StatCard icon="stats-chart" label="نسبة" value={profile.gamesPlayed > 0 ? `${Math.round((profile.wins / profile.gamesPlayed) * 100)}%` : "٠%"} color={Colors.dark.success} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>المساعدات</Text>
            <Pressable onPress={() => router.push("/(tabs)/store")}>
              <Text style={styles.seeAll}>احصل على المزيد</Text>
            </Pressable>
          </View>
          <View style={styles.lifelinesRow}>
            <LifelineChip icon="cut-outline" label="٥٠/٥٠" count={profile.lifelines.fifty_fifty || 0} color="#FF6B6B" />
            <LifelineChip icon="snow-outline" label="تجميد" count={profile.lifelines.time_freeze || 0} color="#4ECDC4" />
            <LifelineChip icon="shield-checkmark-outline" label="درع" count={profile.lifelines.shield || 0} color="#A855F7" />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(450)}>
          <AdBanner size="banner" />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(500)}>
          <Text style={styles.sectionTitle}>المباريات الأخيرة</Text>
          {profile.recentMatches.length === 0 ? (
            <View style={styles.emptyMatches}>
              <Ionicons name="game-controller-outline" size={36} color={Colors.dark.textMuted} />
              <Text style={styles.emptyText}>لا توجد مباريات بعد</Text>
            </View>
          ) : (
            profile.recentMatches.slice(0, 5).map((match, idx) => (
              <Animated.View key={match.id} entering={FadeInRight.duration(400).delay(idx * 80)}>
                <View style={styles.matchCard}>
                  <View style={[styles.positionBadge, { backgroundColor: match.position === 1 ? Colors.dark.gold + "30" : match.position <= 3 ? Colors.dark.primary + "20" : Colors.dark.surfaceLight }]}>
                    <Text style={[styles.positionText, { color: match.position === 1 ? Colors.dark.gold : match.position <= 3 ? Colors.dark.primary : Colors.dark.textSecondary }]}>#{match.position}</Text>
                  </View>
                  <View style={styles.matchInfo}>
                    <Text style={styles.matchScore}>{match.score} نقطة</Text>
                    <Text style={styles.matchDate}>{match.date}</Text>
                  </View>
                  <View style={styles.matchRewards}>
                    <View style={styles.rewardRow}>
                      <Ionicons name="star" size={12} color={Colors.dark.gold} />
                      <Text style={styles.rewardText}>+{match.xpGained}</Text>
                    </View>
                    <View style={styles.rewardRow}>
                      <Ionicons name="diamond" size={12} color={Colors.dark.primary} />
                      <Text style={styles.rewardText}>+{match.coinsGained}</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            ))
          )}
        </Animated.View>
      </ScrollView>

      <Modal visible={showDailyModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowDailyModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Animated.View entering={ZoomIn.duration(400)}>
              <LinearGradient
                colors={["#FFD700" + "15", Colors.dark.card]}
                style={styles.modalGradient}
              >
                <Ionicons name="gift" size={48} color="#FFD700" />
                <Text style={styles.modalTitle}>المكافأة اليومية</Text>
                <Text style={styles.modalSubtitle}>سلسلة: {dailyStreak} أيام</Text>

                <View style={styles.dailyGrid}>
                  {DAILY_REWARDS.map((reward) => {
                    const isNext = reward.day === (dailyStreak % 7) + 1;
                    const isClaimed = reward.day <= dailyStreak % 7 || (dailyStreak >= 7 && !canClaimDaily);
                    return (
                      <View key={reward.day} style={[
                        styles.dailyCard,
                        isNext && { borderColor: "#FFD700", borderWidth: 2 },
                        isClaimed && { opacity: 0.5 },
                        reward.bonus && { borderColor: "#A855F7" + "50" },
                      ]}>
                        <Text style={styles.dailyDayText}>{reward.label}</Text>
                        <Ionicons name={reward.bonus ? "star" : "diamond"} size={18} color={reward.bonus ? "#FFD700" : Colors.dark.primary} />
                        <Text style={styles.dailyCoinText}>{reward.coins}</Text>
                        {isClaimed && <Ionicons name="checkmark-circle" size={16} color={Colors.dark.success} style={styles.claimedIcon} />}
                      </View>
                    );
                  })}
                </View>

                <Pressable
                  onPress={claimDailyReward}
                  disabled={!canClaimDaily}
                  style={({ pressed }) => [pressed && { opacity: 0.8 }]}
                >
                  <LinearGradient
                    colors={canClaimDaily ? ["#FFD700", "#F59E0B"] : [Colors.dark.surfaceLight, Colors.dark.surfaceLight]}
                    style={styles.claimBtn}
                  >
                    <Text style={[styles.claimBtnText, !canClaimDaily && { color: Colors.dark.textMuted }]}>
                      {canClaimDaily ? "اجمع المكافأة!" : "تم الجمع اليوم"}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + "30" }]}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LifelineChip({ icon, label, count, color }: { icon: string; label: string; count: number; color: string }) {
  return (
    <View style={[styles.lifelineChip, { borderColor: color + "40" }]}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={styles.lifelineLabel}>{label}</Text>
      <View style={[styles.lifelineCount, { backgroundColor: color + "30" }]}>
        <Text style={[styles.lifelineCountText, { color }]}>{count}</Text>
      </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 12,
  },
  greeting: {
    fontFamily: "Rajdhani_400Regular",
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: "left",
  },
  playerName: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 28,
    color: Colors.dark.text,
    textAlign: "left",
  },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.goldDim,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  coinText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 16,
    color: Colors.dark.gold,
  },
  dailyBanner: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  dailyGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  dailyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dailyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dailyTitle: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 15,
    color: Colors.dark.text,
  },
  dailySubtext: {
    fontFamily: "Rajdhani_400Regular",
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  dailyStreakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.dark.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dailyStreakText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 14,
  },
  seasonBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  seasonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  seasonName: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 14,
    color: Colors.dark.text,
  },
  seasonDays: {
    fontFamily: "Rajdhani_400Regular",
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  playButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
  },
  playGradient: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  playText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 24,
    color: "#fff",
    letterSpacing: 2,
  },
  playSubtext: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  quickAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 14,
    color: Colors.dark.text,
  },
  rankCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 16,
  },
  rankGradient: {
    padding: 16,
  },
  rankHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  rankIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.surfaceLight,
  },
  rankInfo: {
    flex: 1,
    marginLeft: 12,
  },
  rankLabel: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 18,
  },
  xpText: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  rankProgress: {
    alignItems: "flex-end",
  },
  progressPercent: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 22,
    color: Colors.dark.text,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressLabel: {
    fontFamily: "Rajdhani_400Regular",
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
  },
  statValue: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 22,
  },
  statLabel: {
    fontFamily: "Rajdhani_400Regular",
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 18,
    color: Colors.dark.text,
    marginBottom: 12,
  },
  seeAll: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 14,
    color: Colors.dark.primary,
    marginBottom: 12,
  },
  lifelinesRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  lifelineChip: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  lifelineLabel: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  lifelineCount: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  lifelineCountText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 14,
  },
  emptyMatches: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
  matchCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  positionBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  positionText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 16,
  },
  matchInfo: {
    flex: 1,
  },
  matchScore: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 16,
    color: Colors.dark.text,
  },
  matchDate: {
    fontFamily: "Rajdhani_400Regular",
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  matchRewards: {
    gap: 4,
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rewardText: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
  },
  modalGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalTitle: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 24,
    color: "#FFD700",
  },
  modalSubtitle: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  dailyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginVertical: 8,
  },
  dailyCard: {
    width: 70,
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  dailyDayText: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  dailyCoinText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 14,
    color: Colors.dark.text,
  },
  claimedIcon: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  claimBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 8,
  },
  claimBtnText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 18,
    color: "#000",
    textAlign: "center",
  },
});
