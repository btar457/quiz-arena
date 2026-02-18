import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/auth-context";
import { LIFELINES } from "@/lib/game-data";
import AdBanner from "@/components/AdBanner";
import { showRewardedAd } from "@/lib/ads";

const COIN_PACKS = [
  { id: "pack1", coins: 200, label: "مبتدئ", price: "مجاني يومياً", color: "#38BDF8", icon: "gift-outline" as const },
  { id: "pack2", coins: 500, label: "أساسي", price: "شاهد إعلان", color: "#10B981", icon: "play-circle-outline" as const },
  { id: "pack3", coins: 1500, label: "محترف", price: "$1.99", color: "#A855F7", icon: "rocket-outline" as const },
  { id: "pack4", coins: 5000, label: "أسطوري", price: "$4.99", color: "#FFD700", icon: "diamond-outline" as const },
];

const FRAMES = [
  { id: "frame_fire", name: "إطار النار", color: "#EF4444", icon: "flame" as const, price: 300 },
  { id: "frame_ice", name: "إطار الجليد", color: "#38BDF8", icon: "snow" as const, price: 300 },
  { id: "frame_gold", name: "إطار ذهبي", color: "#FFD700", icon: "star" as const, price: 500 },
  { id: "frame_neon", name: "إطار نيون", color: "#A855F7", icon: "flash" as const, price: 500 },
  { id: "frame_diamond", name: "إطار ألماسي", color: "#00E5FF", icon: "diamond" as const, price: 800 },
  { id: "frame_crown", name: "إطار ملكي", color: "#F59E0B", icon: "ribbon" as const, price: 1000 },
];

const THEMES = [
  { id: "theme_ocean", name: "محيط أزرق", colors: ["#0EA5E9", "#0284C7"], price: 400 },
  { id: "theme_sunset", name: "غروب ناري", colors: ["#F97316", "#DC2626"], price: 400 },
  { id: "theme_forest", name: "غابة خضراء", colors: ["#10B981", "#059669"], price: 400 },
  { id: "theme_galaxy", name: "مجرة بنفسجية", colors: ["#8B5CF6", "#6D28D9"], price: 600 },
  { id: "theme_aurora", name: "شفق قطبي", colors: ["#06B6D4", "#A855F7"], price: 800 },
  { id: "theme_royal", name: "ملكي ذهبي", colors: ["#FFD700", "#B8860B"], price: 1000 },
];

const LIMITED_OFFERS = [
  { id: "offer_1", name: "حزمة البداية", description: "٣ مساعدات + ٥٠٠ عملة", icon: "gift-outline" as const, originalPrice: 800, salePrice: 400, color: "#EF4444", endsIn: "٢ ساعة" },
  { id: "offer_2", name: "حزمة المحترف", description: "٥ مساعدات + ١٠٠٠ عملة + إطار ناري", icon: "rocket-outline" as const, originalPrice: 1500, salePrice: 750, color: "#F59E0B", endsIn: "٥ ساعات" },
  { id: "offer_3", name: "عرض نهاية الأسبوع", description: "مضاعفة الخبرة لمدة ٢٤ ساعة", icon: "flash-outline" as const, originalPrice: 600, salePrice: 300, color: "#A855F7", endsIn: "١ يوم" },
];

type TabType = "lifelines" | "coins" | "frames" | "themes" | "offers";

