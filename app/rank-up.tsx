import React, { useEffect } from "react";
import { StyleSheet, Text, View, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence } from "react-native-reanimated";
import Colors from "@/constants/colors";

export default function RankUpScreen() {
  const { rank, color, icon } = useLocalSearchParams<{ rank: string; color: string; icon: string }>();

  const scale = useSharedValue(0.5);
  const glow = useSharedValue(0.3);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scale.value = withSequence(
      withTiming(1.2, { duration: 600 }),
      withTiming(1, { duration: 300 }),
    );
    glow.value = withRepeat(withTiming(1, { duration: 1500 }), -1, true);
    rotate.value = withRepeat(withTiming(360, { duration: 8000 }), -1, false);
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: glow.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }, { scale: 1 + glow.value * 0.1 }],
  }));

  const rankColor = color || Colors.dark.gold;
  const rankIcon = icon || "trophy-outline";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[rankColor + "30", Colors.dark.background, Colors.dark.background]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <Animated.View style={[styles.ring, ringStyle, { borderColor: rankColor + "40" }]}>
          <Animated.View style={[styles.iconWrap, iconStyle, { backgroundColor: rankColor + "20" }]}>
            <Ionicons name={rankIcon as any} size={64} color={rankColor} />
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(400)}>
          <Text style={styles.congrats}>ترقية!</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(600)}>
          <Text style={[styles.rankName, { color: rankColor }]}>{rank || "رتبة جديدة"}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(800)}>
          <Text style={styles.subtitle}>تم الاعتراف بمهاراتك. واصل التسلّق!</Text>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(600).delay(1200)}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.continueBtn, pressed && { opacity: 0.8 }]}
          >
            <LinearGradient
              colors={[rankColor, rankColor + "AA"]}
              style={styles.continueBtnGradient}
            >
              <Text style={styles.continueText}>متابعة</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  ring: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  congrats: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 22,
    color: Colors.dark.textSecondary,
    letterSpacing: 4,
  },
  rankName: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 36,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Rajdhani_400Regular",
    fontSize: 16,
    color: Colors.dark.textMuted,
    textAlign: "center",
  },
  continueBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 24,
  },
  continueBtnGradient: {
    paddingVertical: 16,
    paddingHorizontal: 50,
    alignItems: "center",
  },
  continueText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 18,
    color: "#fff",
    letterSpacing: 2,
  },
});
