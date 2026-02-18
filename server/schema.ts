import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, serial } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  password: text("password").notNull(),
  email: text("email"),
  name: text("name").default(""),
  provider: text("provider").default("email"),
  providerId: text("provider_id"),
  xp: integer("xp").default(0).notNull(),
  coins: integer("coins").default(500).notNull(),
  wins: integer("wins").default(0).notNull(),
  losses: integer("losses").default(0).notNull(),
  gamesPlayed: integer("games_played").default(0).notNull(),
  streak: integer("streak").default(0).notNull(),
  lifelines: jsonb("lifelines").default({ fifty_fifty: 2, time_freeze: 1, shield: 1 }).notNull(),
  equippedFrame: text("equipped_frame").default("default"),
  equippedTheme: text("equipped_theme").default("default"),
  ownedFrames: jsonb("owned_frames").default(["default"]).notNull(),
  ownedThemes: jsonb("owned_themes").default(["default"]).notNull(),
  ownedBadges: jsonb("owned_badges").default([]).notNull(),
  recentMatches: jsonb("recent_matches").default([]).notNull(),
  soundEnabled: boolean("sound_enabled").default(true).notNull(),
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
  nameChangedAt: timestamp("name_changed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  friendId: varchar("friend_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const friendRequests = pgTable("friend_requests", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id).notNull(),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").default("open").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
