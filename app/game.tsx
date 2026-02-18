import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, View, Pressable, Platform, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useGame } from "@/lib/game-context";
import { getGameQuestionsByCategory, BOT_NAMES, REACTION_ICONS, getRankFromXP } from "@/lib/game-data";
import { playSound } from "@/lib/sounds";
import AdBanner from "@/components/AdBanner";

const TIME_PER_QUESTION = 15;

interface BotPlayer {
  name: string;
  score: number;
  color: string;
}

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const { profile, useLifeline, addMatchResult } = useGame();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [questions] = useState(() => getGameQuestionsByCategory(30, category || "all"));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(TIME_PER_QUESTION);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [shieldActive, setShieldActive] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [floatingReaction, setFloatingReaction] = useState<string | null>(null);
  const [bots] = useState<BotPlayer[]>(() =>
    BOT_NAMES.slice(0, 9).map(name => ({
      name,
      score: 0,
      color: ["#94A3B8", "#38BDF8", "#10B981", "#A855F7", "#F59E0B"][Math.floor(Math.random() * 5)],
    }))
  );
  const [botScores, setBotScores] = useState<number[]>(new Array(9).fill(0));

  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const progressWidth = useSharedValue(100);

  const currentQ = questions[currentIdx];

  const lifelines = {
    fifty_fifty: profile.lifelines.fifty_fifty || 0,
    time_freeze: profile.lifelines.time_freeze || 0,
    shield: profile.lifelines.shield || 0,
  };

  useEffect(() => {
    if (gameOver) return;
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [currentIdx, gameOver]);

  const startTimer = () => {
    clearInterval(timerRef.current);
    setTimer(TIME_PER_QUESTION);
    progressWidth.value = 100;
    progressWidth.value = withTiming(0, { duration: TIME_PER_QUESTION * 1000 });

    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (frozen) return prev;
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeUp = () => {
    setCorrectAnswer(currentQ.correctIndex);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setTimeout(() => advanceQuestion(), 1200);
  };

  const handleAnswer = (idx: number) => {
    if (selectedAnswer !== null || gameOver) return;
    clearInterval(timerRef.current);
    setSelectedAnswer(idx);

    const isCorrect = idx === currentQ.correctIndex;
    setCorrectAnswer(currentQ.correctIndex);

    if (isCorrect) {
      const points = Math.max(50, timer * 10);
      setScore(prev => prev + points);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSound("correct");
    } else {
      if (!shieldActive) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      playSound("wrong");
      setShieldActive(false);
    }

    updateBotScores();
    setTimeout(() => advanceQuestion(), 1200);
  };

  const updateBotScores = () => {
    setBotScores(prev => prev.map(s => {
      const correct = Math.random() > 0.35;
      return correct ? s + Math.floor(Math.random() * 100 + 50) : s;
    }));
  };

  const advanceQuestion = () => {
    if (currentIdx >= questions.length - 1) {
      finishGame();
      return;
    }
    setSelectedAnswer(null);
    setCorrectAnswer(null);
    setHiddenOptions([]);
    setFrozen(false);
    setCurrentIdx(prev => prev + 1);
  };

  const finishGame = () => {
    clearInterval(timerRef.current);
    setGameOver(true);

    const allScores = [...botScores, score].sort((a, b) => b - a);
    const position = allScores.indexOf(score) + 1;
    const xpGained = Math.max(10, (11 - position) * 10);
    const coinsGained = Math.max(5, (11 - position) * 15);

    addMatchResult({
      id: `m_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      position,
      score,
      totalPlayers: 10,
      xpGained,
      coinsGained,
    });
  };

  const handleFiftyFifty = () => {
    if (hiddenOptions.length > 0) return;
    const success = useLifeline("fifty_fifty");
    if (!success) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const wrongIndices = currentQ.options
      .map((_, i) => i)
      .filter(i => i !== currentQ.correctIndex);
    const toHide = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);
    setHiddenOptions(toHide);
  };

  const handleFreeze = () => {
    const success = useLifeline("time_freeze");
    if (!success) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setFrozen(true);
    clearInterval(timerRef.current);
    setTimeout(() => {
      setFrozen(false);
      startTimer();
    }, 10000);
  };

  const handleShield = () => {
    const success = useLifeline("shield");
    if (!success) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShieldActive(true);
  };

  const handleReaction = (iconName: string) => {
    setFloatingReaction(iconName);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setFloatingReaction(null), 1500);
    setShowReactions(false);
  };

  const timerColor = timer <= 5 ? Colors.dark.error : timer <= 10 ? Colors.dark.warning : Colors.dark.primary;

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const leaderboard = [...bots.map((b, i) => ({
    name: b.name,
    score: botScores[i],
    color: b.color,
    isPlayer: false,
  })), {
    name: profile.name,
    score,
    color: getRankFromXP(profile.xp).color,
    isPlayer: true,
  }].sort((a, b) => b.score - a.score);

  if (gameOver) {
    const position = leaderboard.findIndex(p => p.isPlayer) + 1;
    return (
      <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
        <LinearGradient
          colors={position === 1 ? [Colors.dark.gold + "20", Colors.dark.background] : [Colors.dark.primary + "10", Colors.dark.background]}
          style={StyleSheet.absoluteFill}
        />
        <ScrollView contentContainerStyle={[styles.resultContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }]}>
          <Animated.View entering={FadeInDown.duration(600)} style={styles.resultHeader}>
            <Ionicons
              name={position === 1 ? "trophy" : position <= 3 ? "medal" : "ribbon"}
              size={60}
              color={position === 1 ? Colors.dark.gold : position <= 3 ? Colors.dark.primary : Colors.dark.textSecondary}
            />
            <Text style={styles.resultPosition}>#{position}</Text>
            <Text style={styles.resultScore}>{score} نقطة</Text>
            <Text style={styles.resultLabel}>{position === 1 ? "فوز!" : position <= 3 ? "أداء رائع!" : "حاول مجدداً!"}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(200)}>
            <Text style={styles.leaderboardTitle}>الترتيب النهائي</Text>
            {leaderboard.map((p, idx) => (
              <View key={idx} style={[styles.leaderRow, p.isPlayer && { borderColor: Colors.dark.primary, borderWidth: 1 }]}>
                <Text style={[styles.leaderPos, idx < 3 && { color: [Colors.dark.gold, "#C0C0C0", "#CD7F32"][idx] }]}>#{idx + 1}</Text>
                <View style={[styles.leaderDot, { backgroundColor: p.color }]} />
                <Text style={[styles.leaderName, p.isPlayer && { color: Colors.dark.primary }]} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.leaderScore}>{p.score}</Text>
              </View>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(350)}>
            <AdBanner size="banner" style={{ marginHorizontal: 0 }} />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.resultActions}>
            <Pressable
              onPress={() => router.replace("/(tabs)")}
              style={({ pressed }) => [styles.exitBtn, { flex: 1 }, pressed && { opacity: 0.8 }]}
            >
              <LinearGradient colors={["#00E5FF", "#0091EA"]} style={styles.exitGradient}>
                <Text style={styles.exitText}>العودة للرئيسية</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => {
                const text = `حققت المركز #${position} بنتيجة ${score} نقطة في ساحة المعرفة!`;
                Alert.alert("مشاركة النتيجة", text);
              }}
              style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="share-social" size={22} color={Colors.dark.primary} />
            </Pressable>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <View style={styles.gameHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.questionCount}>{currentIdx + 1}/{questions.length}</Text>
          <View style={styles.scoreBadge}>
            <Ionicons name="star" size={12} color={Colors.dark.gold} />
            <Text style={styles.scoreText}>{score}</Text>
          </View>
        </View>
        <View style={styles.timerWrap}>
          {frozen && <Ionicons name="snow" size={14} color="#4ECDC4" />}
          <Text style={[styles.timerText, { color: timerColor }]}>{timer} ث</Text>
        </View>
      </View>

      <View style={styles.progressBarWrap}>
        <Animated.View style={[styles.progressBarFill, progressStyle, { backgroundColor: timerColor }]} />
      </View>

      <ScrollView style={styles.gameBody} contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }}>
        <Animated.View entering={FadeIn.duration(300)} key={currentIdx}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{currentQ.category}</Text>
            <View style={[styles.diffBadge, { backgroundColor: currentQ.difficulty === "hard" ? Colors.dark.error + "20" : currentQ.difficulty === "medium" ? Colors.dark.warning + "20" : Colors.dark.success + "20" }]}>
              <Text style={[styles.diffText, { color: currentQ.difficulty === "hard" ? Colors.dark.error : currentQ.difficulty === "medium" ? Colors.dark.warning : Colors.dark.success }]}>
                {currentQ.difficulty === "simple" ? "سهل" : currentQ.difficulty === "medium" ? "متوسط" : "صعب"}
              </Text>
            </View>
          </View>

          <Text style={styles.questionText}>{currentQ.text}</Text>

          <View style={styles.optionsWrap}>
            {currentQ.options.map((option, idx) => {
              if (hiddenOptions.includes(idx)) return <View key={idx} style={styles.hiddenOption} />;
              const isSelected = selectedAnswer === idx;
              const isCorrect = correctAnswer === idx;
              const isWrong = isSelected && correctAnswer !== null && !isCorrect;

              let bgColor = Colors.dark.card;
              let borderColor = Colors.dark.border;
              if (isCorrect) {
                bgColor = Colors.dark.success + "25";
                borderColor = Colors.dark.success;
              } else if (isWrong) {
                bgColor = Colors.dark.error + "25";
                borderColor = Colors.dark.error;
              }

              return (
                <Pressable
                  key={idx}
                  onPress={() => handleAnswer(idx)}
                  disabled={selectedAnswer !== null}
                  style={({ pressed }) => [
                    styles.optionBtn,
                    { backgroundColor: bgColor, borderColor },
                    pressed && selectedAnswer === null && { transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <View style={[styles.optionLetter, { borderColor }]}>
                    <Text style={[styles.optionLetterText, isCorrect && { color: Colors.dark.success }, isWrong && { color: Colors.dark.error }]}>
                      {String.fromCharCode(65 + idx)}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, isCorrect && { color: Colors.dark.success }, isWrong && { color: Colors.dark.error }]}>{option}</Text>
                  {isCorrect && <Ionicons name="checkmark-circle" size={20} color={Colors.dark.success} />}
                  {isWrong && <Ionicons name="close-circle" size={20} color={Colors.dark.error} />}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <View style={styles.lifelinesBar}>
          <LifelineBtn icon="cut-outline" count={lifelines.fifty_fifty} color="#FF6B6B" onPress={handleFiftyFifty} disabled={selectedAnswer !== null || hiddenOptions.length > 0} />
          <LifelineBtn icon="snow-outline" count={lifelines.time_freeze} color="#4ECDC4" onPress={handleFreeze} disabled={selectedAnswer !== null || frozen} />
          <LifelineBtn icon="shield-checkmark-outline" count={lifelines.shield} color="#A855F7" onPress={handleShield} disabled={selectedAnswer !== null || shieldActive} />
          <Pressable
            onPress={() => setShowReactions(!showReactions)}
            style={[styles.reactionToggle, showReactions && { backgroundColor: Colors.dark.primary + "20" }]}
          >
            <Ionicons name="happy-outline" size={22} color={Colors.dark.primary} />
          </Pressable>
        </View>

        {showReactions && (
          <Animated.View entering={FadeInUp.duration(200)} style={styles.reactionsBar}>
            {REACTION_ICONS.map(r => (
              <Pressable key={r.id} onPress={() => handleReaction(r.icon)} style={styles.reactionBtn}>
                <Ionicons name={r.icon as any} size={22} color={Colors.dark.text} />
              </Pressable>
            ))}
          </Animated.View>
        )}

        {floatingReaction && (
          <Animated.View entering={FadeInUp.duration(500)} style={styles.floatingReaction}>
            <Ionicons name={floatingReaction as any} size={40} color={Colors.dark.primary} />
          </Animated.View>
        )}

        <View style={styles.miniLeaderboard}>
          <Text style={styles.miniTitle}>الترتيب المباشر</Text>
          {leaderboard.slice(0, 5).map((p, idx) => (
            <View key={idx} style={[styles.miniRow, p.isPlayer && { backgroundColor: Colors.dark.primary + "10" }]}>
              <Text style={[styles.miniPos, idx === 0 && { color: Colors.dark.gold }]}>#{idx + 1}</Text>
              <View style={[styles.miniDot, { backgroundColor: p.color }]} />
              <Text style={[styles.miniName, p.isPlayer && { color: Colors.dark.primary }]} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.miniScore}>{p.score}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {shieldActive && (
        <View style={styles.shieldIndicator}>
          <Ionicons name="shield-checkmark" size={14} color="#A855F7" />
          <Text style={styles.shieldText}>الدرع مفعّل</Text>
        </View>
      )}
    </View>
  );
}

function LifelineBtn({ icon, count, color, onPress, disabled }: {
  icon: string; count: number; color: string; onPress: () => void; disabled: boolean;
}) {
  const isUsable = count > 0 && !disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={!isUsable}
      style={[styles.lifelineBtn, !isUsable && { opacity: 0.35 }]}
    >
      <View style={[styles.lifelineBtnInner, { borderColor: color + "50" }]}>
        <Ionicons name={icon as any} size={20} color={color} />
        <View style={[styles.lifelineBadge, { backgroundColor: color + "30" }]}>
          <Text style={[styles.lifelineBadgeText, { color }]}>{count}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  gameHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  questionCount: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.dark.goldDim,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scoreText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 14,
    color: Colors.dark.gold,
  },
  timerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timerText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 24,
  },
  progressBarWrap: {
    height: 3,
    backgroundColor: Colors.dark.surfaceLight,
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  gameBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 12,
  },
  categoryText: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 13,
    color: Colors.dark.primary,
    backgroundColor: Colors.dark.primaryDim,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diffText: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 11,
    textTransform: "uppercase" as const,
  },
  questionText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 22,
    color: Colors.dark.text,
    lineHeight: 30,
    marginBottom: 20,
  },
  optionsWrap: {
    gap: 10,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.surfaceLight,
  },
  optionLetterText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  optionText: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 16,
    color: Colors.dark.text,
    flex: 1,
  },
  hiddenOption: {
    height: 64,
    borderRadius: 14,
    backgroundColor: Colors.dark.surfaceLight,
    opacity: 0.3,
  },
  lifelinesBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 20,
    marginBottom: 8,
  },
  lifelineBtn: {},
  lifelineBtnInner: {
    alignItems: "center",
    justifyContent: "center",
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
  },
  lifelineBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  lifelineBadgeText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 10,
  },
  reactionToggle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.dark.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  reactionsBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 8,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    marginBottom: 8,
  },
  reactionBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.surfaceLight,
  },
  floatingReaction: {
    position: "absolute",
    alignSelf: "center",
    top: 100,
  },
  miniLeaderboard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  miniTitle: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 8,
  },
  miniRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 8,
  },
  miniPos: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 13,
    color: Colors.dark.textMuted,
    width: 28,
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  miniName: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 13,
    color: Colors.dark.text,
    flex: 1,
  },
  miniScore: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  shieldIndicator: {
    position: "absolute",
    top: Platform.OS === "web" ? 110 : 100,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#A855F7" + "25",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shieldText: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 12,
    color: "#A855F7",
  },
  resultContent: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  resultHeader: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 30,
    gap: 8,
  },
  resultPosition: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 48,
    color: Colors.dark.text,
  },
  resultScore: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 20,
    color: Colors.dark.textSecondary,
  },
  resultLabel: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 22,
    color: Colors.dark.primary,
  },
  leaderboardTitle: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 18,
    color: Colors.dark.text,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    gap: 10,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  leaderPos: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 15,
    color: Colors.dark.textMuted,
    width: 30,
  },
  leaderDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  leaderName: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 15,
    color: Colors.dark.text,
    flex: 1,
  },
  leaderScore: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 15,
    color: Colors.dark.textSecondary,
  },
  exitBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 24,
    width: "100%",
  },
  exitGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  exitText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 18,
    color: "#fff",
    letterSpacing: 1,
  },
  resultActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    alignItems: "center",
  },
  shareBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.dark.primaryDim,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    borderWidth: 1,
    borderColor: Colors.dark.primary + "30",
  },
});
