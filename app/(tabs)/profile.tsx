import React, { useState, useMemo } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, TextInput, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/auth-context";
import { getRankFromXP } from "@/lib/game-data";
import { getApiUrl } from "@/lib/query-client";

const FRAME_COLORS: { [key: string]: string } = {
  default: Colors.dark.textMuted,
  frame_fire: "#EF4444",
  frame_ice: "#38BDF8",
  frame_gold: "#FFD700",
  frame_neon: "#A855F7",
  frame_diamond: "#00E5FF",
  frame_crown: "#F59E0B",
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, updateProfile } = useGame();
  const { user, checkAuth } = useAuth();
  const apiUrl = getApiUrl();
  const rank = getRankFromXP(profile.xp);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [saving, setSaving] = useState(false);

  const equippedFrame = user?.equippedFrame || "default";
  const frameColor = FRAME_COLORS[equippedFrame] || Colors.dark.textMuted;

  const nameChangeInfo = useMemo(() => {
    if (!user?.nameChangedAt) return { canChange: true, daysLeft: 0 };
    const lastChange = new Date(user.nameChangedAt).getTime();
    const daysSince = (Date.now() - lastChange) / (1000 * 60 * 60 * 24);
    if (daysSince >= 60) return { canChange: true, daysLeft: 0 };
    return { canChange: false, daysLeft: Math.ceil(60 - daysSince) };
  }, [user?.nameChangedAt]);

  const handleEditPress = () => {
    if (!nameChangeInfo.canChange) {
      Alert.alert(
        "غير متاح حالياً",
        `يمكنك تغيير اسمك المستعار بعد ${nameChangeInfo.daysLeft} يوم`
      );
      return;
    }
    setName(profile.name);
    setEditing(true);
  };

  const handleSave = async () => {
    if (name.trim().length < 2) {
      Alert.alert("اسم غير صالح", "يجب أن يكون الاسم حرفين على الأقل.");
      return;
    }
    if (name.trim() === profile.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(new URL("/api/user/change-name", apiUrl).toString(), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        updateProfile({ name: name.trim() });
        await checkAuth();
        setEditing(false);
        Alert.alert("تم التغيير", "تم تغيير اسمك المستعار بنجاح");
      } else {
        Alert.alert("تنبيه", data.message || "حدث خطأ");
      }
    } catch {
      Alert.alert("خطأ", "فشل تغيير الاسم");
    } finally {
      setSaving(false);
    }
  };

  const winRate = profile.gamesPlayed > 0 ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0;
  const topFinishes = profile.recentMatches.filter(m => m.position <= 3).length;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 100 }]}
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.title}>الملف الشخصي</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(100)}>
          <View style={styles.profileCard}>
            <LinearGradient
              colors={[rank.color + "20", "transparent"]}
              style={styles.profileGradient}
            >
              <View style={[styles.avatar, { borderColor: frameColor }]}>
                <Ionicons name="person" size={36} color={frameColor} />
              </View>
              {editing ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.nameInput}
                    value={name}
                    onChangeText={setName}
                    maxLength={20}
                    placeholderTextColor={Colors.dark.textMuted}
                    autoFocus
                  />
                  {saving ? (
                    <ActivityIndicator size="small" color={Colors.dark.primary} />
                  ) : (
                    <>
                      <Pressable onPress={handleSave} style={styles.saveBtn}>
                        <Ionicons name="checkmark" size={20} color={Colors.dark.success} />
                      </Pressable>
                      <Pressable onPress={() => { setEditing(false); setName(profile.name); }} style={styles.saveBtn}>
                        <Ionicons name="close" size={20} color={Colors.dark.error} />
                      </Pressable>
                    </>
                  )}
                </View>
              ) : (
                <Pressable onPress={handleEditPress} style={styles.nameRow}>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  <Ionicons name="pencil" size={16} color={nameChangeInfo.canChange ? Colors.dark.textMuted : Colors.dark.textMuted + "50"} />
                </Pressable>
              )}
              {!editing && !nameChangeInfo.canChange && (
                <Text style={styles.nameChangeTimer}>
                  تغيير الاسم متاح بعد {nameChangeInfo.daysLeft} يوم
                </Text>
              )}
              <View style={[styles.rankBadge, { backgroundColor: rank.color + "20" }]}>
                <Ionicons name={rank.icon as any} size={14} color={rank.color} />
                <Text style={[styles.rankText, { color: rank.color }]}>{rank.label}</Text>
              </View>
              {user?.email && (
                <Text style={styles.emailText}>{user.email}</Text>
              )}
            </LinearGradient>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(200)}>
          <Text style={styles.sectionTitle}>الإحصائيات</Text>
          <View style={styles.statsGrid}>
            <StatRow icon="game-controller" label="المباريات" value={profile.gamesPlayed.toString()} />
            <StatRow icon="trophy" label="الانتصارات" value={profile.wins.toString()} />
            <StatRow icon="close-circle" label="الهزائم" value={profile.losses.toString()} />
            <StatRow icon="analytics" label="نسبة الفوز" value={`${winRate}%`} />
            <StatRow icon="flame" label="سلسلة الانتصارات" value={profile.streak.toString()} />
            <StatRow icon="medal" label="أفضل ٣ مراكز" value={topFinishes.toString()} />
            <StatRow icon="star" label="إجمالي الخبرة" value={profile.xp.toString()} />
            <StatRow icon="diamond" label="إجمالي العملات" value={profile.coins.toString()} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(300)}>
          <Text style={styles.sectionTitle}>المخزون</Text>
          <View style={styles.inventoryRow}>
            <InventoryItem icon="cut-outline" label="٥٠/٥٠" count={profile.lifelines.fifty_fifty || 0} color="#FF6B6B" />
            <InventoryItem icon="snow-outline" label="تجميد" count={profile.lifelines.time_freeze || 0} color="#4ECDC4" />
            <InventoryItem icon="shield-checkmark-outline" label="درع" count={profile.lifelines.shield || 0} color="#A855F7" />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(400)}>
          <Text style={styles.sectionTitle}>الإعدادات والدعم</Text>
          <View style={styles.menuCard}>
            <Pressable onPress={() => router.push("/settings" as any)} style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: Colors.dark.primary + "15" }]}>
                  <Ionicons name="settings-outline" size={20} color={Colors.dark.primary} />
                </View>
                <Text style={styles.menuLabel}>الإعدادات</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable onPress={() => router.push("/support" as any)} style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: Colors.dark.gold + "15" }]}>
                  <Ionicons name="help-circle-outline" size={20} color={Colors.dark.gold} />
                </View>
                <Text style={styles.menuLabel}>مركز الدعم</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function StatRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statLeft}>
        <Ionicons name={icon as any} size={18} color={Colors.dark.textSecondary} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function InventoryItem({ icon, label, count, color }: { icon: string; label: string; count: number; color: string }) {
  return (
    <View style={[styles.inventoryCard, { borderColor: color + "30" }]}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={styles.inventoryLabel}>{label}</Text>
      <Text style={[styles.inventoryCount, { color }]}>{count}</Text>
    </View>
  );
}

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
  profileCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 24,
  },
  profileGradient: { padding: 24, alignItems: "center", gap: 12 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.surfaceLight,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  profileName: { fontFamily: "Rajdhani_700Bold", fontSize: 24, color: Colors.dark.text },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  nameInput: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 20,
    color: Colors.dark.text,
    borderBottomWidth: 2,
    borderBottomColor: Colors.dark.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 120,
    textAlign: "center",
  },
  saveBtn: { padding: 8 },
  nameChangeTimer: {
    fontFamily: "Rajdhani_400Regular",
    fontSize: 12,
    color: Colors.dark.gold,
    marginTop: -4,
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rankText: { fontFamily: "Rajdhani_700Bold", fontSize: 14 },
  emailText: {
    fontFamily: "Rajdhani_400Regular",
    fontSize: 13,
    color: Colors.dark.textMuted,
  },
  sectionTitle: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 18,
    color: Colors.dark.text,
    marginBottom: 12,
  },
  statsGrid: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  statLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  statLabel: { fontFamily: "Rajdhani_500Medium", fontSize: 15, color: Colors.dark.textSecondary },
  statValue: { fontFamily: "Rajdhani_700Bold", fontSize: 16, color: Colors.dark.text },
  inventoryRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  inventoryCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
  },
  inventoryLabel: { fontFamily: "Rajdhani_500Medium", fontSize: 13, color: Colors.dark.textSecondary },
  inventoryCount: { fontFamily: "Rajdhani_700Bold", fontSize: 24 },
  menuCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 16,
    color: Colors.dark.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginHorizontal: 16,
  },
});
