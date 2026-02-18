import { EASY_QUESTIONS } from "./questions-easy";
import { MEDIUM_QUESTIONS } from "./questions-medium";
import { HARD_QUESTIONS } from "./questions-hard";

export type RankTier = "beginner" | "intermediate" | "smart" | "expert" | "genius" | "mastermind";

export interface RankInfo {
  tier: RankTier;
  level: number;
  label: string;
  color: string;
  minXP: number;
  maxXP: number;
  icon: string;
}

export const RANK_TIERS: { tier: RankTier; label: string; color: string; icon: string; levels: number }[] = [
  { tier: "beginner", label: "مبتدئ", color: "#94A3B8", icon: "school-outline", levels: 5 },
  { tier: "intermediate", label: "متوسط", color: "#38BDF8", icon: "fitness-outline", levels: 5 },
  { tier: "smart", label: "ذكي", color: "#10B981", icon: "bulb-outline", levels: 5 },
  { tier: "expert", label: "خبير", color: "#A855F7", icon: "diamond-outline", levels: 5 },
  { tier: "genius", label: "عبقري", color: "#F59E0B", icon: "flame-outline", levels: 5 },
  { tier: "mastermind", label: "نابغة", color: "#FFD700", icon: "trophy-outline", levels: 1 },
];

export function getRankFromXP(xp: number): RankInfo {
  const xpPerLevel = 200;
  let accXP = 0;
  for (const t of RANK_TIERS) {
    for (let lvl = 1; lvl <= t.levels; lvl++) {
      const min = accXP;
      const max = accXP + xpPerLevel;
      if (xp < max || (t.tier === "mastermind" && lvl === t.levels)) {
        return {
          tier: t.tier,
          level: lvl,
          label: t.tier === "mastermind" ? "نابغة" : `${t.label} ${lvl}`,
          color: t.color,
          minXP: min,
          maxXP: max,
          icon: t.icon,
        };
      }
      accXP += xpPerLevel;
    }
  }
  return { tier: "mastermind", level: 1, label: "نابغة", color: "#FFD700", minXP: accXP, maxXP: accXP + 1000, icon: "trophy-outline" };
}

export interface Lifeline {
  id: string;
  name: string;
  icon: string;
  description: string;
  price: number;
}

export const LIFELINES: Lifeline[] = [
  { id: "fifty_fifty", name: "٥٠/٥٠", icon: "cut-outline", description: "إزالة إجابتين خاطئتين", price: 50 },
  { id: "time_freeze", name: "تجميد الوقت", icon: "snow-outline", description: "إيقاف المؤقت لمدة ١٠ ثوانٍ", price: 75 },
  { id: "shield", name: "درع", icon: "shield-checkmark-outline", description: "حماية من خسارة النقاط", price: 100 },
];

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  difficulty: "simple" | "medium" | "hard";
  category: string;
}

export const ALL_QUESTIONS: Question[] = [
  ...EASY_QUESTIONS.map((q, i) => ({ ...q, id: `easy_${i}` })),
  ...MEDIUM_QUESTIONS.map((q, i) => ({ ...q, id: `medium_${i}` })),
  ...HARD_QUESTIONS.map((q, i) => ({ ...q, id: `hard_${i}` })),
];

