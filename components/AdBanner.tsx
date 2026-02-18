import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";

interface AdBannerProps {
  size?: "banner" | "largeBanner" | "mediumRectangle";
  style?: any;
}

const AD_TEXTS = [
  "ساحة المعرفة - تحدى أصدقاءك!",
  "اكتشف عروض المتجر الحصرية",
  "ارتقِ في التصنيف وكن الأفضل",
  "احصل على مساعدات إضافية",
  "انضم للموسم الجديد الآن",
];

export default function AdBanner({ size = "banner", style }: AdBannerProps) {
  const [adIndex, setAdIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 800);
    const rotate = setInterval(() => {
      setAdIndex(prev => (prev + 1) % AD_TEXTS.length);
    }, 8000);
    return () => {
      clearTimeout(timer);
      clearInterval(rotate);
    };
  }, []);

  const height = size === "banner" ? 60 : size === "largeBanner" ? 100 : 250;

  if (!loaded) {
    return (
      <View style={[styles.container, { height }, style]}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>جاري تحميل الإعلان...</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} style={[styles.container, { height }, style]}>
      <LinearGradient
        colors={["#1A2744", "#0F1B33"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.adGradient}
      >
        <View style={styles.adContent}>
          <View style={styles.adLeft}>
            <View style={styles.adIconWrap}>
              <Ionicons name="megaphone" size={size === "banner" ? 18 : 24} color="#00E5FF" />
            </View>
            <View style={styles.adTextWrap}>
              <Text style={styles.adLabel}>إعلان</Text>
              <Text style={styles.adText} numberOfLines={1}>{AD_TEXTS[adIndex]}</Text>
            </View>
          </View>
          <View style={styles.adBadge}>
            <Text style={styles.adBadgeText}>Ad</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.surface,
  },
  loadingText: {
    fontFamily: "Rajdhani_400Regular",
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  adGradient: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  adContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  adLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  adIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#00E5FF" + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  adTextWrap: {
    flex: 1,
  },
  adLabel: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 10,
    color: Colors.dark.textMuted,
    letterSpacing: 1,
  },
  adText: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 14,
    color: Colors.dark.text,
  },
  adBadge: {
    backgroundColor: "#FFD700" + "20",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  adBadgeText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 11,
    color: "#FFD700",
  },
});
