import React, { useState, useCallback } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, TextInput, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useFocusEffect, useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";
import { getRankFromXP } from "@/lib/game-data";
import { getApiUrl } from "@/lib/query-client";

interface FriendInfo {
  id: string;
  name: string;
  xp: number;
  equippedFrame: string | null;
  gamesPlayed?: number;
  wins?: number;
}

interface FriendRequest {
  id: number;
  senderId: string;
  senderName: string;
  senderXp: number;
  senderFrame: string | null;
  status: string;
  createdAt: string;
}

type TabType = "friends" | "requests" | "search";

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const apiUrl = getApiUrl();

  const [activeTab, setActiveTab] = useState<TabType>("friends");
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const loadFriends = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(new URL("/api/friends", apiUrl).toString(), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
      }
    } catch {} finally { setLoading(false); }
  }, [apiUrl]);

  const loadRequests = useCallback(async () => {
    try {
      const res = await fetch(new URL("/api/friends/requests/incoming", apiUrl).toString(), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch {}
  }, [apiUrl]);

  useFocusEffect(useCallback(() => {
    loadFriends();
    loadRequests();
  }, [loadFriends, loadRequests]));

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    try {
      setSearching(true);
      const res = await fetch(
        new URL(`/api/friends/search?q=${encodeURIComponent(searchQuery.trim())}`, apiUrl).toString(),
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        const friendIds = new Set(friends.map(f => f.id));
        setSearchResults((data.users || []).filter((u: FriendInfo) => !friendIds.has(u.id)));
      }
    } catch {} finally { setSearching(false); }
  };

  const sendRequest = async (friendId: string) => {
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await fetch(new URL("/api/friends/request", apiUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ friendId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSentRequests(prev => new Set(prev).add(friendId));
        Alert.alert("تم الإرسال", "تم إرسال طلب الصداقة بنجاح");
      } else {
        Alert.alert("تنبيه", data.message || "حدث خطأ");
      }
    } catch {
      Alert.alert("خطأ", "فشل إرسال الطلب");
    }
  };

  const acceptRequest = async (requestId: number) => {
    try {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const res = await fetch(new URL(`/api/friends/request/${requestId}/accept`, apiUrl).toString(), {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== requestId));
        loadFriends();
      }
    } catch {}
  };

  const rejectRequest = async (requestId: number) => {
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await fetch(new URL(`/api/friends/request/${requestId}/reject`, apiUrl).toString(), {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== requestId));
      }
    } catch {}
  };

  const removeFriend = async (friendId: string, friendName: string) => {
    Alert.alert("حذف صديق", `هل تريد حذف ${friendName} من قائمة الأصدقاء؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف", style: "destructive",
        onPress: async () => {
          try {
            await fetch(new URL(`/api/friends/${friendId}`, apiUrl).toString(), {
              method: "DELETE",
              credentials: "include",
            });
            setFriends(prev => prev.filter(f => f.id !== friendId));
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } catch {}
        },
      },
    ]);
  };

  const inviteFriend = (friend: FriendInfo) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/mode-select", params: { inviteFriend: friend.name, inviteFriendId: friend.id } } as any);
  };

  const tabs = [
    { key: "friends" as TabType, label: "الأصدقاء", icon: "people", badge: friends.length },
    { key: "requests" as TabType, label: "الطلبات", icon: "mail-unread", badge: requests.length },
    { key: "search" as TabType, label: "بحث", icon: "search" },
  ];

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 100 }]}
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.title}>الأصدقاء</Text>
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
                {tab.badge !== undefined && tab.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {activeTab === "friends" && (
          <Animated.View entering={FadeInDown.duration(400)}>
            {loading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color={Colors.dark.primary} />
              </View>
            ) : friends.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={Colors.dark.textMuted} />
                <Text style={styles.emptyTitle}>لا يوجد أصدقاء</Text>
                <Text style={styles.emptyDesc}>ابحث عن لاعبين وأضفهم كأصدقاء</Text>
                <Pressable
                  onPress={() => setActiveTab("search")}
                  style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.8 }]}
                >
                  <Ionicons name="person-add" size={18} color="#000" />
                  <Text style={styles.emptyBtnText}>إضافة أصدقاء</Text>
                </Pressable>
              </View>
            ) : (
              friends.map((friend, idx) => {
                const rank = getRankFromXP(friend.xp);
                const winRate = (friend.gamesPlayed || 0) > 0
                  ? Math.round(((friend.wins || 0) / (friend.gamesPlayed || 1)) * 100) : 0;
                return (
                  <Animated.View key={friend.id} entering={FadeInDown.duration(400).delay(idx * 60)}>
                    <View style={styles.friendCard}>
                      <View style={[styles.friendAvatar, { borderColor: rank.color }]}>
                        <Ionicons name="person" size={20} color={rank.color} />
                      </View>
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{friend.name}</Text>
                        <View style={styles.friendMeta}>
                          <View style={[styles.rankPill, { backgroundColor: rank.color + "15" }]}>
                            <Text style={[styles.rankPillText, { color: rank.color }]}>{rank.label}</Text>
                          </View>
                          <Text style={styles.friendStat}>{winRate}% فوز</Text>
                        </View>
                      </View>
                      <View style={styles.friendActions}>
                        <Pressable onPress={() => inviteFriend(friend)} style={styles.actionBtn}>
                          <Ionicons name="game-controller" size={20} color={Colors.dark.success} />
                        </Pressable>
                        <Pressable onPress={() => removeFriend(friend.id, friend.name)} style={styles.actionBtn}>
                          <Ionicons name="person-remove" size={18} color={Colors.dark.error} />
                        </Pressable>
                      </View>
                    </View>
                  </Animated.View>
                );
              })
            )}
          </Animated.View>
        )}

        {activeTab === "requests" && (
          <Animated.View entering={FadeInDown.duration(400)}>
            {requests.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="mail-outline" size={48} color={Colors.dark.textMuted} />
                <Text style={styles.emptyTitle}>لا توجد طلبات</Text>
                <Text style={styles.emptyDesc}>لا توجد طلبات صداقة واردة حالياً</Text>
              </View>
            ) : (
              requests.map((req, idx) => {
                const rank = getRankFromXP(req.senderXp);
                return (
                  <Animated.View key={req.id} entering={FadeInDown.duration(400).delay(idx * 60)}>
                    <View style={styles.requestCard}>
                      <View style={[styles.friendAvatar, { borderColor: rank.color }]}>
                        <Ionicons name="person" size={20} color={rank.color} />
                      </View>
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{req.senderName}</Text>
                        <View style={[styles.rankPill, { backgroundColor: rank.color + "15" }]}>
                          <Text style={[styles.rankPillText, { color: rank.color }]}>{rank.label}</Text>
                        </View>
                      </View>
                      <View style={styles.requestActions}>
                        <Pressable
                          onPress={() => acceptRequest(req.id)}
                          style={[styles.reqBtn, { backgroundColor: Colors.dark.success }]}
                        >
                          <Ionicons name="checkmark" size={20} color="#fff" />
                        </Pressable>
                        <Pressable
                          onPress={() => rejectRequest(req.id)}
                          style={[styles.reqBtn, { backgroundColor: Colors.dark.error + "20" }]}
                        >
                          <Ionicons name="close" size={20} color={Colors.dark.error} />
                        </Pressable>
                      </View>
                    </View>
                  </Animated.View>
                );
              })
            )}
          </Animated.View>
        )}

        {activeTab === "search" && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={Colors.dark.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                placeholderTextColor={Colors.dark.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => { setSearchQuery(""); setSearchResults([]); }}>
                  <Ionicons name="close-circle" size={18} color={Colors.dark.textMuted} />
                </Pressable>
              )}
            </View>
            <Pressable
              onPress={handleSearch}
              disabled={searchQuery.trim().length < 2}
              style={({ pressed }) => [
                styles.searchBtn,
                searchQuery.trim().length < 2 && { opacity: 0.5 },
                pressed && { opacity: 0.8 },
              ]}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Ionicons name="search" size={16} color="#000" />
                  <Text style={styles.searchBtnText}>بحث</Text>
                </>
              )}
            </Pressable>

            {searchResults.length > 0 && (
              <View style={styles.resultsSection}>
                <Text style={styles.resultsTitle}>نتائج البحث ({searchResults.length})</Text>
                {searchResults.map((result, idx) => {
                  const rank = getRankFromXP(result.xp);
                  const alreadySent = sentRequests.has(result.id);
                  return (
                    <Animated.View key={result.id} entering={FadeIn.duration(300).delay(idx * 60)}>
                      <View style={styles.friendCard}>
                        <View style={[styles.friendAvatar, { borderColor: rank.color }]}>
                          <Ionicons name="person" size={20} color={rank.color} />
                        </View>
                        <View style={styles.friendInfo}>
                          <Text style={styles.friendName}>{result.name}</Text>
                          <View style={[styles.rankPill, { backgroundColor: rank.color + "15" }]}>
                            <Text style={[styles.rankPillText, { color: rank.color }]}>{rank.label}</Text>
                          </View>
                        </View>
                        <Pressable
                          onPress={() => sendRequest(result.id)}
                          disabled={alreadySent}
                          style={({ pressed }) => [
                            styles.addBtn,
                            alreadySent && { backgroundColor: Colors.dark.surfaceLight },
                            pressed && { opacity: 0.8 },
                          ]}
                        >
                          <Ionicons
                            name={alreadySent ? "checkmark" : "person-add"}
                            size={16}
                            color={alreadySent ? Colors.dark.success : "#000"}
                          />
                          {!alreadySent && <Text style={styles.addBtnText}>إضافة</Text>}
                        </Pressable>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            )}

            {searchResults.length === 0 && searchQuery.trim().length >= 2 && !searching && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={Colors.dark.textMuted} />
                <Text style={styles.emptyTitle}>لا توجد نتائج</Text>
                <Text style={styles.emptyDesc}>جرب بحثاً مختلفاً</Text>
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>
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
  tabItemActive: { backgroundColor: Colors.dark.primary + "15" },
  tabLabel: { fontFamily: "Rajdhani_600SemiBold", fontSize: 13, color: Colors.dark.textMuted },
  tabLabelActive: { color: Colors.dark.primary },
  badge: {
    backgroundColor: Colors.dark.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { fontFamily: "Rajdhani_700Bold", fontSize: 10, color: "#fff" },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 20,
    color: Colors.dark.textSecondary,
  },
  emptyDesc: {
    fontFamily: "Rajdhani_400Regular",
    fontSize: 14,
    color: Colors.dark.textMuted,
    textAlign: "center",
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyBtnText: { fontFamily: "Rajdhani_700Bold", fontSize: 15, color: "#000" },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.surfaceLight,
  },
  friendInfo: { flex: 1, gap: 4 },
  friendName: { fontFamily: "Rajdhani_700Bold", fontSize: 16, color: Colors.dark.text },
  friendMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  rankPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankPillText: { fontFamily: "Rajdhani_600SemiBold", fontSize: 11 },
  friendStat: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  friendActions: { flexDirection: "row", gap: 6 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.dark.primary + "20",
  },
  requestActions: { flexDirection: "row", gap: 6 },
  reqBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Rajdhani_500Medium",
    fontSize: 15,
    color: Colors.dark.text,
  },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchBtnText: { fontFamily: "Rajdhani_700Bold", fontSize: 15, color: "#000" },
  resultsSection: { gap: 0 },
  resultsTitle: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 16,
    color: Colors.dark.textSecondary,
    marginBottom: 10,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: { fontFamily: "Rajdhani_700Bold", fontSize: 13, color: "#000" },
});
