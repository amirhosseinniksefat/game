import fs from 'fs';
import path from 'path';
import {
  UserProfile,
  GameRoom,
  ChatMessage,
  UserReport,
  NotificationItem,
  AdminConfig,
  PlatformStats,
  GameType
} from '../types/index.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DBData {
  users: Record<string, UserProfile>;
  rooms: Record<string, GameRoom>;
  chatMessages: Record<string, ChatMessage[]>;
  reports: UserReport[];
  notifications: NotificationItem[];
  adminConfig: AdminConfig;
  stats: {
    totalGamesPlayed: number;
  };
}

const defaultConfig: AdminConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  adminId: process.env.TELEGRAM_ADMIN_ID || '123456789',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/gamebot',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
  maintenanceMessage: 'پلتفرم به علت به‌روزرسانی سیستم موقتاً در دست تعمیر است. لطفاً شکیبا باشید.',
  defaultTurnTime: 30,
};

class DataStore {
  private users: Map<string, UserProfile> = new Map();
  private rooms: Map<string, GameRoom> = new Map();
  private chatMessages: Map<string, ChatMessage[]> = new Map();
  private reports: UserReport[] = [];
  private notifications: NotificationItem[] = [];
  private adminConfig: AdminConfig = defaultConfig;
  private totalGamesPlayed = 0;

  constructor() {
    this.ensureDataDir();
    this.loadFromDisk();
    this.seedInitialUsers();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('Error creating data directory:', err);
      }
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed: DBData = JSON.parse(raw);
        
