import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, View, Pressable, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useGame } from "@/lib/game-context";
import { getGameQuestionsByCategory, BOT_NAMES, REACTION_ICONS, getRankFromXP } from "@/lib/game-data";
import ChatOverlay, { useSimulatedChat } from "@/components/ChatOverlay";
import VoiceChatBar, { useSimulatedVoice } from "@/components/VoiceChatBar";
import { playSound } from "@/lib/sounds";
import AdBanner from "@/components/AdBanner";

const TIME_PER_QUESTION = 15;

export default function Game1v1Screen() {
  const insets = useSafeAreaInsets();
  const { profile, useLifeline, addMatchResult } = useGame();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [questions] = useState(() => getGameQuestionsByCategory(15, category || "all"));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timer, setTimer] = useState(TIME_PER_QUESTION);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [shieldActive, setShieldActive] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [opponentName] = useState(() => BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]);
  const [opponentAnswered, setOpponentAnswered] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const progressWidth = useSharedValue(100);

  const { messages, sendMessage } = useSimulatedChat([opponentName]);
  const { voicePlayers, isMicOn, toggleMic, toggleMutePlayer } = useSimulatedVoice([opponentName]);

  const currentQ = questions[currentIdx];
  const lifelines = {
    fifty_fifty: profile.lifelines.fifty_fifty || 0,
    time_freeze: profile.lifelines.time_freeze || 0,
    shield: profile.lifelines.shield || 0,
  };

  useEffect(() => {
    if (gameOver) return;
    startTimer();
    setOpponentAnswered(false);
    const opponentDelay = 2000 + Math.random() * 8000;
    const opponentTimeout = setTimeout(() => {
      setOpponentAnswered(true);
      const correct = Math.random() > 0.4;
      if (correct) {
        setOpponentScore(prev => prev + Math.floor(Math.random() * 80 + 40));
      }
    }, opponentDelay);
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(opponentTimeout);
    };
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
    setTimeout(() => advanceQuestion(), 1200);
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
    playSound("win");
    const position = score >= opponentScore ? 1 : 2;
    const xpGained = position === 1 ? 50 : 15;
    const coinsGained = position === 1 ? 100 : 25;
    addMatchResult({
      id: `m_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      position,
      score,
      totalPlayers: 2,
      xpGained,
      coinsGained,
    });
  };

  const handleFiftyFifty = () => {
    if (hiddenOptions.length > 0) return;
    const success = useLifeline("fifty_fifty");
    if (!success) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const wrongIndices = currentQ.options.map((_, i) => i).filter(i => i !== currentQ.correctIndex);
    const toHide = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);
    setHiddenOptions(toHide);
  };

  const handleFreeze = () => {
    const success = useLifeline("time_freeze");
    if (!success) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setFrozen(true);
    clearInterval(timerRef.current);
    setTimeout(() => { setFrozen(false); startTimer(); }, 10000);
  };

  const handleShield = () => {
    const success = useLifeline("shield");
    if (!success) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShieldActive(true);
  };

  const timerColor = timer <= 5 ? Colors.dark.error : timer <= 10 ? Colors.dark.warning : Colors.dark.primary;
  const progressStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value}%` }));
  const playerWinning = score >= opponentScore;

  if (gameOver) {
    const won = score >= opponentScore;
    return (
      <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
        <LinearGradient
          colors={won ? [Colors.dark.gold + "20", Colors.dark.background] : [Colors.dark.error + "10", Colors.dark.background]}
          style={StyleSheet.absoluteFill}
        />
        <ScrollView contentContainerStyle={[styles.resultContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }]}>
          <Animated.View entering={FadeInDown.duration(600)} style={styles.resultHeader}>
            <Ionicons name={won ? "trophy" : "sad"} size={60} color={won ? Colors.dark.gold : Colors.dark.error} />
            <Text style={styles.resultLabel}>{won ? "فوز!" : "خسارة"}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.vsResult}>
            <View style={[styles.vsPlayer, playerWinning && styles.vsPlayerWin]}>
              <Text style={styles.vsPlayerName}>{profile.name}</Text>
              <Text style={[styles.vsScore, playerWinning && { color: Colors.dark.gold }]}>{score}</Text>
            </View>
            <View style={styles.vsCenter}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            <View style={[styles.vsPlayer, !playerWinning && styles.vsPlayerWin]}>
              <Text style={styles.vsPlayerName}>{opponentName}</Text>
              <Text style={[styles.vsScore, !playerWinning && { color: Colors.dark.gold }]}>{opponentScore}</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(350)}>
            <AdBanner size="banner" style={{ marginHorizontal: 0 }} />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(400)}>
            <Pressable onPress={() => router.replace("/(tabs)")} style={({ pressed }) => [styles.exitBtn, pressed && { opacity: 0.8 }]}>
              <LinearGradient colors={["#00E5FF", "#0091EA"]} style={styles.exitGradient}>
                <Text style={styles.exitText}>العودة للرئيسية</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <View style={styles.vsHeader}>
        <View style={[styles.playerSide, playerWinning && styles.playerSideWin]}>
          <Text style={styles.playerSideName} numberOfLines={1}>{profile.name}</Text>
          <Text style={[styles.playerSideScore, playerWinning && { color: Colors.dark.gold }]}>{score}</Text>
        </View>
        <View style={styles.vsMiddle}>
          <Text style={styles.vsMiddleText}>VS</Text>
          <Text style={styles.questionCounter}>{currentIdx + 1}/{questions.length}</Text>
        </View>
        <View style={[styles.playerSide, !playerWinning && styles.playerSideWin]}>
          <Text style={styles.playerSideName} numberOfLines={1}>{opponentName}</Text>
          <Text style={[styles.playerSideScore, !playerWinning && { color: Colors.dark.gold }]}>{opponentScore}</Text>
          {opponentAnswered && (
            <View style={styles.answeredBadge}>
              <Ionicons name="checkmark" size={10} color={Colors.dark.success} />
            </View>
          )}
        </View>
      </View>

      <View style={styles.timerRow}>
        {frozen && <Ionicons name="snow" size={14} color="#4ECDC4" />}
        <Text style={[styles.timerText, { color: timerColor }]}>{timer} ث</Text>
      </View>

      <View style={styles.progressBarWrap}>
        <Animated.View style={[styles.progressBarFill, progressStyle, { backgroundColor: timerColor }]} />
      </View>

      <VoiceChatBar
        players={voicePlayers}
        onToggleMic={toggleMic}
        onToggleMutePlayer={toggleMutePlayer}
        isMicOn={isMicOn}
      />

      <ScrollView style={styles.gameBody} contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }}>
        <Animated.View entering={FadeIn.duration(300)} key={currentIdx}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{currentQ.category}</Text>
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
              if (isCorrect) { bgColor = Colors.dark.success + "25"; borderColor = Colors.dark.success; }
              else if (isWrong) { bgColor = Colors.dark.error + "25"; borderColor = Colors.dark.error; }
              return (
                <Pressable
                  key={idx}
                  onPress={() => handleAnswer(idx)}
                  disabled={selectedAnswer !== null}
                  style={({ pressed }) => [styles.optionBtn, { backgroundColor: bgColor, borderColor }, pressed && selectedAnswer === null && { transform: [{ scale: 0.98 }] }]}
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

        <View style={styles.bottomBar}>
          <View style={styles.lifelinesBar}>
            <LifelineBtn icon="cut-outline" count={lifelines.fifty_fifty} color="#FF6B6B" onPress={handleFiftyFifty} disabled={selectedAnswer !== null || hiddenOptions.length > 0} />
            <LifelineBtn icon="snow-outline" count={lifelines.time_freeze} color="#4ECDC4" onPress={handleFreeze} disabled={selectedAnswer !== null || frozen} />
            <LifelineBtn icon="shield-checkmark-outline" count={lifelines.shield} color="#A855F7" onPress={handleShield} disabled={selectedAnswer !== null || shieldActive} />
          </View>
          <Pressable onPress={() => setShowChat(!showChat)} style={styles.chatToggle}>
            <Ionicons name="chatbubbles-outline" size={20} color={Colors.dark.primary} />
          </Pressable>
        </View>
      </ScrollView>

      {shieldActive && (
        <View style={styles.shieldIndicator}>
          <Ionicons name="shield-checkmark" size={14} color="#A855F7" />
          <Text style={styles.shieldText}>الدرع مفعّل</Text>
        </View>
      )}

      <ChatOverlay visible={showChat} onClose={() => setShowChat(false)} messages={messages} onSend={sendMessage} />
    </View>
  );
}

