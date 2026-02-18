import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users, supportTickets, friendships, friendRequests } from "./schema";
import { eq, and, or, ne, ilike } from "drizzle-orm";

const PgStore = connectPg(session);

function getUserId(req: Request): string | null {
  return (req.session as any).userId || null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(
    session({
      store: new PgStore({
        conString: process.env.DATABASE_URL!,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "quiz-arena-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: false,
        httpOnly: true,
        sameSite: "lax",
      },
    })
  );

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ message: "جميع الحقول مطلوبة" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "كلمة المرور يجب أن تكون ٦ أحرف على الأقل" });
      }
      const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
      if (existing.length > 0) {
        return res.status(409).json({ message: "البريد الإلكتروني مستخدم بالفعل" });
      }
      const hashed = await bcrypt.hash(password, 10);
      const username = email.toLowerCase().split("@")[0] + "_" + Date.now().toString(36);
      const [user] = await db.insert(users).values({
        username,
        email: email.toLowerCase(),
        password: hashed,
        name,
        provider: "email",
      }).returning();
      (req.session as any).userId = user.id;
      const { password: _, ...safeUser } = user;
      return res.status(201).json({ user: safeUser });
    } catch (err) {
      console.error("Register error:", err);
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "البريد وكلمة المرور مطلوبان" });
      }
      const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
      if (!user) {
        return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
      }
      (req.session as any).userId = user.id;
      const { password: _, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "غير مسجل الدخول" });
      }
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(401).json({ message: "المستخدم غير موجود" });
      }
      const { password: _, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (err) {
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "خطأ في تسجيل الخروج" });
      res.clearCookie("connect.sid");
      return res.json({ message: "تم تسجيل الخروج" });
    });
  });

  app.put("/api/user/profile", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "غير مسجل" });
      const updates = req.body;
      delete updates.id;
      delete updates.email;
      delete updates.password;
      const [updated] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
      const { password: _, ...safeUser } = updated;
      return res.json({ user: safeUser });
    } catch (err) {
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.put("/api/user/change-name", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "غير مسجل" });
      const { name } = req.body;
      if (!name || name.trim().length < 2 || name.trim().length > 20) {
        return res.status(400).json({ message: "الاسم يجب أن يكون بين ٢ و ٢٠ حرفاً" });
      }
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

      if (user.nameChangedAt) {
        const lastChange = new Date(user.nameChangedAt).getTime();
        const now = Date.now();
        const daysSince = (now - lastChange) / (1000 * 60 * 60 * 24);
        if (daysSince < 60) {
          const daysLeft = Math.ceil(60 - daysSince);
          return res.status(403).json({
            message: `لا يمكنك تغيير الاسم إلا بعد ${daysLeft} يوم`,
            daysLeft,
          });
        }
      }

      const [updated] = await db.update(users)
        .set({ name: name.trim(), nameChangedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      const { password: _, ...safeUser } = updated;
      return res.json({ user: safeUser });
    } catch (err) {
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // ===== FRIEND SYSTEM =====

  app.get("/api/friends/search", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "غير مسجل" });
      const query = (req.query.q as string || "").trim();
      if (query.length < 2) {
        return res.json({ users: [] });
      }
      const results = await db.select({
        id: users.id,
        name: users.name,
        xp: users.xp,
        equippedFrame: users.equippedFrame,
      }).from(users).where(
        and(
          ne(users.id, userId),
          or(
            ilike(users.name, `%${query}%`),
            ilike(users.email, `%${query}%`)
          )
        )
      ).limit(20);
      return res.json({ users: results });
    } catch (err) {
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/friends/request", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "غير مسجل" });
      const { friendId } = req.body;
      if (!friendId || friendId === userId) {
        return res.status(400).json({ message: "طلب غير صالح" });
      }

      const existingFriendship = await db.select().from(friendships).where(
        or(
          and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)),
          and(eq(friendships.userId, friendId), eq(friendships.friendId, userId))
        )
      );
      if (existingFriendship.length > 0) {
        return res.status(409).json({ message: "أنتما أصدقاء بالفعل" });
      }

      const existingRequest = await db.select().from(friendRequests).where(
        and(
          or(
            and(eq(friendRequests.senderId, userId), eq(friendRequests.receiverId, friendId)),
            and(eq(friendRequests.senderId, friendId), eq(friendRequests.receiverId, userId))
          ),
          eq(friendRequests.status, "pending")
        )
      );
      if (existingRequest.length > 0) {
        return res.status(409).json({ message: "يوجد طلب صداقة معلق بالفعل" });
      }

      const [request] = await db.insert(friendRequests).values({
        senderId: userId,
        receiverId: friendId,
      }).returning();
      return res.status(201).json({ request });
    } catch (err) {
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.get("/api/friends/requests/incoming", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "غير مسجل" });

      const requests = await db.select({
        id: friendRequests.id,
        senderId: friendRequests.senderId,
        status: friendRequests.status,
        createdAt: friendRequests.createdAt,
        senderName: users.name,
        senderXp: users.xp,
        senderFrame: users.equippedFrame,
      }).from(friendRequests)
        .innerJoin(users, eq(friendRequests.senderId, users.id))
        .where(
          and(
            eq(friendRequests.receiverId, userId),
            eq(friendRequests.status, "pending")
          )
        );
      return res.json({ requests });
    } catch (err) {
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.get("/api/friends/requests/outgoing", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "غير مسجل" });

      const requests = await db.select({
        id: friendRequests.id,
        receiverId: friendRequests.receiverId,
        status: friendRequests.status,
        createdAt: friendRequests.createdAt,
        receiverName: users.name,
        receiverXp: users.xp,
      }).from(friendRequests)
        .innerJoin(users, eq(friendRequests.receiverId, users.id))
        .where(
          and(
            eq(friendRequests.senderId, userId),
            eq(friendRequests.status, "pending")
          )
        );
      return res.json({ requests });
    } catch (err) {
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/friends/request/:id/accept", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "غير مسجل" });
      const requestId = parseInt(req.params.id as string);

      const [request] = await db.select().from(friendRequests)
        .where(and(eq(friendRequests.id, requestId), eq(friendRequests.receiverId, userId)));
      if (!request) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      await db.update(friendRequests).set({ status: "accepted" }).where(eq(friendRequests.id, requestId));

      await db.insert(friendships).values([
        { userId: request.senderId, friendId: request.receiverId },
        { userId: request.receiverId, friendId: request.senderId },
      ]);

      return res.json({ message: "تم قبول طلب الصداقة" });
    } catch (err) {
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/friends/request/:id/reject", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "غير مسجل" });
      const requestId = parseInt(req.params.id as string);

      const [request] = await db.select().from(friendRequests)
        .where(and(eq(friendRequests.id, requestId), eq(friendRequests.receiverId, userId)));
      if (!request) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      await db.update(friendRequests).set({ status: "rejected" }).where(eq(friendRequests.id, requestId));
      return res.json({ message: "تم رفض طلب الصداقة" });
    } catch (err) {
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.get("/api/friends", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "غير مسجل" });

      const friends = await db.select({
        id: users.id,
        name: users.name,
        xp: users.xp,
        equippedFrame: users.equippedFrame,
        gamesPlayed: users.gamesPlayed,
        wins: users.wins,
      }).from(friendships)
        .innerJoin(users, eq(friendships.friendId, users.id))
        .where(eq(friendships.userId, userId));
      return res.json({ friends });
    } catch (err) {
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.delete("/api/friends/:friendId", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "غير مسجل" });
      const friendId = req.params.friendId as string;

      await db.delete(friendships).where(
        and(eq(friendships.userId, userId), eq(friendships.friendId, friendId))
      );
      await db.delete(friendships).where(
        and(eq(friendships.userId, friendId), eq(friendships.friendId, userId))
      );
      return res.json({ message: "تم حذف الصديق" });
    } catch (err) {
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // ===== SUPPORT =====

  app.post("/api/support/ticket", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "غير مسجل" });
      const { subject, message } = req.body;
      if (!subject || !message) {
        return res.status(400).json({ message: "الموضوع والرسالة مطلوبان" });
      }
      const [ticket] = await db.insert(supportTickets).values({
        userId,
        subject,
        message,
      }).returning();
      return res.status(201).json({ ticket });
    } catch (err) {
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.get("/api/support/tickets", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "غير مسجل" });
      const tickets = await db.select().from(supportTickets).where(eq(supportTickets.userId, userId));
      return res.json({ tickets });
    } catch (err) {
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
