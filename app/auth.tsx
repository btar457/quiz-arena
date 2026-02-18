import React, { useState, useRef } from "react";
import {
  StyleSheet, Text, View, TextInput, Pressable, Platform,
  KeyboardAvoidingView, ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    if (loading) return;
    if (!email.trim() || !password.trim()) {
      Alert.alert("تنبيه", "يرجى ملء جميع الحقول");
      return;
    }
    if (mode === "register" && !name.trim()) {
      Alert.alert("تنبيه", "يرجى إدخال اسم اللاعب");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const result = mode === "login"
      ? await login(email.trim(), password)
      : await register(email.trim(), password, name.trim());
    setLoading(false);
    if (!result.success && result.message) {
      Alert.alert("خطأ", result.message);
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert(
      "قريباً",
      `تسجيل الدخول عبر ${provider} سيكون متاحاً قريباً. يرجى استخدام البريد الإلكتروني حالياً.`
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(600)} style={styles.logoArea}>
            <LinearGradient
              colors={[Colors.dark.primary + "30", Colors.dark.accent + "20", "transparent"]}
              style={styles.logoBg}
            >
              <View style={styles.logoCircle}>
                <Ionicons name="trophy" size={48} color={Colors.dark.gold} />
              </View>
              <Text style={styles.logoTitle}>ساحة المعرفة</Text>
              <Text style={styles.logoSubtitle}>تحدّى عقلك وتنافس مع الأبطال</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.tabRow}>
            <Pressable
              onPress={() => setMode("login")}
              style={[styles.tab, mode === "login" && styles.tabActive]}
            >
              <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>تسجيل الدخول</Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("register")}
              style={[styles.tab, mode === "register" && styles.tabActive]}
            >
              <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>إنشاء حساب</Text>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.form}>
            {mode === "register" && (
              <Animated.View entering={FadeInDown.duration(300)}>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
                  <TextInput
                    ref={nameRef}
                    style={styles.input}
                    placeholder="اسم مستعار (يظهر للاعبين)"
                    placeholderTextColor={Colors.dark.textMuted}
                    value={name}
                    onChangeText={setName}
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    maxLength={20}
                  />
                </View>
                <Text style={styles.nicknameHint}>اختر اسماً مميزاً يعرفك به اللاعبون. يمكن تغييره كل ٦٠ يوماً.</Text>
              </Animated.View>
            )}

            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder="البريد الإلكتروني"
                placeholderTextColor={Colors.dark.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passRef.current?.focus()}
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
              <TextInput
                ref={passRef}
                style={[styles.input, { flex: 1 }]}
                placeholder="كلمة المرور"
                placeholderTextColor={Colors.dark.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.dark.textMuted} />
              </Pressable>
            </View>

            <Pressable onPress={handleSubmit} disabled={loading}>
              <LinearGradient
                colors={[Colors.dark.primary, Colors.dark.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.submitBtn, loading && { opacity: 0.6 }]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitText}>
                    {mode === "login" ? "دخول" : "إنشاء حساب"}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>أو</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(500)} style={styles.socialRow}>
            <Pressable
              onPress={() => handleSocialLogin("Google")}
              style={({ pressed }) => [styles.socialBtn, styles.googleBtn, pressed && { opacity: 0.8 }]}
            >
              <MaterialCommunityIcons name="google" size={22} color="#fff" />
              <Text style={styles.socialText}>Google</Text>
            </Pressable>

            <Pressable
              onPress={() => handleSocialLogin("Facebook")}
              style={({ pressed }) => [styles.socialBtn, styles.facebookBtn, pressed && { opacity: 0.8 }]}
            >
              <MaterialCommunityIcons name="facebook" size={22} color="#fff" />
              <Text style={styles.socialText}>Facebook</Text>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(600).delay(600)}>
            <Text style={styles.terms}>
              بالتسجيل أنت توافق على شروط الاستخدام وسياسة الخصوصية
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  logoArea: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
  },
  logoBg: {
    alignItems: "center",
    paddingVertical: 36,
    gap: 10,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.dark.gold + "15",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.dark.gold + "40",
  },
  logoTitle: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 32,
    color: Colors.dark.text,
  },
  logoSubtitle: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 15,
    color: Colors.dark.textSecondary,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: Colors.dark.primary + "20",
  },
  tabText: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 15,
    color: Colors.dark.textMuted,
  },
  tabTextActive: {
    color: Colors.dark.primary,
  },
  form: {
    gap: 14,
    marginBottom: 24,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: "Rajdhani_500Medium",
    fontSize: 16,
    color: Colors.dark.text,
    paddingVertical: 16,
  },
  eyeBtn: {
    padding: 8,
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  submitText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 18,
    color: "#fff",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.dark.border,
  },
  dividerText: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  googleBtn: {
    backgroundColor: "#DB4437",
  },
  facebookBtn: {
    backgroundColor: "#1877F2",
  },
  socialText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  nicknameHint: {
    fontFamily: "Rajdhani_400Regular",
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 6,
    marginHorizontal: 4,
    lineHeight: 18,
  },
  terms: {
    fontFamily: "Rajdhani_400Regular",
    fontSize: 12,
    color: Colors.dark.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
});
