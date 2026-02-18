# ساحة المعرفة (QuizArena)

## Overview
A competitive quiz app built with Expo React Native. Fully Arabic interface. Dark theme with neon accents (cyan, gold, purple). Three game modes: Classic (10 players, 30 questions), 1v1 Duel (2 players, 15 questions), and 2v2 Team (4 players, 20 questions). Features voice chat, text messaging, lifelines, 26-rank progression, achievements, daily rewards, leaderboards, and seasonal content.

## Architecture
- **Frontend**: Expo Router (file-based routing) with React Native
- **Backend**: Express server on port 5000 (API + landing page)
- **State**: AsyncStorage for local persistence via GameContext
- **Styling**: StyleSheet with Rajdhani font family, dark neon theme
- **Language**: All UI text is in Arabic

## Key Files
- `lib/game-data.ts` - Game data: ranks, questions (Arabic), lifelines, bot names, achievements, daily rewards, seasons, leaderboard generator, question categories
- `lib/game-context.tsx` - GameProvider context for profile, coins, XP, lifelines
- `lib/sounds.ts` - Sound effects utility (playSound, setSoundEnabled)
- `app/(tabs)/index.tsx` - Dashboard screen with daily rewards, season banner, quick actions
- `app/(tabs)/store.tsx` - Store for buying lifelines, frames, themes, coin packs, limited-time offers
- `app/(tabs)/ranks.tsx` - Rank ladder (26 ranks)
- `app/(tabs)/profile.tsx` - Player profile with stats, name change
- `app/(tabs)/friends.tsx` - Friends tab with 3 sub-tabs (friends, requests, search)
- `app/mode-select.tsx` - Mode selection (Classic, 1v1, 2v2) with category filter
- `app/matchmaking.tsx` - Matchmaking lobby with animated player slots, passes category param
- `app/game.tsx` - Classic game screen (10 players, 30 questions, category-filtered)
- `app/game-1v1.tsx` - 1v1 duel screen (2 players, 15 questions, category-filtered)
- `app/game-2v2.tsx` - 2v2 team screen (4 players, 20 questions, category-filtered)
- `app/leaderboard.tsx` - Global leaderboard with daily/weekly/all-time tabs, season info, top 3 podium
- `app/achievements.tsx` - Achievement badges with progress tracking and rewards
- `app/rank-up.tsx` - Rank-up splash screen
- `components/ChatOverlay.tsx` - Text chat overlay for all game modes
- `components/VoiceChatBar.tsx` - Voice chat bar with mute and speaking indicators
- `constants/colors.ts` - Theme colors (dark mode)

## Question Categories
10 categories: جميع الفئات (all), علوم, جغرافيا, تاريخ, رياضيات, أدب, تكنولوجيا, رياضة, ثقافة عامة, إسلامية
- Category selection on mode-select screen
- Category passed through matchmaking to game screens
- `getGameQuestionsByCategory(count, category)` filters questions

## Achievements System
11 achievements covering: wins (1/10/50/100), games played (25/100), streaks (3/5/10), XP milestones (1000/5000)
- Each achievement has XP and coin rewards
- Progress tracked against profile stats
- Achievements screen at `/achievements`

## Daily Rewards
7-day streak system with escalating rewards (50-500 coins, 10-100 XP)
- Day 7 has bonus reward
- AsyncStorage persistence (@quiz_daily_reward)
- Daily reward banner on dashboard
- Modal with 7-day grid showing progress

## Leaderboard
- Simulated leaderboard using bot names + player
- Daily/Weekly/All-time tabs
- Top 3 podium display with ranked styling
- Season info banner

## Seasons
- Season system with name, dates, icon, color
- Current: "موسم التحدي الأول" (Feb 1 - Apr 1, 2026)
- Days remaining counter on dashboard

## Rank System
Beginner (مبتدئ) 1-5, Intermediate (متوسط) 1-5, Smart (ذكي) 1-5, Expert (خبير) 1-5, Genius (عبقري) 1-5, Mastermind (نابغة) = 26 total ranks. 200 XP per rank level.

## Lifelines
- 50/50 (٥٠/٥٠): Remove 2 wrong answers
- Time Freeze (تجميد الوقت): Pause timer 10s
- Shield (درع): Protect from losing points

## Store
- Lifelines: Buy 50/50, Time Freeze, Shield with coins
- Coin Packs: Free daily, watch ad, premium packs
- Frames: 6 decorative frames (fire, ice, gold, neon, diamond, crown)
- Themes: 6 color themes (ocean, sunset, forest, galaxy, aurora, royal)
- Limited Time Offers: 3 rotating deals with discounted prices and timers

## GitHub Actions
`.github/workflows/android-build.yml` - Builds Android APK on push to main

## Database Tables
- `users` - Player accounts (varchar UUID id, email, password, name, username, xp, coins, stats, premium items, settings, nameChangedAt)
- `friendships` - Bidirectional friend relationships (userId, friendId)
- `friend_requests` - Pending/accepted/rejected friend requests (senderId, receiverId, status)
- `support_tickets` - User support tickets (userId, subject, message, status)
- `session` - Express session store (auto-created by connect-pg-simple)

## Friend System
- Search users by name/email, send friend requests, accept/reject incoming requests
- Friends list shows rank, win rate, with invite-to-game and remove friend actions
- Game invites navigate to mode-select with friend info as params

## Nickname System
- Users get "اسم مستعار" (nickname) during registration
- Can change every 60 days with countdown timer
- Backend enforces restriction via nameChangedAt timestamp

## Ads System (AdMob)
- Publisher ID: pub-2793977718393893
- AdBanner component (`components/AdBanner.tsx`): Simulated ad banners with rotating promotional text
- Ad utility (`lib/ads.ts`): showRewardedAd() and showInterstitialAd() functions
- Env vars: EXPO_PUBLIC_ADMOB_APP_ID, EXPO_PUBLIC_ADMOB_BANNER_ID, EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID, EXPO_PUBLIC_ADMOB_REWARDED_ID
- Ad placements: Dashboard (between lifelines and recent matches), Store coins tab, all game over screens (Classic, 1v1, 2v2)
- Rewarded ads: "Watch ad for coins" in store uses showRewardedAd()
- Currently simulated for Expo Go development; ready for native AdMob SDK when building APK

## Recent Changes
- 2026-02-18: Initial build with full Arabic interface, dashboard, matchmaking, game, store, ranks, profile screens
- 2026-02-18: Added 1v1 duel mode, 2v2 team mode, mode selection screen, voice chat bar, text chat overlay, updated matchmaking for all modes
- 2026-02-18: Added friend system with search, requests, friends list, game invites, and Friends tab in navigation
- 2026-02-18: Added competitive improvements: question categories, achievements, daily rewards, leaderboard, seasons, share results, limited-time store offers, sound effects hooks
- 2026-02-18: Added AdMob ad integration with banner ads on dashboard, store, and game over screens; rewarded ad for coins in store
