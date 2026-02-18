import { Platform } from "react-native";

let soundEnabled = true;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled() {
  return soundEnabled;
}

export async function playSound(_key: string) {
  if (!soundEnabled) return;
}

export async function cleanupSounds() {}