function LifelineBtn({ icon, count, color, onPress, disabled }: { icon: string; count: number; color: string; onPress: () => void; disabled: boolean }) {
  const isUsable = count > 0 && !disabled;
  return (
    <Pressable onPress={onPress} disabled={!isUsable} style={[styles.lifelineBtn, !isUsable && { opacity: 0.35 }]}>
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
  container: { flex: 1, backgroundColor: Colors.dark.background },
  vsHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  playerSide: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  playerSideWin: { borderColor: Colors.dark.gold + "50" },
  playerSideName: { fontFamily: "Rajdhani_600SemiBold", fontSize: 13, color: Colors.dark.text },
  playerSideScore: { fontFamily: "Rajdhani_700Bold", fontSize: 22, color: Colors.dark.text },
  vsMiddle: { paddingHorizontal: 12, alignItems: "center" },
  vsMiddleText: { fontFamily: "Rajdhani_700Bold", fontSize: 16, color: Colors.dark.primary },
  questionCounter: { fontFamily: "Rajdhani_500Medium", fontSize: 11, color: Colors.dark.textMuted },
  answeredBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.dark.success + "25",
    alignItems: "center",
    justifyContent: "center",
  },
  timerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 4, paddingVertical: 4 },
  timerText: { fontFamily: "Rajdhani_700Bold", fontSize: 22 },
  progressBarWrap: { height: 3, backgroundColor: Colors.dark.surfaceLight, marginHorizontal: 20, borderRadius: 2, overflow: "hidden", marginBottom: 8 },
  progressBarFill: { height: "100%", borderRadius: 2 },
  gameBody: { flex: 1, paddingHorizontal: 20 },
  categoryBadge: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, marginBottom: 10 },
  categoryText: {
    fontFamily: "Rajdhani_600SemiBold", fontSize: 13, color: Colors.dark.primary,
    backgroundColor: Colors.dark.primaryDim, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, overflow: "hidden",
  },
  questionText: { fontFamily: "Rajdhani_700Bold", fontSize: 20, color: Colors.dark.text, lineHeight: 28, marginBottom: 16 },
  optionsWrap: { gap: 8 },
  optionBtn: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 14, borderWidth: 1.5, gap: 12 },
  optionLetter: {
    width: 30, height: 30, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center", backgroundColor: Colors.dark.surfaceLight,
  },
  optionLetterText: { fontFamily: "Rajdhani_700Bold", fontSize: 13, color: Colors.dark.textSecondary },
  optionText: { fontFamily: "Rajdhani_600SemiBold", fontSize: 15, color: Colors.dark.text, flex: 1 },
  hiddenOption: { height: 58, borderRadius: 14, backgroundColor: Colors.dark.surfaceLight, opacity: 0.3 },
  bottomBar: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 16, gap: 12 },
  lifelinesBar: { flexDirection: "row", gap: 10 },
  lifelineBtn: {},
  lifelineBtnInner: {
    alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.dark.card, borderWidth: 1,
  },
  lifelineBadge: { position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  lifelineBadgeText: { fontFamily: "Rajdhani_700Bold", fontSize: 9 },
  chatToggle: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.dark.card,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.dark.border,
  },
  shieldIndicator: {
    position: "absolute", top: Platform.OS === "web" ? 200 : 180, alignSelf: "center",
    flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#A855F7" + "25",
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
  },
  shieldText: { fontFamily: "Rajdhani_600SemiBold", fontSize: 12, color: "#A855F7" },
  resultContent: { paddingHorizontal: 20, alignItems: "center" },
  resultHeader: { alignItems: "center", marginTop: 40, marginBottom: 20, gap: 8 },
  resultLabel: { fontFamily: "Rajdhani_700Bold", fontSize: 28, color: Colors.dark.text },
  vsResult: { flexDirection: "row", alignItems: "center", marginBottom: 30, gap: 16, width: "100%" },
  vsPlayer: {
    flex: 1, backgroundColor: Colors.dark.card, borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 1, borderColor: Colors.dark.border,
  },
  vsPlayerWin: { borderColor: Colors.dark.gold, borderWidth: 2 },
  vsPlayerName: { fontFamily: "Rajdhani_600SemiBold", fontSize: 16, color: Colors.dark.text, marginBottom: 4 },
  vsScore: { fontFamily: "Rajdhani_700Bold", fontSize: 32, color: Colors.dark.text },
  vsCenter: { alignItems: "center" },
  vsText: { fontFamily: "Rajdhani_700Bold", fontSize: 20, color: Colors.dark.primary },
  exitBtn: { borderRadius: 14, overflow: "hidden", marginTop: 20, width: "100%" },
  exitGradient: { paddingVertical: 16, alignItems: "center" },
  exitText: { fontFamily: "Rajdhani_700Bold", fontSize: 18, color: "#fff", letterSpacing: 1 },
});
