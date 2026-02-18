import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";

interface VoicePlayer {
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isPlayer: boolean;
}

interface VoiceChatBarProps {
  players: VoicePlayer[];
  onToggleMic: () => void;
  onToggleMutePlayer: (name: string) => void;
  isMicOn: boolean;
}

function SpeakingIndicator() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.4, { duration: 600 }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.speakingDot, animStyle]} />
  );
}

export function useSimulatedVoice(botNames: string[]): {
  voicePlayers: VoicePlayer[];
  isMicOn: boolean;
  toggleMic: () => void;
  toggleMutePlayer: (name: string) => void;
} {
  const [isMicOn, setIsMicOn] = useState(false);
  const [voicePlayers, setVoicePlayers] = useState<VoicePlayer[]>(() => [
    { name: "أنت", isSpeaking: false, isMuted: false, isPlayer: true },
    ...botNames.map(name => ({ name, isSpeaking: false, isMuted: false, isPlayer: false })),
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVoicePlayers(prev => prev.map(p => {
        if (p.isPlayer) return { ...p, isSpeaking: isMicOn && Math.random() > 0.5 };
        if (p.isMuted) return { ...p, isSpeaking: false };
        return { ...p, isSpeaking: Math.random() > 0.7 };
      }));
    }, 1500);
    return () => clearInterval(interval);
  }, [isMicOn]);

  const toggleMic = () => setIsMicOn(prev => !prev);

  const toggleMutePlayer = (name: string) => {
    setVoicePlayers(prev => prev.map(p =>
      p.name === name ? { ...p, isMuted: !p.isMuted, isSpeaking: false } : p
    ));
  };

  return { voicePlayers, isMicOn, toggleMic, toggleMutePlayer };
}

export default function VoiceChatBar({ players, onToggleMic, onToggleMutePlayer, isMicOn }: VoiceChatBarProps) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <View style={styles.playersRow}>
        {players.map((p, idx) => (
          <Pressable
            key={idx}
            onPress={() => !p.isPlayer && onToggleMutePlayer(p.name)}
            style={[styles.voicePlayer, p.isSpeaking && styles.voicePlayerSpeaking]}
          >
            <View style={styles.avatarWrap}>
              <Ionicons
                name={p.isPlayer ? "person" : "person-outline"}
                size={14}
                color={p.isMuted ? Colors.dark.textMuted : p.isSpeaking ? Colors.dark.primary : Colors.dark.text}
              />
              {p.isSpeaking && <SpeakingIndicator />}
              {p.isMuted && (
                <View style={styles.mutedBadge}>
                  <Ionicons name="volume-mute" size={8} color={Colors.dark.error} />
                </View>
              )}
            </View>
            <Text style={[styles.voiceName, p.isMuted && { color: Colors.dark.textMuted }]} numberOfLines={1}>
              {p.isPlayer ? "أنت" : p.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={onToggleMic}
        style={[styles.micBtn, isMicOn ? styles.micBtnOn : styles.micBtnOff]}
      >
        <Ionicons
          name={isMicOn ? "mic" : "mic-off"}
          size={18}
          color={isMicOn ? "#fff" : Colors.dark.error}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 8,
    marginHorizontal: 0,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 8,
  },
  playersRow: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
  },
  voicePlayer: {
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
  },
  voicePlayerSpeaking: {
    opacity: 1,
  },
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  speakingDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.success,
  },
  mutedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.dark.error + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceName: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 9,
    color: Colors.dark.textSecondary,
    maxWidth: 48,
    textAlign: "center",
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  micBtnOn: {
    backgroundColor: Colors.dark.success,
  },
  micBtnOff: {
    backgroundColor: Colors.dark.error + "25",
    borderWidth: 1,
    borderColor: Colors.dark.error + "40",
  },
});