        if (parsed.users) {
          Object.entries(parsed.users).forEach(([id, u]) => this.users.set(id, u));
        }
        if (parsed.rooms) {
          Object.entries(parsed.rooms).forEach(([id, r]) => this.rooms.set(id, r));
        }
        if (parsed.chatMessages) {
          Object.entries(parsed.chatMessages).forEach(([roomId, msgs]) => this.chatMessages.set(roomId, msgs));
        }
        if (parsed.reports) {
          this.reports = parsed.reports;
        }
        if (parsed.notifications) {
          this.notifications = parsed.notifications;
        }
        if (parsed.adminConfig) {
          this.adminConfig = { ...defaultConfig, ...parsed.adminConfig };
        }
        if (parsed.stats?.totalGamesPlayed) {
          this.totalGamesPlayed = parsed.stats.totalGamesPlayed;
        }
      }
    } catch (err) {
      console.error('Failed to load DB from disk, starting fresh:', err);
    }
  }

  private saveToDisk() {
    try {
      const data: DBData = {
        users: Object.fromEntries(this.users),
        rooms: Object.fromEntries(this.rooms),
        chatMessages: Object.fromEntries(this.chatMessages),
        reports: this.reports,
        notifications: this.notifications,
        adminConfig: this.adminConfig,
        stats: {
          totalGamesPlayed: this.totalGamesPlayed,
        },
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save DB to disk:', err);
    }
  }

  private seedInitialUsers() {
    if (this.users.size === 0) {
      const adminId = this.adminConfig.adminId || '123456789';
      this.getOrCreateUser(adminId, 'admin_hero', 'مدیر سیستم (ادمین)');
      this.getOrCreateUser('987654321', 'player_ali', 'علی رضایی');
      this.getOrCreateUser('555666777', 'maryam_gamer', 'مریم حسینی');
      this.getOrCreateUser('111222333', 'sara_pro', 'سارا احمدی');
    }
  }

  // --- USER METHODS ---
  public getOrCreateUser(telegramId: string, username?: string, displayName?: string): UserProfile {
    let user = this.users.get(telegramId);
    if (!user) {
      user = {
        id: telegramId,
        telegramId,
        username: username || `user_${telegramId.slice(-4)}`,
        displayName: displayName || username || `کاربر ${telegramId.slice(-4)}`,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        friends: [],
        blockedUsers: [],
        lastOnline: new Date().toISOString(),
        status: 'online',
        createdAt: new Date().toISOString(),
        coins: 1000,
        rank: 'تازه کار (Bronze)',
        level: 1,
        inventory: ['default_avatar', 'basic_dice'],
      };
      this.users.set(telegramId, user);
      this.saveToDisk();
    } else {
      let updated = false;
      if (username && user.username !== username) {
        user.username = username;
        updated = true;
      }
      if (displayName && user.displayName !== displayName) {
        user.displayName = displayName;
        updated = true;
      }
      user.lastOnline = new Date().toISOString();
      user.status = user.status === 'banned' ? 'banned' : 'online';
      if (updated) this.saveToDisk();
    }
    return user;
  }

  public getUser(id: string): UserProfile | undefined {
    return this.users.get(id);
  }

  public getAllUsers(): UserProfile[] {
    return Array.from(this.users.values());
  }

  public updateUser(user: UserProfile): void {
    this.users.set(user.id, user);
    this.saveToDisk();
  }

  public updateUserStatus(id: string, status: UserProfile['status']): void {
    const u = this.users.get(id);
    if (u) {
      u.status = status;
      u.lastOnline = new Date().toISOString();
      this.saveToDisk();
    }
  }

  public addFriend(userId: string, friendId: string): boolean {
    const user = this.users.get(userId);
    const friend = this.users.get(friendId);
    if (user && friend && userId !== friendId) {
      if (!user.friends.includes(friendId)) user.friends.push(friendId);
      if (!friend.friends.includes(userId)) friend.friends.push(userId);
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public blockUser(userId: string, targetId: string): void {
    const user = this.users.get(userId);
    if (user && !user.blockedUsers.includes(targetId)) {
      user.blockedUsers.push(targetId);
      this.saveToDisk();
    }
  }

  public unblockUser(userId: string, targetId: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.blockedUsers = user.blockedUsers.filter((id) => id !== targetId);
      this.saveToDisk();
    }
  }

  // --- ROOM METHODS ---
  public createRoom(
    gameType: GameType,
    hostId: string,
    isPrivate = false,
    maxPlayers?: number
  ): GameRoom {
    const host = this.getUser(hostId);
    if (!host) throw new Error('کاربر یافت نشد');

    const defaultMax = gameType === 'tictactoe' ? 2 : 4;
    const roomMax = maxPlayers || defaultMax;
    const roomCode = `RM-${Math.floor(1000 + Math.random() * 9000)}`;

    const room: GameRoom = {
      id: `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      code: roomCode,
      gameType,
      maxPlayers: roomMax,
      status: 'waiting',
      hostId,
      players: [
        {
          id: host.id,
          username: host.username,
          displayName: host.displayName,
          isReady: true,
          isHost: true,
          isConnected: true,
        },
      ],
      turnTimeout: this.adminConfig.defaultTurnTime || 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPrivate,
      moveHistory: [],
    };

    this.rooms.set(room.id, room);
    this.updateUserStatus(hostId, 'in_game');
    this.saveToDisk();
    return room;
  }

  public getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  public getRoomByCode(code: string): GameRoom | undefined {
    return Array.from(this.rooms.values()).find(
      (r) => r.code.toUpperCase() === code.toUpperCase() && r.status !== 'finished' && r.status !== 'cancelled'
    );
  }

  public getAllRooms(): GameRoom[] {
    return Array.from(this.rooms.values());
  }

  public getActiveRooms(): GameRoom[] {
    return Array.from(this.rooms.values()).filter(
      (r) => r.status === 'waiting' || r.status === 'playing'
    );
  }

  public updateRoom(room: GameRoom): void {
    room.updatedAt = new Date().toISOString();
    this.rooms.set(room.id, room);
    this.saveToDisk();
  }

  public joinRoom(roomId: string, userId: string): GameRoom {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('اتاق پیدا نشد');
    if (room.status === 'finished' || room.status === 'cancelled') throw new Error('این بازی به پایان رسیده است');
    
    const existingPlayer = room.players.find((p) => p.id === userId);
    if (existingPlayer) {
      existingPlayer.isConnected = true;
      this.updateRoom(room);
      return room;
    }

    if (room.players.length >= room.maxPlayers) throw new Error('اتاق کامل شده است');

    const user = this.getUser(userId);
    if (!user) throw new Error('کاربر یافت نشد');

    room.players.push({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      isReady: false,
      isHost: false,
      isConnected: true,
    });

    this.updateUserStatus(userId, 'in_game');
    this.updateRoom(room);
    return room;
  }

  public leaveRoom(roomId: string, userId: string): GameRoom {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('اتاق پیدا نشد');

    room.players = room.players.filter((p) => p.id !== userId);
    this.updateUserStatus(userId, 'online');

    if (room.players.length === 0) {
      room.status = 'cancelled';
    } else if (room.hostId === userId) {
      // Reassign host
      room.hostId = room.players[0].id;
      room.players[0].isHost = true;
    }

    this.updateRoom(room);
    return room;
  }

  public incrementGamesCount() {
    this.totalGamesPlayed += 1;
    this.saveToDisk();
  }

  // --- CHAT METHODS ---
  public addChatMessage(roomId: string, senderId: string, senderName: string, text: string, isSystem = false): ChatMessage {
    const msg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      roomId,
      senderId,
      senderName,
      text,
      isSystem,
      timestamp: new Date().toISOString(),
    };

    const msgs = this.chatMessages.get(roomId) || [];
    msgs.push(msg);
    this.chatMessages.set(roomId, msgs);
    this.saveToDisk();
    return msg;
  }

  public getChatMessages(roomId: string): ChatMessage[] {
    return this.chatMessages.get(roomId) || [];
  }

  // --- REPORT METHODS ---
  public createReport(reporterId: string, reportedUserId: string, category: UserReport['category'], description: string, roomId?: string): UserReport {
    const reporter = this.getUser(reporterId);
    const reported = this.getUser(reportedUserId);

    const report: UserReport = {
      id: `report_${Date.now()}`,
      reporterId,
      reporterName: reporter?.displayName || reporterId,
      reportedUserId,
      reportedUserName: reported?.displayName || reportedUserId,
      category,
      description,
      roomId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.reports.push(report);
    this.saveToDisk();
    return report;
  }

  public getReports(): UserReport[] {
    return this.reports;
  }

  public updateReportStatus(reportId: string, status: UserReport['status']): void {
    const r = this.reports.find((rep) => rep.id === reportId);
    if (r) {
      r.status = status;
      this.saveToDisk();
    }
  }

  // --- ADMIN CONFIG & STATS ---
  public getAdminConfig(): AdminConfig {
    return this.adminConfig;
  }

  public updateAdminConfig(configPartial: Partial<AdminConfig>): AdminConfig {
    this.adminConfig = { ...this.adminConfig, ...configPartial };
    this.saveToDisk();
    return this.adminConfig;
  }

  public getStats(): PlatformStats {
    const users = Array.from(this.users.values());
    const onlineUsers = users.filter((u) => u.status === 'online' || u.status === 'in_game').length;
    const activeRooms = this.getActiveRooms().length;
    const pendingReportsCount = this.reports.filter((r) => r.status === 'pending').length;

    return {
      totalUsers: users.length,
      onlineUsers,
      activeRooms,
      totalGamesPlayed: this.totalGamesPlayed,
      pendingReportsCount,
    };
  }
}

export const db = new DataStore();