export function getGameQuestions(count: number = 30): Question[] {
  const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export interface PlayerProfile {
  id: string;
  name: string;
  xp: number;
  coins: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  streak: number;
  lifelines: { [key: string]: number };
  recentMatches: MatchResult[];
}

export interface MatchResult {
  id: string;
  date: string;
  position: number;
  score: number;
  totalPlayers: number;
  xpGained: number;
  coinsGained: number;
}

export const DEFAULT_PROFILE: PlayerProfile = {
  id: "player_1",
  name: "لاعب",
  xp: 450,
  coins: 500,
  wins: 12,
  losses: 5,
  gamesPlayed: 17,
  streak: 3,
  lifelines: { fifty_fifty: 2, time_freeze: 1, shield: 1 },
  recentMatches: [
    { id: "m1", date: "2026-02-18", position: 1, score: 2450, totalPlayers: 10, xpGained: 45, coinsGained: 100 },
    { id: "m2", date: "2026-02-17", position: 3, score: 1980, totalPlayers: 10, xpGained: 25, coinsGained: 50 },
    { id: "m3", date: "2026-02-17", position: 2, score: 2100, totalPlayers: 10, xpGained: 35, coinsGained: 75 },
    { id: "m4", date: "2026-02-16", position: 5, score: 1500, totalPlayers: 10, xpGained: 15, coinsGained: 30 },
    { id: "m5", date: "2026-02-16", position: 1, score: 2600, totalPlayers: 10, xpGained: 50, coinsGained: 120 },
  ],
};

export const BOT_NAMES = [
  "سيد الأسئلة", "موجة ذكاء", "خزان المعرفة", "برق العقل", "ثعلب ذكي",
  "نينجا المعرفة", "ملك الحكمة", "محترف الألغاز", "عبقرية", "بطل التحدي",
  "أمير المنطق", "ساحر الأسئلة", "عاصفة الدماغ", "أعلم بكل شيء", "العقل المدبر",
];

export const REACTION_ICONS = [
  { id: "fire", icon: "flame-outline", label: "نار" },
  { id: "thumbsup", icon: "thumbs-up-outline", label: "رائع" },
  { id: "lightning", icon: "flash-outline", label: "سريع" },
  { id: "eyes", icon: "eye-outline", label: "أراقب" },
  { id: "laugh", icon: "happy-outline", label: "هاها" },
  { id: "clap", icon: "hand-left-outline", label: "تصفيق" },
];

export const QUESTION_CATEGORIES = [
  { id: "all", label: "جميع الفئات", icon: "apps-outline", color: "#00E5FF" },
  { id: "علوم", label: "علوم", icon: "flask-outline", color: "#10B981" },
  { id: "جغرافيا", label: "جغرافيا", icon: "globe-outline", color: "#38BDF8" },
  { id: "تاريخ", label: "تاريخ", icon: "time-outline", color: "#F59E0B" },
  { id: "رياضيات", label: "رياضيات", icon: "calculator-outline", color: "#A855F7" },
  { id: "أدب", label: "أدب", icon: "book-outline", color: "#EC4899" },
  { id: "تكنولوجيا", label: "تكنولوجيا", icon: "hardware-chip-outline", color: "#06B6D4" },
  { id: "رياضة", label: "رياضة", icon: "football-outline", color: "#EF4444" },
  { id: "ثقافة", label: "ثقافة عامة", icon: "library-outline", color: "#8B5CF6" },
  { id: "إسلامية", label: "إسلامية", icon: "moon-outline", color: "#059669" },
];

export function getGameQuestionsByCategory(count: number = 30, category: string = "all"): Question[] {
  const pool = category === "all" ? ALL_QUESTIONS : ALL_QUESTIONS.filter(q => q.category === category);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  requirement: number;
  type: "wins" | "games" | "streak" | "xp" | "coins_earned" | "friends" | "correct_answers";
  reward: { xp: number; coins: number };
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_win", title: "أول انتصار", description: "فز بأول مباراة", icon: "trophy-outline", color: "#FFD700", requirement: 1, type: "wins", reward: { xp: 50, coins: 100 } },
  { id: "wins_10", title: "محارب", description: "فز بـ ١٠ مباريات", icon: "shield-outline", color: "#38BDF8", requirement: 10, type: "wins", reward: { xp: 100, coins: 200 } },
  { id: "wins_50", title: "بطل", description: "فز بـ ٥٠ مباراة", icon: "medal-outline", color: "#A855F7", requirement: 50, type: "wins", reward: { xp: 250, coins: 500 } },
  { id: "wins_100", title: "أسطوري", description: "فز بـ ١٠٠ مباراة", icon: "star-outline", color: "#FFD700", requirement: 100, type: "wins", reward: { xp: 500, coins: 1000 } },
  { id: "games_25", title: "نشيط", description: "العب ٢٥ مباراة", icon: "game-controller-outline", color: "#10B981", requirement: 25, type: "games", reward: { xp: 75, coins: 150 } },
  { id: "games_100", title: "مدمن كويز", description: "العب ١٠٠ مباراة", icon: "infinite-outline", color: "#F97316", requirement: 100, type: "games", reward: { xp: 200, coins: 400 } },
  { id: "streak_3", title: "سلسلة ثلاثية", description: "حقق سلسلة ٣ انتصارات", icon: "flame-outline", color: "#EF4444", requirement: 3, type: "streak", reward: { xp: 50, coins: 75 } },
  { id: "streak_5", title: "لا يُهزم", description: "حقق سلسلة ٥ انتصارات", icon: "bonfire-outline", color: "#F59E0B", requirement: 5, type: "streak", reward: { xp: 100, coins: 200 } },
  { id: "streak_10", title: "آلة الفوز", description: "حقق سلسلة ١٠ انتصارات", icon: "rocket-outline", color: "#EC4899", requirement: 10, type: "streak", reward: { xp: 300, coins: 500 } },
  { id: "xp_1000", title: "خبير ناشئ", description: "اجمع ١٠٠٠ نقطة خبرة", icon: "trending-up-outline", color: "#06B6D4", requirement: 1000, type: "xp", reward: { xp: 100, coins: 200 } },
  { id: "xp_5000", title: "عالم", description: "اجمع ٥٠٠٠ نقطة خبرة", icon: "school-outline", color: "#8B5CF6", requirement: 5000, type: "xp", reward: { xp: 250, coins: 500 } },
];

export const DAILY_REWARDS = [
  { day: 1, coins: 50, xp: 10, label: "اليوم ١" },
  { day: 2, coins: 75, xp: 15, label: "اليوم ٢" },
  { day: 3, coins: 100, xp: 20, label: "اليوم ٣" },
  { day: 4, coins: 150, xp: 30, label: "اليوم ٤" },
  { day: 5, coins: 200, xp: 40, label: "اليوم ٥" },
  { day: 6, coins: 300, xp: 50, label: "اليوم ٦" },
  { day: 7, coins: 500, xp: 100, label: "اليوم ٧", bonus: true },
];

export interface SeasonInfo {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  icon: string;
  color: string;
}

export function getCurrentSeason(): SeasonInfo {
  return {
    id: "season_1",
    name: "موسم التحدي الأول",
    startDate: "2026-02-01",
    endDate: "2026-04-01",
    icon: "trophy",
    color: "#FFD700",
  };
}

export function getSeasonDaysLeft(): number {
  const season = getCurrentSeason();
  const end = new Date(season.endDate).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}

export function generateLeaderboard(playerName: string, playerXp: number): { name: string; xp: number; rank: RankInfo }[] {
  const leaderboard = BOT_NAMES.slice(0, 19).map(name => {
    const xp = Math.floor(Math.random() * 6000) + 500;
    return { name, xp, rank: getRankFromXP(xp) };
  });
  leaderboard.push({ name: playerName, xp: playerXp, rank: getRankFromXP(playerXp) });
  return leaderboard.sort((a, b) => b.xp - a.xp);
}
