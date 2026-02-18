import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, View, Pressable, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useGame } from "@/lib/game-context";
import { getGameQuestionsByCategory, BOT_NAMES, getRankFromXP } from "@/lib/game-data";
import ChatOverlay, { useSimulatedChat } from "@/components/ChatOverlay";
import VoiceChatBar, { useSimulatedVoice } from "@/components/VoiceChatBar";
import { playSound } from "@/lib/sounds";
import AdBanner from "@/components/AdBanner";

const TIME_PER_QUESTION = 15;

export default function Game2v2Screen() {
  const insets = useSafeAreaInsets();
  const { profile, useLifeline, addMatchResult } = useGame();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [questions] = useState(() => getGameQuestionsByCategory(20, category || "all"));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [teamScore, setTeamScore] = useState(0);
  const [enemyScore, setEnemyScore] = useState(0);
  const [timer, setTimer] = useState(TIME_PER_QUESTION);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [shieldActive, setShieldActive] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const shuffledBots = useRef([...BOT_NAMES].sort(() => Math.random() - 0.5).slice(0, 3));
  const [teammateName] = useState(shuffledBots.current[0]);
  const [enemy1Name] = useState(shuffledBots.current[1]);
  const [enemy2Name] = useState(shuffledBots.current[2]);

  const [teammateAnswered, setTeammateAnswered] = useState(false);
  const [teamAnswerLocked, setTeamAnswerLocked] = useState(false);
  const [teamAnsweredBy, setTeamAnsweredBy] = useState<string | null>(null);
  const [enemyAnswered, setEnemyAnswered] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const progressWidth = useSharedValue(100);

  const allBotNames = [teammateName, enemy1Name, enemy2Name];
  const { messages, sendMessage } = useSimulatedChat(allBotNames, true);
  const { voicePlayers, isMicOn, toggleMic, toggleMutePlayer } = useSimulatedVoice([teammateName, enemy1Name, enemy2Name]);

  const currentQ = questions[currentIdx];
  const lifelines = {
    fifty_fifty: profile.lifelines.fifty_fifty || 0,
    time_freeze: profile.lifelines.time_freeze || 0,
    shield: profile.lifelines.shield || 0,
  };

  useEffect(() => {
    if (gameOver) return;
    startTimer();
    setTeammateAnswered(false);
    setTeamAnswerLocked(false);
    setTeamAnsweredBy(null);
    setEnemyAnswered(false);

    const teammateDelay = 3000 + Math.random() * 7000;
    const enemyDelay = 2000 + Math.random() * 8000;

    const teammateTimeout = setTimeout(() => {
      setTeammateAnswered(true);
      if (!teamAnswerLocked) {
        setTeamAnswerLocked(true);
        setTeamAnsweredBy(teammateName);
        const correct = Math.random() > 0.45;
        if (correct) {
          setTeamScore(prev => prev + Math.floor(Math.random() * 70 + 40));
        }
      }
    }, teammateDelay);

    const enemyTimeout = setTimeout(() => {
      setEnemyAnswered(true);
      const correct = Math.random() > 0.4;
      if (correct) {
        setEnemyScore(prev => prev + Math.floor(Math.random() * 80 + 40));
      }
    }, enemyDelay);

    return () => {
      clearInterval(timerRef.current);
      clearTimeout(teammateTimeout);
      clearTimeout(enemyTimeout);
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
    if (selectedAnswer !== null || gameOver || teamAnswerLocked) return;
    clearInterval(timerRef.current);
    setSelectedAnswer(idx);
    setTeamAnswerLocked(true);
    setTeamAnsweredBy(profile.name);

    const isCorrect = idx === currentQ.correctIndex;
    setCorrectAnswer(currentQ.correctIndex);

    if (isCorrect) {
      const points = Math.max(50, timer * 10);
      setTeamScore(prev => prev + points);
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
    const won = teamScore >= enemyScore;
    const position = won ? 1 : 2;
    const xpGained = won ? 45 : 12;
    const coinsGained = won ? 80 : 20;
    addMatchResult({
      id: `m_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      position,
      score: teamScore,
      totalPlayers: 4,
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
    setHiddenOptions(wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2));
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
  const teamWinning = teamScore >= enemyScore;

  if (gameOver) {
    const won = teamScore >= enemyScore;
    return (
      <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
        <LinearGradient
          colors={won ? [Colors.dark.gold + "20", Colors.dark.background] : [Colors.dark.error + "10", Colors.dark.background]}
          style={StyleSheet.absoluteFill}
        />
        <ScrollView contentContainerStyle={[styles.resultContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }]}>
          <Animated.View entering={FadeInDown.duration(600)} style={styles.resultHeader}>
            <Ionicons name={won ? "trophy" : "sad"} size={60} color={won ? Colors.dark.gold : Colors.dark.error} />
            <Text style={styles.resultLabel}>{won ? "فوز الفريق!" : "خسارة"}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.teamsResult}>
            <View style={[styles.teamResultCard, teamWinning && styles.teamResultWin]}>
              <Text style={styles.teamResultTitle}>فريقك</Text>
              <View style={styles.teamMembers}>
                <Text style={styles.teamMemberName}>{profile.name}</Text>
                <Text style={styles.teamMemberName}>{teammateName}</Text>
              </View>
              <Text style={[styles.teamResultScore, teamWinning && { color: Colors.dark.gold }]}>{teamScore}</Text>
            </View>

            <View style={styles.vsCenter}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            <View style={[styles.teamResultCard, !teamWinning && styles.teamResultWin]}>
              <Text style={styles.teamResultTitle}>الخصم</Text>
              <View style={styles.teamMembers}>
                <Text style={styles.teamMemberName}>{enemy1Name}</Text>
                <Text style={styles.teamMemberName}>{enemy2Name}</Text>
              </View>
              <Text style={[styles.teamResultScore, !teamWinning && { color: Colors.dark.gold }]}>{enemyScore}</Text>
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
      <View style={styles.teamsHeader}>
        <View style={[styles.teamSide, teamWinning && styles.teamSideWin]}>
          <View style={styles.teamBadge}>
            <Ionicons name="shield" size={14} color="#A855F7" />
            <Text style={styles.teamBadgeText}>فريقك</Text>
          </View>
          <Text style={[styles.teamHeaderScore, teamWinning && { color: Colors.dark.gold }]}>{teamScore}</Text>
          <View style={styles.teamMembersRow}>
            <View style={styles.memberChip}>
              <View style={[styles.memberDot, { backgroundColor: Colors.dark.primary }]} />
              <Text style={styles.memberName} numberOfLines={1}>{profile.name}</Text>
            </View>
            <View style={styles.memberChip}>
              <View style={[styles.memberDot, { backgroundColor: "#A855F7" }]} />
              <Text style={styles.memberName} numberOfLines={1}>{teammateName}</Text>
              {teammateAnswered && <Ionicons name="checkmark-circle" size={10} color={Colors.dark.success} />}
            </View>
          </View>
        </View>

        <View style={styles.vsMiddle}>
          <Text style={styles.vsMiddleText}>VS</Text>
          <Text style={styles.questionCounter}>{currentIdx + 1}/{questions.length}</Text>
        </View>

        <View style={[styles.teamSide, !teamWinning && styles.teamSideWin]}>
          <View style={styles.teamBadge}>
            <Ionicons name="flash" size={14} color="#F59E0B" />
            <Text style={styles.teamBadgeText}>الخصم</Text>
          </View>
          <Text style={[styles.teamHeaderScore, !teamWinning && { color: Colors.dark.gold }]}>{enemyScore}</Text>
          <View style={styles.teamMembersRow}>
            <View style={styles.memberChip}>
              <View style={[styles.memberDot, { backgroundColor: "#F59E0B" }]} />
              <Text style={styles.memberName} numberOfLines={1}>{enemy1Name}</Text>
            </View>
            <View style={styles.memberChip}>
              <View style={[styles.memberDot, { backgroundColor: "#EF4444" }]} />
              <Text style={styles.memberName} numberOfLines={1}>{enemy2Name}</Text>
              {enemyAnswered && <Ionicons name="checkmark-circle" size={10} color={Colors.dark.success} />}
            </View>
          </View>
        </View>
      </View>

      {teamAnswerLocked && teamAnsweredBy && (
        <View style={styles.lockedBanner}>
          <Ionicons name="lock-closed" size={12} color={Colors.dark.warning} />
          <Text style={styles.lockedText}>أجاب {teamAnsweredBy === profile.name ? "أنت" : teamAnsweredBy} عن الفريق</Text>
        </View>
      )}

      <View style={styles.timerRow}>
        {frozen && <Ionicons name="snow" size={14} color="#4ECDC4" />}
        <Text style={[styles.timerText, { color: timerColor }]}>{timer} ث</Text>
      </View>

      <View style={styles.progressBarWrap}>
        <Animated.View style={[styles.progressBarFill, progressStyle, { backgroundColor: timerColor }]} />
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <VoiceChatBar
          players={voicePlayers}
          onToggleMic={toggleMic}
          onToggleMutePlayer={toggleMutePlayer}
          isMicOn={isMicOn}
        />
      </View>

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
              const isDisabled = selectedAnswer !== null || (teamAnswerLocked && teamAnsweredBy !== profile.name);
              return (
                <Pressable
                  key={idx}
                  onPress={() => handleAnswer(idx)}
                  disabled={isDisabled}
                  style={({ pressed }) => [
                    styles.optionBtn,
                    { backgroundColor: bgColor, borderColor },
                    isDisabled && !isCorrect && !isWrong && { opacity: 0.6 },
                    pressed && !isDisabled && { transform: [{ scale: 0.98 }] },
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

        <View style={styles.bottomBar}>
          <View style={styles.lifelinesBar}>
            <LifelineBtn icon="cut-outline" count={lifelines.fifty_fifty} color="#FF6B6B" onPress={handleFiftyFifty} disabled={selectedAnswer !== null || hiddenOptions.length > 0 || teamAnswerLocked} />
            <LifelineBtn icon="snow-outline" count={lifelines.time_freeze} color="#4ECDC4" onPress={handleFreeze} disabled={selectedAnswer !== null || frozen || teamAnswerLocked} />
            <LifelineBtn icon="shield-checkmark-outline" count={lifelines.shield} color="#A855F7" onPress={handleShield} disabled={selectedAnswer !== null || shieldActive || teamAnswerLocked} />
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

      <ChatOverlay visible={showChat} onClose={() => setShowChat(false)} messages={messages} onSend={sendMessage} teamMode />
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
  teamsHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  teamSide: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  teamSideWin: { borderColor: Colors.dark.gold + "50" },
  teamBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  teamBadgeText: { fontFamily: "Rajdhani_600SemiBold", fontSize: 11, color: Colors.dark.textSecondary },
  teamHeaderScore: { fontFamily: "Rajdhani_700Bold", fontSize: 24, color: Colors.dark.text },
  teamMembersRow: { gap: 2, marginTop: 4, width: "100%" },
  memberChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  memberDot: { width: 6, height: 6, borderRadius: 3 },
  memberName: { fontFamily: "Rajdhani_500Medium", fontSize: 10, color: Colors.dark.textMuted, flex: 1 },
  vsMiddle: { paddingHorizontal: 8, alignItems: "center", paddingTop: 20 },
  vsMiddleText: { fontFamily: "Rajdhani_700Bold", fontSize: 16, color: Colors.dark.primary },
  questionCounter: { fontFamily: "Rajdhani_500Medium", fontSize: 11, color: Colors.dark.textMuted },
  lockedBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: Colors.dark.warning + "15", paddingVertical: 6, marginHorizontal: 20, borderRadius: 10,
  },
  lockedText: { fontFamily: "Rajdhani_600SemiBold", fontSize: 12, color: Colors.dark.warning },
  timerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 4, paddingVertical: 4 },
  timerText: { fontFamily: "Rajdhani_700Bold", fontSize: 22 },
  progressBarWrap: { height: 3, backgroundColor: Colors.dark.surfaceLight, marginHorizontal: 20, borderRadius: 2, overflow: "hidden", marginBottom: 8 },
  progressBarFill: { height: "100%", borderRadius: 2 },
  gameBody: { flex: 1, paddingHorizontal: 20 },
  categoryBadge: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 8 },
  categoryText: {
    fontFamily: "Rajdhani_600SemiBold", fontSize: 13, color: Colors.dark.primary,
    backgroundColor: Colors.dark.primaryDim, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, overflow: "hidden",
  },
  questionText: { fontFamily: "Rajdhani_700Bold", fontSize: 19, color: Colors.dark.text, lineHeight: 27, marginBottom: 14 },
  optionsWrap: { gap: 8 },
  optionBtn: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 14, borderWidth: 1.5, gap: 12 },
  optionLetter: {
    width: 30, height: 30, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center", backgroundColor: Colors.dark.surfaceLight,
  },
  optionLetterText: { fontFamily: "Rajdhani_700Bold", fontSize: 13, color: Colors.dark.textSecondary },
  optionText: { fontFamily: "Rajdhani_600SemiBold", fontSize: 15, color: Colors.dark.text, flex: 1 },
  hiddenOption: { height: 58, borderRadius: 14, backgroundColor: Colors.dark.surfaceLight, opacity: 0.3 },
  bottomBar: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 14, gap: 12 },
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
    position: "absolute", top: Platform.OS === "web" ? 250 : 230, alignSelf: "center",
    flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#A855F7" + "25",
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
  },
  shieldText: { fontFamily: "Rajdhani_600SemiBold", fontSize: 12, color: "#A855F7" },
  resultContent: { paddingHorizontal: 20, alignItems: "center" },
  resultHeader: { alignItems: "center", marginTop: 40, marginBottom: 20, gap: 8 },
  resultLabel: { fontFamily: "Rajdhani_700Bold", fontSize: 28, color: Colors.dark.text },
  teamsResult: { flexDirection: "row", alignItems: "center", marginBottom: 30, gap: 12, width: "100%" },
  teamResultCard: {
    flex: 1, backgroundColor: Colors.dark.card, borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, borderColor: Colors.dark.border,
  },
  teamResultWin: { borderColor: Colors.dark.gold, borderWidth: 2 },
  teamResultTitle: { fontFamily: "Rajdhani_700Bold", fontSize: 14, color: Colors.dark.textSecondary, marginBottom: 4 },
  teamMembers: { gap: 2, marginBottom: 8 },
  teamMemberName: { fontFamily: "Rajdhani_500Medium", fontSize: 12, color: Colors.dark.text, textAlign: "center" },
  teamResultScore: { fontFamily: "Rajdhani_700Bold", fontSize: 30, color: Colors.dark.text },
  vsCenter: { alignItems: "center" },
  vsText: { fontFamily: "Rajdhani_700Bold", fontSize: 18, color: Colors.dark.primary },
  exitBtn: { borderRadius: 14, overflow: "hidden", marginTop: 20, width: "100%" },
  exitGradient: { paddingVertical: 16, alignItems: "center" },
  exitText: { fontFamily: "Rajdhani_700Bold", fontSize: 18, color: "#fff", letterSpacing: 1 },
});
