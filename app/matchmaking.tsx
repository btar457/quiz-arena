import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, View, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useGame } from "@/lib/game-context";
import { getRankFromXP, BOT_NAMES } from "@/lib/game-data";

interface LobbyPlayer {
  name: string;
  rank: string;
  color: string;
  icon: string;
  team?: "A" | "B";
}

export default function MatchmakingScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useGame();
  const { mode, category } = useLocalSearchParams<{ mode?: string; category?: string }>();
  const gameMode = mode || "classic";
  const selectedCategory = category || "all";
  const rank = getRankFromXP(profile.xp);
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [status, setStatus] = useState("جارٍ البحث...");
  const [ready, setReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const pulseScale = useSharedValue(1);
  const rotateVal = useSharedValue(0);

  const totalPlayers = gameMode === "1v1" ? 2 : gameMode === "2v2" ? 4 : 10;
  const modeLabel = gameMode === "1v1" ? "١ ضد ١" : gameMode === "2v2" ? "٢ ضد ٢" : "تنافسي";
  const questionCount = gameMode === "1v1" ? "١٥ سؤال" : gameMode === "2v2" ? "٢٠ سؤال" : "٣٠ سؤال";
  const modeColor = gameMode === "1v1" ? "#F59E0B" : gameMode === "2v2" ? "#A855F7" : "#00E5FF";

  useEffect(() => {
    pulseScale.value = withRepeat(withTiming(1.15, { duration: 800 }), -1, true);
    rotateVal.value = withRepeat(withTiming(360, { duration: 3000, easing: Easing.linear }), -1, false);
  }, []);

  useEffect(() => {
    const playerEntry: LobbyPlayer = {
      name: profile.name,
      rank: rank.label,
      color: rank.color,
      icon: rank.icon,
      team: gameMode === "2v2" ? "A" : undefined,
    };
    setPlayers([playerEntry]);

    const shuffledBots = [...BOT_NAMES].sort(() => Math.random() - 0.5).slice(0, totalPlayers - 1);
    const rankOptions = [
      { label: "مبتدئ ٢", color: "#94A3B8", icon: "school-outline" },
      { label: "متوسط ١", color: "#38BDF8", icon: "fitness-outline" },
      { label: "ذكي ٢", color: "#10B981", icon: "bulb-outline" },
      { label: "خبير ١", color: "#A855F7", icon: "diamond-outline" },
      { label: "عبقري ٢", color: "#F59E0B", icon: "flame-outline" },
      { label: "مبتدئ ٤", color: "#94A3B8", icon: "school-outline" },
      { label: "متوسط ٣", color: "#38BDF8", icon: "fitness-outline" },
      { label: "ذكي ٤", color: "#10B981", icon: "bulb-outline" },
      { label: "خبير ٣", color: "#A855F7", icon: "diamond-outline" },
    ];

    let idx = 0;
    const botsNeeded = totalPlayers - 1;
    const interval = gameMode === "classic" ? 600 : 800;

    timerRef.current = setInterval(() => {
      if (idx >= botsNeeded) {
        clearInterval(timerRef.current);
        setStatus("تم العثور على مباراة!");
        setReady(true);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          const target = gameMode === "1v1" ? "/game-1v1" : gameMode === "2v2" ? "/game-2v2" : "/game";
          router.replace({ pathname: target, params: { category: selectedCategory } } as any);
        }, 1500);
        return;
      }
      const r = rankOptions[idx % rankOptions.length];
      let team: "A" | "B" | undefined;
      if (gameMode === "2v2") {
        team = idx === 0 ? "A" : "B";
      }
      setPlayers(prev => [...prev, {
        name: shuffledBots[idx],
        rank: r.label,
        color: r.color,
        icon: r.icon,
        team,
      }]);

      const found = idx + 2;
      const total = gameMode === "1v1" ? "٢" : gameMode === "2v2" ? "٤" : "١٠";
      setStatus(`${found}/${total} لاعبين تم العثور عليهم`);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      idx++;
    }, interval);

    return () => clearInterval(timerRef.current);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateVal.value}deg` }],
  }));

  const renderTeam2v2 = () => {
    const teamA = players.filter(p => p.team === "A");
    const teamB = players.filter(p => p.team === "B");
    return (
      <View style={styles.teamsLayout}>
        <View style={styles.teamColumn}>
          <View style={[styles.teamLabel, { backgroundColor: "#A855F7" + "20" }]}>
            <Ionicons name="shield" size={14} color="#A855F7" />
            <Text style={[styles.teamLabelText, { color: "#A855F7" }]}>فريق ١</Text>
          </View>
          {[0, 1].map(i => {
            const p = teamA[i];
            return p ? (
              <Animated.View key={`a${i}`} entering={FadeIn.duration(300)} style={[styles.playerSlot, { borderColor: p.color + "50" }]}>
                <View style={[styles.slotIcon, { backgroundColor: p.color + "20" }]}>
                  <Ionicons name={p.icon as any} size={16} color={p.color} />
                </View>
                <Text style={styles.slotName} numberOfLines={1}>{p.name}</Text>
                <Text style={[styles.slotRank, { color: p.color }]}>{p.rank}</Text>
              </Animated.View>
            ) : (
              <View key={`ae${i}`} style={styles.emptySlot}>
                <View style={styles.emptyDot} />
                <Text style={styles.emptyText}>جارٍ البحث...</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.vsColumn}>
          <Text style={styles.vsColumnText}>VS</Text>
        </View>

        <View style={styles.teamColumn}>
          <View style={[styles.teamLabel, { backgroundColor: "#F59E0B" + "20" }]}>
            <Ionicons name="flash" size={14} color="#F59E0B" />
            <Text style={[styles.teamLabelText, { color: "#F59E0B" }]}>فريق ٢</Text>
          </View>
          {[0, 1].map(i => {
            const p = teamB[i];
            return p ? (
              <Animated.View key={`b${i}`} entering={FadeIn.duration(300)} style={[styles.playerSlot, { borderColor: p.color + "50" }]}>
                <View style={[styles.slotIcon, { backgroundColor: p.color + "20" }]}>
                  <Ionicons name={p.icon as any} size={16} color={p.color} />
                </View>
                <Text style={styles.slotName} numberOfLines={1}>{p.name}</Text>
                <Text style={[styles.slotRank, { color: p.color }]}>{p.rank}</Text>
              </Animated.View>
            ) : (
              <View key={`be${i}`} style={styles.emptySlot}>
                <View style={styles.emptyDot} />
                <Text style={styles.emptyText}>جارٍ البحث...</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const render1v1 = () => (
    <View style={styles.duelLayout}>
      {[0, 1].map(i => {
        const p = players[i];
        return (
          <View key={i} style={styles.duelSlotWrap}>
            {p ? (
              <Animated.View entering={FadeIn.duration(300)} style={[styles.duelSlot, { borderColor: p.color + "50" }]}>
                <View style={[styles.duelIcon, { backgroundColor: p.color + "20" }]}>
                  <Ionicons name={p.icon as any} size={28} color={p.color} />
                </View>
                <Text style={styles.duelName}>{p.name}</Text>
                <Text style={[styles.duelRank, { color: p.color }]}>{p.rank}</Text>
              </Animated.View>
            ) : (
              <View style={styles.duelEmpty}>
                <View style={styles.emptyDot} />
                <Text style={styles.emptyText}>جارٍ البحث...</Text>
              </View>
            )}
            {i === 0 && <Text style={styles.duelVS}>VS</Text>}
          </View>
        );
      })}
    </View>
  );

  const renderClassic = () => (
    <View style={styles.playersGrid}>
      {Array.from({ length: 10 }).map((_, idx) => {
        const player = players[idx];
        return (
          <View key={idx} style={styles.slotWrap}>
            {player ? (
              <Animated.View entering={FadeIn.duration(300)} style={[styles.playerSlot, { borderColor: player.color + "50" }]}>
                <View style={[styles.slotIcon, { backgroundColor: player.color + "20" }]}>
                  <Ionicons name={player.icon as any} size={16} color={player.color} />
                </View>
                <Text style={styles.slotName} numberOfLines={1}>{player.name}</Text>
                <Text style={[styles.slotRank, { color: player.color }]} numberOfLines={1}>{player.rank}</Text>
              </Animated.View>
            ) : (
              <View style={styles.emptySlot}>
                <View style={styles.emptyDot} />
                <Text style={styles.emptyText}>جارٍ البحث...</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <LinearGradient
        colors={[modeColor + "10", Colors.dark.background]}
        style={StyleSheet.absoluteFill}
      />

      <Pressable
        onPress={() => { clearInterval(timerRef.current); router.back(); }}
        style={styles.backBtn}
      >
        <Ionicons name="close" size={24} color={Colors.dark.textSecondary} />
      </Pressable>

      <View style={styles.topSection}>
        <Animated.View style={[styles.searchIcon, pulseStyle, { backgroundColor: modeColor + "15" }]}>
          {ready ? (
            <Ionicons name="checkmark-circle" size={48} color={Colors.dark.success} />
          ) : (
            <Animated.View style={rotateStyle}>
              <Ionicons name="search" size={40} color={modeColor} />
            </Animated.View>
          )}
        </Animated.View>
        <Text style={[styles.statusText, ready && { color: Colors.dark.success }]}>{status}</Text>
        <View style={[styles.modeBadge, { backgroundColor: modeColor + "15" }]}>
          <Text style={[styles.modeBadgeText, { color: modeColor }]}>{modeLabel} - {questionCount}</Text>
        </View>
      </View>

      {gameMode === "2v2" ? renderTeam2v2() : gameMode === "1v1" ? render1v1() : renderClassic()}

      <View style={[styles.bottomInfo, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16 }]}>
        <Text style={styles.tipText}>
          {gameMode === "2v2" ? "أسرع عضو في الفريق يُجيب عن الفريق" : gameMode === "1v1" ? "مواجهة مباشرة - الأسرع والأدق يفوز" : "مطابقة مع لاعبين قريبين من رتبتك"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  backBtn: {
    position: "absolute", top: Platform.OS === "web" ? 74 : 56, right: 20, zIndex: 10,
    width: 40, height: 40, alignItems: "center", justifyContent: "center",
  },
  topSection: { alignItems: "center", paddingVertical: 20, gap: 8 },
  searchIcon: {
    width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  statusText: { fontFamily: "Rajdhani_700Bold", fontSize: 22, color: Colors.dark.text },
  modeBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 10 },
  modeBadgeText: { fontFamily: "Rajdhani_600SemiBold", fontSize: 13 },
  playersGrid: {
    flex: 1, flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 8, alignContent: "flex-start",
  },
  slotWrap: { width: "48%" as any },
  playerSlot: {
    backgroundColor: Colors.dark.card, borderRadius: 12, padding: 12, gap: 4, borderWidth: 1,
  },
  slotIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  slotName: { fontFamily: "Rajdhani_600SemiBold", fontSize: 14, color: Colors.dark.text },
  slotRank: { fontFamily: "Rajdhani_400Regular", fontSize: 11 },
  emptySlot: {
    backgroundColor: Colors.dark.surfaceLight, borderRadius: 12, padding: 12, gap: 6,
    borderWidth: 1, borderColor: Colors.dark.border, borderStyle: "dashed",
    alignItems: "center", minHeight: 76, justifyContent: "center",
  },
  emptyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.dark.textMuted },
  emptyText: { fontFamily: "Rajdhani_400Regular", fontSize: 11, color: Colors.dark.textMuted },
  teamsLayout: { flex: 1, flexDirection: "row", paddingHorizontal: 16, gap: 8 },
  teamColumn: { flex: 1, gap: 8 },
  teamLabel: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 10 },
  teamLabelText: { fontFamily: "Rajdhani_700Bold", fontSize: 14 },
  vsColumn: { justifyContent: "center", paddingHorizontal: 8 },
  vsColumnText: { fontFamily: "Rajdhani_700Bold", fontSize: 20, color: Colors.dark.primary },
  duelLayout: { flex: 1, paddingHorizontal: 24, justifyContent: "center", gap: 16 },
  duelSlotWrap: { alignItems: "center" },
  duelSlot: {
    backgroundColor: Colors.dark.card, borderRadius: 16, padding: 20, alignItems: "center",
    borderWidth: 1, width: "100%",
  },
  duelIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  duelName: { fontFamily: "Rajdhani_700Bold", fontSize: 20, color: Colors.dark.text },
  duelRank: { fontFamily: "Rajdhani_500Medium", fontSize: 14 },
  duelEmpty: {
    backgroundColor: Colors.dark.surfaceLight, borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: Colors.dark.border, borderStyle: "dashed",
    alignItems: "center", width: "100%",
  },
  duelVS: {
    fontFamily: "Rajdhani_700Bold", fontSize: 24, color: Colors.dark.primary, marginTop: 12,
  },
  bottomInfo: { alignItems: "center", paddingVertical: 16 },
  tipText: { fontFamily: "Rajdhani_400Regular", fontSize: 13, color: Colors.dark.textMuted, textAlign: "center", paddingHorizontal: 20 },
});
