import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, Switch, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();
  const [soundEnabled, setSoundEnabled] = useState(user?.soundEnabled ?? true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notificationsEnabled ?? true);

  const toggleSound = (val: boolean) => {
    setSoundEnabled(val);
    updateUser({ soundEnabled: val });
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleNotifications = (val: boolean) => {
    setNotificationsEnabled(val);
    updateUser({ notificationsEnabled: val });
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleLogout = () => {
    Alert.alert("تسجيل الخروج", "هل أنت متأكد من تسجيل الخروج؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "خروج",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "حذف الحساب",
      "هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك نهائياً.",
      [
        { text: "إلغاء", style: "cancel" },
        { text: "حذف", style: "destructive", onPress: () => Alert.alert("تم", "تم إرسال طلب الحذف. سيتم معالجته خلال ٤٨ ساعة.") },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </Pressable>
        <Text style={styles.title}>الإعدادات</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 40 }]}
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.sectionTitle}>الحساب</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: Colors.dark.primary + "20" }]}>
                  <Ionicons name="mail-outline" size={18} color={Colors.dark.primary} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>البريد الإلكتروني</Text>
                  <Text style={styles.settingValue}>{user?.email || "غير محدد"}</Text>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: Colors.dark.accent + "20" }]}>
                  <Ionicons name="person-outline" size={18} color={Colors.dark.accent} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>اسم اللاعب</Text>
                  <Text style={styles.settingValue}>{user?.name || "لاعب"}</Text>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: "#10B981" + "20" }]}>
                  <Ionicons name="link-outline" size={18} color="#10B981" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>الحسابات المرتبطة</Text>
                  <Text style={styles.settingValue}>{user?.provider === "email" ? "بريد إلكتروني" : user?.provider || "بريد إلكتروني"}</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <Text style={styles.sectionTitle}>التطبيق</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: Colors.dark.gold + "20" }]}>
                  <Ionicons name="volume-high-outline" size={18} color={Colors.dark.gold} />
                </View>
                <Text style={styles.settingLabel}>المؤثرات الصوتية</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={toggleSound}
                trackColor={{ false: Colors.dark.surfaceLight, true: Colors.dark.primary + "50" }}
                thumbColor={soundEnabled ? Colors.dark.primary : Colors.dark.textMuted}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: "#EF4444" + "20" }]}>
                  <Ionicons name="notifications-outline" size={18} color="#EF4444" />
                </View>
                <Text style={styles.settingLabel}>الإشعارات</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: Colors.dark.surfaceLight, true: Colors.dark.primary + "50" }}
                thumbColor={notificationsEnabled ? Colors.dark.primary : Colors.dark.textMuted}
              />
            </View>
            <View style={styles.divider} />
            <Pressable onPress={() => Alert.alert("اللغة", "اللغة العربية هي اللغة الوحيدة المتاحة حالياً")} style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: "#A855F7" + "20" }]}>
                  <Ionicons name="language-outline" size={18} color="#A855F7" />
                </View>
                <Text style={styles.settingLabel}>اللغة</Text>
              </View>
              <Text style={styles.settingValue}>العربية</Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <Text style={styles.sectionTitle}>الدعم</Text>
          <View style={styles.card}>
            <Pressable onPress={() => router.push("/support")} style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: "#38BDF8" + "20" }]}>
                  <Ionicons name="help-circle-outline" size={18} color="#38BDF8" />
                </View>
                <Text style={styles.settingLabel}>مركز المساعدة</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
            </Pressable>
            <View style={styles.divider} />
            <Pressable onPress={() => router.push("/support")} style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: "#F59E0B" + "20" }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#F59E0B" />
                </View>
                <Text style={styles.settingLabel}>تواصل معنا</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
            </Pressable>
            <View style={styles.divider} />
            <Pressable onPress={() => Alert.alert("الإصدار", "ساحة المعرفة v1.0.0")} style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: "#64748B" + "20" }]}>
                  <Ionicons name="information-circle-outline" size={18} color="#64748B" />
                </View>
                <Text style={styles.settingLabel}>حول التطبيق</Text>
              </View>
              <Text style={styles.settingValue}>v1.0.0</Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.dangerZone}>
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <LinearGradient
              colors={["#EF4444" + "20", "#EF4444" + "08"]}
              style={styles.logoutGradient}
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={styles.logoutText}>تسجيل الخروج</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={handleDeleteAccount} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>حذف الحساب</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 8 },
  title: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 22,
    color: Colors.dark.text,
  },
  scrollContent: { paddingHorizontal: 20 },
  sectionTitle: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 16,
    color: Colors.dark.textSecondary,
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 16,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 15,
    color: Colors.dark.text,
  },
  settingValue: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 13,
    color: Colors.dark.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginHorizontal: 16,
  },
  dangerZone: {
    marginTop: 8,
    gap: 12,
  },
  logoutBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  logoutText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 16,
    color: "#EF4444",
  },
  deleteBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  deleteText: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 13,
    color: Colors.dark.textMuted,
  },
});
