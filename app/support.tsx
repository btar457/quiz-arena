import React, { useState } from "react";
import {
  StyleSheet, Text, View, ScrollView, Pressable, Platform,
  TextInput, Alert, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { getApiUrl } from "@/lib/query-client";

const FAQ_ITEMS = [
  {
    q: "كيف أكسب عملات إضافية؟",
    a: "يمكنك كسب العملات من خلال الفوز بالمباريات، المطالبة بالهدية اليومية، أو مشاهدة الإعلانات في المتجر.",
  },
  {
    q: "كيف أستخدم المساعدات في اللعبة؟",
    a: "اضغط على أيقونة المساعدة أثناء اللعب. المساعدات المتاحة: ٥٠/٥٠ لإزالة إجابتين، تجميد الوقت لإيقاف المؤقت، والدرع للحماية.",
  },
  {
    q: "كيف أغير اسم اللاعب؟",
    a: "اذهب إلى الملف الشخصي واضغط على أيقونة التعديل بجانب اسمك.",
  },
  {
    q: "ما هي الأوضاع المتاحة؟",
    a: "تنافسي (١٠ لاعبين، ٣٠ سؤال)، ١ ضد ١ (مبارزة مباشرة، ١٥ سؤال)، و ٢ ضد ٢ (فريق من ٢، ٢٠ سؤال).",
  },
  {
    q: "كيف يعمل نظام التصنيف؟",
    a: "تصعد في الرتب بكسب نقاط الخبرة (XP). هناك ٢٦ رتبة من مبتدئ إلى نابغة. كل رتبة تحتاج ٢٠٠ XP.",
  },
  {
    q: "ما هي الإطارات والواجهات؟",
    a: "الإطارات تزين ملفك الشخصي والواجهات تغير ألوان التطبيق. يمكنك شراؤها من المتجر.",
  },
];

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("تنبيه", "يرجى ملء جميع الحقول");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(new URL("/api/support/ticket", getApiUrl()).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      if (res.ok) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("تم الإرسال", "تم استلام رسالتك وسنرد عليك في أقرب وقت.");
        setSubject("");
        setMessage("");
        setShowContactForm(false);
      } else {
        Alert.alert("خطأ", "حدث خطأ أثناء إرسال الرسالة. حاول مرة أخرى.");
      }
    } catch {
      Alert.alert("خطأ", "تعذر الاتصال بالخادم.");
    }
    setSending(false);
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </Pressable>
        <Text style={styles.title}>مركز الدعم</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <LinearGradient
            colors={[Colors.dark.primary + "15", Colors.dark.accent + "10", "transparent"]}
            style={styles.heroBanner}
          >
            <View style={styles.heroIcon}>
              <Ionicons name="headset-outline" size={36} color={Colors.dark.primary} />
            </View>
            <Text style={styles.heroTitle}>كيف يمكننا مساعدتك؟</Text>
            <Text style={styles.heroSub}>ابحث في الأسئلة الشائعة أو تواصل معنا</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <Text style={styles.sectionTitle}>الأسئلة الشائعة</Text>
          {FAQ_ITEMS.map((item, idx) => (
            <Animated.View key={idx} entering={FadeInDown.duration(300).delay(idx * 60)}>
              <Pressable
                onPress={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                style={styles.faqCard}
              >
                <View style={styles.faqHeader}>
                  <Ionicons
                    name="help-circle"
                    size={20}
                    color={expandedFAQ === idx ? Colors.dark.primary : Colors.dark.textMuted}
                  />
                  <Text style={[styles.faqQuestion, expandedFAQ === idx && { color: Colors.dark.primary }]}>
                    {item.q}
                  </Text>
                  <Ionicons
                    name={expandedFAQ === idx ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={Colors.dark.textMuted}
                  />
                </View>
                {expandedFAQ === idx && (
                  <Text style={styles.faqAnswer}>{item.a}</Text>
                )}
              </Pressable>
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(400)}>
          <Text style={styles.sectionTitle}>تواصل معنا</Text>
          {!showContactForm ? (
            <View style={styles.contactOptions}>
              <Pressable
                onPress={() => setShowContactForm(true)}
                style={({ pressed }) => [styles.contactCard, pressed && { opacity: 0.8 }]}
              >
                <LinearGradient
                  colors={[Colors.dark.primary + "15", Colors.dark.primary + "05"]}
                  style={styles.contactGradient}
                >
                  <View style={[styles.contactIcon, { backgroundColor: Colors.dark.primary + "20" }]}>
                    <Ionicons name="create-outline" size={24} color={Colors.dark.primary} />
                  </View>
                  <Text style={styles.contactTitle}>إرسال رسالة</Text>
                  <Text style={styles.contactSub}>أرسل لنا استفسارك أو مشكلتك</Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                onPress={() => Alert.alert("البريد", "support@quizarena.app")}
                style={({ pressed }) => [styles.contactCard, pressed && { opacity: 0.8 }]}
              >
                <LinearGradient
                  colors={[Colors.dark.gold + "15", Colors.dark.gold + "05"]}
                  style={styles.contactGradient}
                >
                  <View style={[styles.contactIcon, { backgroundColor: Colors.dark.gold + "20" }]}>
                    <Ionicons name="mail-outline" size={24} color={Colors.dark.gold} />
                  </View>
                  <Text style={styles.contactTitle}>البريد الإلكتروني</Text>
                  <Text style={styles.contactSub}>support@quizarena.app</Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : (
            <View style={styles.formCard}>
              <TextInput
                style={styles.formInput}
                placeholder="الموضوع"
                placeholderTextColor={Colors.dark.textMuted}
                value={subject}
                onChangeText={setSubject}
                maxLength={100}
              />
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="اكتب رسالتك هنا..."
                placeholderTextColor={Colors.dark.textMuted}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                maxLength={1000}
              />
              <View style={styles.formActions}>
                <Pressable onPress={() => setShowContactForm(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>إلغاء</Text>
                </Pressable>
                <Pressable onPress={handleSubmitTicket} disabled={sending}>
                  <LinearGradient
                    colors={[Colors.dark.primary, Colors.dark.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.sendBtn, sending && { opacity: 0.6 }]}
                  >
                    {sending ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.sendText}>إرسال</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          )}
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
  heroBanner: {
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dark.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 22,
    color: Colors.dark.text,
  },
  heroSub: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  sectionTitle: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 16,
    color: Colors.dark.textSecondary,
    marginBottom: 10,
  },
  faqCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  faqQuestion: {
    flex: 1,
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 14,
    color: Colors.dark.text,
  },
  faqAnswer: {
    fontFamily: "Rajdhani_400Regular",
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 12,
    lineHeight: 22,
    paddingLeft: 30,
  },
  contactOptions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  contactCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  contactGradient: {
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  contactTitle: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 14,
    color: Colors.dark.text,
  },
  contactSub: {
    fontFamily: "Rajdhani_400Regular",
    fontSize: 11,
    color: Colors.dark.textMuted,
    textAlign: "center",
  },
  formCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 20,
  },
  formInput: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 12,
    padding: 14,
    fontFamily: "Rajdhani_500Medium",
    fontSize: 15,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  formTextArea: {
    minHeight: 120,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cancelText: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 15,
    color: Colors.dark.textMuted,
  },
  sendBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  sendText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 15,
    color: "#fff",
  },
});
