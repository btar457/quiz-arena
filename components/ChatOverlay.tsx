import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, Text, View, Pressable, TextInput, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, SlideInRight } from "react-native-reanimated";
import Colors from "@/constants/colors";

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  isPlayer: boolean;
  isTeam: boolean;
  timestamp: number;
}

interface ChatOverlayProps {
  visible: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  teamMode?: boolean;
}

const BOT_MESSAGES = [
  "يلا نقدر!",
  "أحسنت!",
  "إجابة ممتازة",
  "استمر كذا",
  "ركّز معي",
  "الحمد لله",
  "سؤال صعب!",
  "ما شاء الله",
  "تقدر تجاوب؟",
  "حظ سعيد",
  "فريق قوي",
  "لا تستعجل",
];

export function useSimulatedChat(botNames: string[], isTeamMode: boolean = false) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (Math.random() > 0.6) {
        const sender = botNames[Math.floor(Math.random() * botNames.length)];
        const text = BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)];
        setMessages(prev => [...prev, {
          id: `bot_${Date.now()}_${Math.random()}`,
          sender,
          text,
          isPlayer: false,
          isTeam: isTeamMode && Math.random() > 0.5,
          timestamp: Date.now(),
        }]);
      }
    }, 4000 + Math.random() * 6000);

    return () => clearInterval(intervalRef.current);
  }, [botNames, isTeamMode]);

  const sendMessage = (text: string) => {
    setMessages(prev => [...prev, {
      id: `player_${Date.now()}`,
      sender: "أنت",
      text,
      isPlayer: true,
      isTeam: false,
      timestamp: Date.now(),
    }]);
  };

  return { messages, sendMessage };
}

export default function ChatOverlay({ visible, onClose, messages, onSend, teamMode }: ChatOverlayProps) {
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  useEffect(() => {
    if (messages.length > 0 && listRef.current) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  if (!visible) return null;

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="chatbubbles" size={18} color={Colors.dark.primary} />
            <Text style={styles.headerTitle}>{teamMode ? "دردشة الفريق" : "الدردشة"}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={Colors.dark.textSecondary} />
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Animated.View entering={SlideInRight.duration(200)}>
              <View style={[
                styles.messageBubble,
                item.isPlayer ? styles.playerBubble : styles.otherBubble,
                item.isTeam && styles.teamBubble,
              ]}>
                {!item.isPlayer && (
                  <Text style={[styles.senderName, item.isTeam && { color: "#A855F7" }]}>
                    {item.sender} {item.isTeam ? "(فريقك)" : ""}
                  </Text>
                )}
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            </Animated.View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubble-ellipses-outline" size={32} color={Colors.dark.textMuted} />
              <Text style={styles.emptyChatText}>لا توجد رسائل بعد</Text>
            </View>
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="اكتب رسالة..."
            placeholderTextColor={Colors.dark.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <Pressable
            onPress={handleSend}
            style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}
            disabled={!input.trim()}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "55%",
    backgroundColor: Colors.dark.surface + "F5",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: Colors.dark.border,
    zIndex: 100,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 16,
    color: Colors.dark.text,
  },
  closeBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 12,
    gap: 6,
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 14,
    padding: 10,
    paddingHorizontal: 14,
  },
  playerBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.dark.primary + "25",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    alignSelf: "flex-start",
    backgroundColor: Colors.dark.card,
    borderBottomLeftRadius: 4,
  },
  teamBubble: {
    backgroundColor: "#A855F7" + "20",
    borderColor: "#A855F7" + "30",
    borderWidth: 1,
  },
  senderName: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginBottom: 2,
  },
  messageText: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 14,
    color: Colors.dark.text,
    lineHeight: 20,
  },
  emptyChat: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    gap: 8,
  },
  emptyChatText: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: "Rajdhani_500Medium",
    fontSize: 14,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    textAlign: "right",
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