export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const { profile, buyLifeline, addCoins } = useGame();
  const { user, updateUser } = useAuth();
  const [boughtToday, setBoughtToday] = useState(false);
  const [watchingAd, setWatchingAd] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("lifelines");

  const ownedFrames: string[] = (user?.ownedFrames as string[]) || ["default"];
  const ownedThemes: string[] = (user?.ownedThemes as string[]) || ["default"];
  const equippedFrame = user?.equippedFrame || "default";
  const equippedTheme = user?.equippedTheme || "default";

  const handleBuyLifeline = (lifelineId: string) => {
    const lifeline = LIFELINES.find(l => l.id === lifelineId);
    if (!lifeline) return;
    if (profile.coins < lifeline.price) {
      Alert.alert("عملات غير كافية", `تحتاج ${lifeline.price} عملة لشراء ${lifeline.name}.`);
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    buyLifeline(lifelineId);
  };

  const handleClaimDaily = () => {
    if (boughtToday) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addCoins(200);
    setBoughtToday(true);
  };

  const handleWatchAd = async () => {
    if (watchingAd) return;
    setWatchingAd(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await showRewardedAd();
      if (result.rewarded) {
        addCoins(result.amount);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("مكافأة", `حصلت على ${result.amount} عملة!`);
      }
    } catch {
      Alert.alert("خطأ", "لم يتم تحميل الإعلان. حاول مرة أخرى.");
    } finally {
      setWatchingAd(false);
    }
  };

  const handleBuyFrame = (frame: typeof FRAMES[0]) => {
    if (ownedFrames.includes(frame.id)) {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updateUser({ equippedFrame: frame.id });
      return;
    }
    if (profile.coins < frame.price) {
      Alert.alert("عملات غير كافية", `تحتاج ${frame.price} عملة.`);
      return;
    }
    Alert.alert("شراء إطار", `هل تريد شراء ${frame.name} مقابل ${frame.price} عملة؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "شراء",
        onPress: () => {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          addCoins(-frame.price);
          updateUser({
            ownedFrames: [...ownedFrames, frame.id],
            equippedFrame: frame.id,
          });
        },
      },
    ]);
  };

  const handleBuyTheme = (theme: typeof THEMES[0]) => {
    if (ownedThemes.includes(theme.id)) {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updateUser({ equippedTheme: theme.id });
      return;
    }
    if (profile.coins < theme.price) {
      Alert.alert("عملات غير كافية", `تحتاج ${theme.price} عملة.`);
      return;
    }
    Alert.alert("شراء واجهة", `هل تريد شراء ${theme.name} مقابل ${theme.price} عملة؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "شراء",
        onPress: () => {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          addCoins(-theme.price);
          updateUser({
            ownedThemes: [...ownedThemes, theme.id],
            equippedTheme: theme.id,
          });
        },
      },
    ]);
  };

  const handleBuyOffer = (offer: typeof LIMITED_OFFERS[0]) => {
    if (profile.coins < offer.salePrice) {
      Alert.alert("عملات غير كافية", `تحتاج ${offer.salePrice} عملة لشراء ${offer.name}.`);
      return;
    }
    Alert.alert("شراء عرض", `هل تريد شراء ${offer.name} مقابل ${offer.salePrice} عملة؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "شراء",
        onPress: () => {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          addCoins(-offer.salePrice);
          Alert.alert("تم الشراء", `حصلت على ${offer.name}!`);
        },
      },
    ]);
  };

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: "lifelines", label: "مساعدات", icon: "shield-checkmark" },
    { key: "coins", label: "عملات", icon: "diamond" },
    { key: "frames", label: "إطارات", icon: "image" },
    { key: "themes", label: "واجهات", icon: "color-palette" },
    { key: "offers", label: "عروض", icon: "pricetag-outline" },
  ];

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 100 }]}
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.title}>المتجر</Text>
          <View style={styles.balanceCard}>
            <LinearGradient
              colors={[Colors.dark.gold + "20", Colors.dark.gold + "05"]}
              style={styles.balanceGradient}
            >
              <Ionicons name="diamond" size={28} color={Colors.dark.gold} />
              <Text style={styles.balanceAmount}>{profile.coins}</Text>
              <Text style={styles.balanceLabel}>عملات متاحة</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <View style={styles.tabBar}>
            {tabs.map(tab => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={18}
                  color={activeTab === tab.key ? Colors.dark.primary : Colors.dark.textMuted}
                />
                <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {activeTab === "lifelines" && (
          <Animated.View entering={FadeInDown.duration(400)}>
            {LIFELINES.map((lifeline, idx) => {
              const owned = profile.lifelines[lifeline.id] || 0;
              const canAfford = profile.coins >= lifeline.price;
              return (
                <Animated.View key={lifeline.id} entering={FadeInDown.duration(400).delay(idx * 80)}>
                  <View style={styles.lifelineCard}>
                    <View style={styles.lifelineIconWrap}>
                      <LinearGradient
                        colors={[lifelineColors[idx] + "30", lifelineColors[idx] + "10"]}
                        style={styles.lifelineIcon}
                      >
                        <Ionicons name={lifeline.icon as any} size={26} color={lifelineColors[idx]} />
                      </LinearGradient>
                    </View>
                    <View style={styles.lifelineInfo}>
                      <Text style={styles.lifelineName}>{lifeline.name}</Text>
                      <Text style={styles.lifelineDesc}>{lifeline.description}</Text>
                      <Text style={styles.lifelineOwned}>مملوك: {owned}</Text>
                    </View>
                    <Pressable
                      onPress={() => handleBuyLifeline(lifeline.id)}
                      style={({ pressed }) => [
                        styles.buyBtn,
                        { backgroundColor: canAfford ? Colors.dark.primary : Colors.dark.surfaceLight },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Ionicons name="diamond" size={12} color={canAfford ? "#000" : Colors.dark.textMuted} />
                      <Text style={[styles.buyBtnText, { color: canAfford ? "#000" : Colors.dark.textMuted }]}>
                        {lifeline.price}
                      </Text>
                    </Pressable>
                  </View>
                </Animated.View>
              );
            })}
          </Animated.View>
        )}

        {activeTab === "coins" && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={styles.packsGrid}>
              {COIN_PACKS.map((pack, idx) => (
                <Animated.View key={pack.id} entering={FadeIn.duration(400).delay(idx * 100)} style={styles.packCardWrap}>
                  <Pressable
                    onPress={idx === 0 ? handleClaimDaily : idx === 1 ? handleWatchAd : undefined}
                    style={({ pressed }) => [
                      styles.packCard,
                      pressed && (idx === 0 || idx === 1) && { transform: [{ scale: 0.97 }] },
                    ]}
                  >
                    <LinearGradient
                      colors={[pack.color + "25", pack.color + "08"]}
                      style={styles.packGradient}
                    >
                      <Ionicons name={pack.icon} size={32} color={pack.color} />
                      <Text style={[styles.packCoins, { color: pack.color }]}>{pack.coins}</Text>
                      <Text style={styles.packLabel}>{pack.label}</Text>
                      <View style={[styles.packPrice, { backgroundColor: pack.color + "20" }]}>
                        <Text style={[styles.packPriceText, { color: pack.color }]}>
                          {idx === 0 && boughtToday ? "تم الاستلام" : idx === 1 && watchingAd ? "جاري..." : pack.price}
                        </Text>
                      </View>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              ))}
            </View>

            <View style={styles.adBanner}>
              <LinearGradient
                colors={[Colors.dark.success + "15", Colors.dark.success + "05"]}
                style={styles.adGradient}
              >
                <Ionicons name="play-circle" size={28} color={Colors.dark.success} />
                <View style={styles.adInfo}>
                  <Text style={styles.adTitle}>شاهد إعلان واكسب</Text>
                  <Text style={styles.adDesc}>شاهد إعلان قصير واحصل على ٥٠٠ عملة</Text>
                </View>
                <Pressable
                  onPress={handleWatchAd}
                  disabled={watchingAd}
                  style={({ pressed }) => [styles.adBtn, pressed && { opacity: 0.8 }, watchingAd && { opacity: 0.5 }]}
                >
                  <Text style={styles.adBtnText}>{watchingAd ? "جاري..." : "مشاهدة"}</Text>
                </Pressable>
              </LinearGradient>
            </View>

            <AdBanner size="banner" />
          </Animated.View>
        )}

        {activeTab === "frames" && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={styles.sectionDesc}>اختر إطاراً مميزاً لملفك الشخصي</Text>
            <View style={styles.framesGrid}>
              {FRAMES.map((frame, idx) => {
                const owned = ownedFrames.includes(frame.id);
                const equipped = equippedFrame === frame.id;
                return (
                  <Animated.View key={frame.id} entering={FadeIn.duration(400).delay(idx * 80)} style={styles.frameCardWrap}>
                    <Pressable
                      onPress={() => handleBuyFrame(frame)}
                      style={({ pressed }) => [
                        styles.frameCard,
                        { borderColor: equipped ? frame.color : Colors.dark.border },
                        equipped && { borderWidth: 2 },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <View style={[styles.framePreview, { borderColor: frame.color }]}>
                        <Ionicons name={frame.icon as any} size={28} color={frame.color} />
                      </View>
                      <Text style={styles.frameName}>{frame.name}</Text>
                      {equipped ? (
                        <View style={[styles.equippedBadge, { backgroundColor: frame.color + "20" }]}>
                          <Text style={[styles.equippedText, { color: frame.color }]}>مُفعّل</Text>
                        </View>
                      ) : owned ? (
                        <View style={[styles.equippedBadge, { backgroundColor: Colors.dark.surfaceLight }]}>
                          <Text style={[styles.equippedText, { color: Colors.dark.textSecondary }]}>مملوك</Text>
                        </View>
                      ) : (
                        <View style={styles.framePriceRow}>
                          <Ionicons name="diamond" size={10} color={Colors.dark.gold} />
                          <Text style={styles.framePriceText}>{frame.price}</Text>
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {activeTab === "themes" && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={styles.sectionDesc}>غيّر مظهر التطبيق بواجهات مميزة</Text>
            {THEMES.map((theme, idx) => {
              const owned = ownedThemes.includes(theme.id);
              const equipped = equippedTheme === theme.id;
              return (
                <Animated.View key={theme.id} entering={FadeInDown.duration(400).delay(idx * 80)}>
                  <Pressable
                    onPress={() => handleBuyTheme(theme)}
                    style={({ pressed }) => [
                      styles.themeCard,
                      equipped && { borderColor: theme.colors[0], borderWidth: 2 },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <LinearGradient
                      colors={[theme.colors[0] + "40", theme.colors[1] + "20"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.themePreview}
                    >
                      <View style={[styles.themeCircle, { backgroundColor: theme.colors[0] }]} />
                      <View style={[styles.themeCircle, { backgroundColor: theme.colors[1] }]} />
                    </LinearGradient>
                    <View style={styles.themeInfo}>
                      <Text style={styles.themeName}>{theme.name}</Text>
                      {equipped ? (
                        <View style={[styles.equippedBadge, { backgroundColor: theme.colors[0] + "20" }]}>
                          <Text style={[styles.equippedText, { color: theme.colors[0] }]}>مُفعّل</Text>
                        </View>
                      ) : owned ? (
                        <View style={[styles.equippedBadge, { backgroundColor: Colors.dark.surfaceLight }]}>
                          <Text style={[styles.equippedText, { color: Colors.dark.textSecondary }]}>مملوك</Text>
                        </View>
                      ) : (
                        <View style={styles.themePriceRow}>
                          <Ionicons name="diamond" size={12} color={Colors.dark.gold} />
                          <Text style={styles.themePriceText}>{theme.price}</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.View>
        )}

        {activeTab === "offers" && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={styles.sectionDesc}>عروض لفترة محدودة - لا تفوتها!</Text>
            {LIMITED_OFFERS.map((offer, idx) => {
              const canAfford = profile.coins >= offer.salePrice;
              return (
                <Animated.View key={offer.id} entering={FadeInDown.duration(400).delay(idx * 100)}>
                  <View style={styles.offerCard}>
                    <LinearGradient
                      colors={[offer.color + "30", offer.color + "08"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.offerGradient}
                    >
                      <View style={styles.offerHeader}>
                        <View style={[styles.offerIconWrap, { backgroundColor: offer.color + "20" }]}>
                          <Ionicons name={offer.icon} size={28} color={offer.color} />
                        </View>
                        <View style={styles.offerInfo}>
                          <Text style={styles.offerName}>{offer.name}</Text>
                          <Text style={styles.offerDesc}>{offer.description}</Text>
                        </View>
                      </View>
                      <View style={styles.offerPriceRow}>
                        <View style={styles.offerPrices}>
                          <Text style={[styles.offerOriginalPrice, { color: Colors.dark.textMuted }]}>{offer.originalPrice}</Text>
                          <View style={styles.offerSalePriceRow}>
                            <Ionicons name="diamond" size={14} color={offer.color} />
                            <Text style={[styles.offerSalePrice, { color: offer.color }]}>{offer.salePrice}</Text>
                          </View>
                        </View>
                        <View style={styles.offerTimerWrap}>
                          <Ionicons name="time-outline" size={14} color={Colors.dark.textSecondary} />
                          <Text style={styles.offerTimer}>ينتهي في: {offer.endsIn}</Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => handleBuyOffer(offer)}
                        style={({ pressed }) => [
                          styles.offerBuyBtn,
                          { backgroundColor: canAfford ? offer.color : Colors.dark.surfaceLight },
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <Ionicons name="cart-outline" size={18} color={canAfford ? "#fff" : Colors.dark.textMuted} />
                        <Text style={[styles.offerBuyBtnText, { color: canAfford ? "#fff" : Colors.dark.textMuted }]}>
                          اشترِ الآن
                        </Text>
                      </Pressable>
                    </LinearGradient>
                  </View>
                </Animated.View>
              );
            })}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const lifelineColors = ["#FF6B6B", "#4ECDC4", "#A855F7"];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  scrollContent: { paddingHorizontal: 20 },
  title: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 28,
    color: Colors.dark.text,
    marginTop: 12,
    marginBottom: 16,
  },
  balanceCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.gold + "30",
    marginBottom: 16,
  },
  balanceGradient: { padding: 20, alignItems: "center", gap: 4 },
  balanceAmount: { fontFamily: "Rajdhani_700Bold", fontSize: 40, color: Colors.dark.gold },
  balanceLabel: { fontFamily: "Rajdhani_500Medium", fontSize: 14, color: Colors.dark.textSecondary },
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 11,
  },
  tabItemActive: {
    backgroundColor: Colors.dark.primary + "15",
  },
  tabLabel: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  tabLabelActive: { color: Colors.dark.primary },
  sectionDesc: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 14,
  },
  lifelineCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  lifelineIconWrap: {},
  lifelineIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  lifelineInfo: { flex: 1 },
  lifelineName: { fontFamily: "Rajdhani_700Bold", fontSize: 16, color: Colors.dark.text },
  lifelineDesc: { fontFamily: "Rajdhani_400Regular", fontSize: 12, color: Colors.dark.textMuted },
  lifelineOwned: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  buyBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  buyBtnText: { fontFamily: "Rajdhani_700Bold", fontSize: 14 },
  packsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  packCardWrap: { width: "48%" as any },
  packCard: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  packGradient: { padding: 16, alignItems: "center", gap: 6 },
  packCoins: { fontFamily: "Rajdhani_700Bold", fontSize: 28 },
  packLabel: { fontFamily: "Rajdhani_500Medium", fontSize: 13, color: Colors.dark.textSecondary },
  packPrice: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  packPriceText: { fontFamily: "Rajdhani_700Bold", fontSize: 13 },
  adBanner: {
    marginTop: 16,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.success + "30",
  },
  adGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  adInfo: { flex: 1 },
  adTitle: { fontFamily: "Rajdhani_700Bold", fontSize: 15, color: Colors.dark.text },
  adDesc: { fontFamily: "Rajdhani_400Regular", fontSize: 12, color: Colors.dark.textSecondary },
  adBtn: {
    backgroundColor: Colors.dark.success,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  adBtnText: { fontFamily: "Rajdhani_700Bold", fontSize: 14, color: "#fff" },
  framesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  frameCardWrap: { width: "31%" as any },
  frameCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  framePreview: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.surfaceLight,
  },
  frameName: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 11,
    color: Colors.dark.text,
    textAlign: "center",
  },
  equippedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  equippedText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 10,
  },
  framePriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  framePriceText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 12,
    color: Colors.dark.gold,
  },
  themeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  themePreview: {
    width: 56,
    height: 56,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  themeCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  themeInfo: { flex: 1, gap: 6 },
  themeName: { fontFamily: "Rajdhani_700Bold", fontSize: 16, color: Colors.dark.text },
  themePriceRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  themePriceText: { fontFamily: "Rajdhani_700Bold", fontSize: 14, color: Colors.dark.gold },
  offerCard: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 12,
  },
  offerGradient: {
    padding: 16,
    gap: 14,
  },
  offerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  offerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  offerInfo: {
    flex: 1,
  },
  offerName: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 18,
    color: Colors.dark.text,
  },
  offerDesc: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  offerPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  offerPrices: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  offerOriginalPrice: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 16,
    textDecorationLine: "line-through" as const,
  },
  offerSalePriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  offerSalePrice: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 22,
  },
  offerTimerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  offerTimer: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  offerBuyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  offerBuyBtnText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 16,
  },
});
