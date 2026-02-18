import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_PROFILE, PlayerProfile, LIFELINES, getRankFromXP, getGameQuestions, Question, BOT_NAMES, MatchResult } from "./game-data";
import { useAuth } from "./auth-context";

interface GameContextValue {
  profile: PlayerProfile;
  updateProfile: (updates: Partial<PlayerProfile>) => void;
  buyLifeline: (lifelineId: string) => boolean;
  useLifeline: (lifelineId: string) => boolean;
  addXP: (amount: number) => void;
  addCoins: (amount: number) => void;
  addMatchResult: (result: MatchResult) => void;
  loadProfile: () => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

const STORAGE_KEY = "@quiz_arena_profile";

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, updateUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    if (user && isAuthenticated) {
      setProfile({
        id: user.id,
        name: user.name,
        xp: user.xp,
        coins: user.coins,
        wins: user.wins,
        losses: user.losses,
        gamesPlayed: user.gamesPlayed,
        streak: user.streak,
        lifelines: user.lifelines as { [key: string]: number },
        recentMatches: user.recentMatches as MatchResult[],
      });
    }
  }, [user, isAuthenticated]);

  const saveProfile = useCallback(async (p: PlayerProfile) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
      if (isAuthenticated) {
        updateUser({
          xp: p.xp,
          coins: p.coins,
          wins: p.wins,
          losses: p.losses,
          gamesPlayed: p.gamesPlayed,
          streak: p.streak,
          lifelines: p.lifelines,
          recentMatches: p.recentMatches,
        } as any);
      }
    } catch {}
  }, [isAuthenticated, updateUser]);

  const loadProfile = useCallback(async () => {
    if (user && isAuthenticated) {
      setProfile({
        id: user.id,
        name: user.name,
        xp: user.xp,
        coins: user.coins,
        wins: user.wins,
        losses: user.losses,
        gamesPlayed: user.gamesPlayed,
        streak: user.streak,
        lifelines: user.lifelines as { [key: string]: number },
        recentMatches: user.recentMatches as MatchResult[],
      });
      return;
    }
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    } catch {}
  }, [user, isAuthenticated]);

  const updateProfile = useCallback((updates: Partial<PlayerProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updates };
      saveProfile(next);
      return next;
    });
  }, [saveProfile]);

  const buyLifeline = useCallback((lifelineId: string): boolean => {
    const lifeline = LIFELINES.find(l => l.id === lifelineId);
    if (!lifeline) return false;

    let success = false;
    setProfile(prev => {
      if (prev.coins < lifeline.price) return prev;
      success = true;
      const next = {
        ...prev,
        coins: prev.coins - lifeline.price,
        lifelines: {
          ...prev.lifelines,
          [lifelineId]: (prev.lifelines[lifelineId] || 0) + 1,
        },
      };
      saveProfile(next);
      return next;
    });
    return success;
  }, [saveProfile]);

  const useLifeline = useCallback((lifelineId: string): boolean => {
    let success = false;
    setProfile(prev => {
      const count = prev.lifelines[lifelineId] || 0;
      if (count <= 0) return prev;
      success = true;
      const next = {
        ...prev,
        lifelines: {
          ...prev.lifelines,
          [lifelineId]: count - 1,
        },
      };
      saveProfile(next);
      return next;
    });
    return success;
  }, [saveProfile]);

  const addXP = useCallback((amount: number) => {
    setProfile(prev => {
      const next = { ...prev, xp: prev.xp + amount };
      saveProfile(next);
      return next;
    });
  }, [saveProfile]);

  const addCoins = useCallback((amount: number) => {
    setProfile(prev => {
      const next = { ...prev, coins: prev.coins + amount };
      saveProfile(next);
      return next;
    });
  }, [saveProfile]);

  const addMatchResult = useCallback((result: MatchResult) => {
    setProfile(prev => {
      const next = {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        wins: result.position === 1 ? prev.wins + 1 : prev.wins,
        losses: result.position > 3 ? prev.losses + 1 : prev.losses,
        streak: result.position <= 3 ? prev.streak + 1 : 0,
        xp: prev.xp + result.xpGained,
        coins: prev.coins + result.coinsGained,
        recentMatches: [result, ...prev.recentMatches].slice(0, 10),
      };
      saveProfile(next);
      return next;
    });
  }, [saveProfile]);

  const value = useMemo(() => ({
    profile,
    updateProfile,
    buyLifeline,
    useLifeline,
    addXP,
    addCoins,
    addMatchResult,
    loadProfile,
  }), [profile, updateProfile, buyLifeline, useLifeline, addXP, addCoins, addMatchResult, loadProfile]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
