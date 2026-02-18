import { Platform } from "react-native";

const AD_CONFIG = {
  publisherId: "pub-2793977718393893",
  bannerId: process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || "ca-app-pub-2793977718393893/0000000000",
  interstitialId: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || "ca-app-pub-2793977718393893/0000000001",
  rewardedId: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID || "ca-app-pub-2793977718393893/0000000002",
};

export function getAdConfig() {
  return AD_CONFIG;
}

export function showInterstitialAd(): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 2000);
  });
}

export function showRewardedAd(): Promise<{ rewarded: boolean; amount: number }> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ rewarded: true, amount: 500 }), 3000);
  });
}
