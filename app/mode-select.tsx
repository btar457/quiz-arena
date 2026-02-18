import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { QUESTION_CATEGORIES } from "@/lib/game-data";

type GameMode = "classic" | "1v1" | "2v2";

interface ModeOption {
  mode: GameMode;
  title: string;
  subtitle: string;
  icon: string;
  colors: string[];
  players: string;
  questions: string;
}

const MODES: ModeOption[] = [
  {
    mode: "classic",
    title: "تنافسي",
    subtitle: "تنافس مع ١٠ لاعبين",
    icon: "people",
    colors: ["#00E5FF", "#0091EA"],
    players: "١٠ لاعبين",
    questions: "٣٠ سؤال",
  },
  {
    mode: "1v1",
    title: "١ ضد ١",
    subtitle: "تحدّي مباشر مع خصم واحد",
    icon: "flash",
    colors: ["#F59E0B", "#F97316"],
    players: "لاعبان",
    questions: "١٥ سؤال",
  },
  {
    mode: "2v2",
    title: "٢ ضد ٢",
    subtitle: "فريق من اثنين ضد فريق",
    icon: "shield",
    colors: ["#A855F7", "#7C3AED"],
    players: "٤ لاعبين",
    questions: "٢٠ سؤال",
  },
];

export default function ModeSelectScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const handleSelect = (mode: GameMode) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({ pathname: "/matchmaking", params: { mode, category: selectedCategory } } as any);
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <LinearGradient
        colors={[Colors.dark.primary + "08", Colors.dark.background]}
        style={StyleSheet.absoluteFill}
      />

      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={Colors.dark.textSecondary} />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }]}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Ionicons name="game-controller" size={36} color={Colors.dark.primary} />
          <Text style={styles.title}>اختر وضع اللعب</Text>
          <Text style={styles.subtitle}>اختر الوضع والفئة التي تناسبك</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <Text style={styles.sectionLabel}>فئة الأسئلة</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            {QUESTION_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.categoryChip,
                    isSelected && { backgroundColor: cat.color + "20", borderColor: cat.color + "60" },
                  ]}
                >
                  <Ionicons name={cat.icon as any} size={16} color={isSelected ? cat.color : Colors.dark.textMuted} />
                  <Text style={[styles.categoryText, isSelected && { color: cat.color }]}>{cat.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <Text style={styles.sectionLabel}>وضع اللعب</Text>
        </Animated.View>

        <View style={styles.modesContainer}>
          {MODES.map((m, idx) => (
            <Animated.View key={m.mode} entering={FadeInDown.duration(500).delay(300 + idx * 120)}>
              <Pressable
                onPress={() => handleSelect(m.mode)}
                style={({ pressed }) => [styles.modeCard, pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 }]}
              >
                <LinearGradient
                  colors={[m.colors[0] + "18", m.colors[1] + "08"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modeGradient}
                >
                  <View style={styles.modeLeft}>
                    <View style={[styles.modeIconWrap, { backgroundColor: m.colors[0] + "20" }]}>
                      <Ionicons name={m.icon as any} size={28} color={m.colors[0]} />
                    </View>
                    <View style={styles.modeInfo}>
                      <Text style={styles.modeTitle}>{m.title}</Text>
                      <Text style={styles.modeSubtitle}>{m.subtitle}</Text>
                      <View style={styles.modeTags}>
                        <View style={[styles.modeTag, { backgroundColor: m.colors[0] + "15" }]}>
                          <Ionicons name="people-outline" size={10} color={m.colors[0]} />
                          <Text style={[styles.modeTagText, { color: m.colors[0] }]}>{m.players}</Text>
                        </View>
                        <View style={[styles.modeTag, { backgroundColor: m.colors[0] + "15" }]}>
                          <Ionicons name="help-circle-outline" size={10} color={m.colors[0]} />
                          <Text style={[styles.modeTagText, { color: m.colors[0] }]}>{m.questions}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color={m.colors[0]} />
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.featureBadge}>
            <Ionicons name="mic" size={14} color={Colors.dark.primary} />
            <Text style={styles.featureText}>دردشة صوتية ونصية متاحة في جميع الأوضاع</Text>
          </View>
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
  scrollContent: {
    paddingHorizontal: 0,
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "web" ? 74 : 56,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 16,
    gap: 6,
  },
  title: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 28,
    color: Colors.dark.text,
    marginTop: 8,
  },
  subtitle: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  sectionLabel: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  categoriesRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 16,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  categoryText: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 13,
    color: Colors.dark.textMuted,
  },
  modesContainer: {
    paddingHorizontal: 20,
    gap: 14,
  },
  modeCard: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modeGradient: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modeLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 14,
  },
  modeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modeInfo: {
    flex: 1,
    gap: 2,
  },
  modeTitle: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 22,
    color: Colors.dark.text,
  },
  modeSubtitle: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  modeTags: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  modeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  modeTagText: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 11,
  },
  footer: {
    alignItems: "center",
    paddingTop: 20,
  },
  featureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.dark.primaryDim,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  featureText: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 12,
    color: Colors.dark.primary,
  },
});
