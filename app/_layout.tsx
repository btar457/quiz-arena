import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { GameProvider } from "@/lib/game-context";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { StatusBar } from "expo-status-bar";
import { useFonts, Rajdhani_400Regular, Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold } from "@expo-google-fonts/rajdhani";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={gateStyles.loading}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back", headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="auth" options={{ headerShown: false, animation: "fade" }} />
      ) : (
        <>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="mode-select" options={{ headerShown: false, animation: "slide_from_bottom" }} />
          <Stack.Screen name="game" options={{ headerShown: false, gestureEnabled: false, animation: "fade" }} />
          <Stack.Screen name="game-1v1" options={{ headerShown: false, gestureEnabled: false, animation: "fade" }} />
          <Stack.Screen name="game-2v2" options={{ headerShown: false, gestureEnabled: false, animation: "fade" }} />
          <Stack.Screen name="matchmaking" options={{ headerShown: false, gestureEnabled: false, animation: "slide_from_bottom" }} />
          <Stack.Screen name="rank-up" options={{ headerShown: false, gestureEnabled: false, presentation: "fullScreenModal", animation: "fade" }} />
          <Stack.Screen name="settings" options={{ headerShown: false, animation: "slide_from_right" }} />
          <Stack.Screen name="support" options={{ headerShown: false, animation: "slide_from_right" }} />
        </>
      )}
    </Stack>
  );
}

const gateStyles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Rajdhani_400Regular,
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <AuthProvider>
              <GameProvider>
                <StatusBar style="light" />
                <AuthGate />
              </GameProvider>
            </AuthProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
