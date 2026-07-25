export type GameType = 'tictactoe' | 'ludo' | 'snakes';

export type UserStatus = 'online' | 'in_game' | 'offline' | 'banned' | 'muted';

export interface UserProfile {
  id: string; // Numeric string or Telegram User ID
  telegramId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number; // percentage
  friends: string[]; // friend user IDs
  blockedUsers: string[];
  lastOnline: string;
  status: UserStatus;
  createdAt: string;
  // Future architecture fields
  coins: number;
  rank: string;
  level: number;
  inventory: string[];
}

export type RoomStatus = 'waiting' | 'playing' | 'finished' | 'cancelled';

export interface PlayerInRoom {
  id: string;
  username: string;
  displayName: string;
  color?: string; // For Ludo/Snakes ('red' | 'blue' | 'green' | 'yellow' or 'X' | 'O')
  isReady: boolean;
  isHost: boolean;
  isConnected: boolean;
  position?: number; // For Snakes & Ladders (1-100)
  ludoTokens?: number[]; // For Ludo: 4 tokens positions (0=base, 1..52 main track, 53..58 home stretch, 59=finished)
}

export interface TicTacToeState {
  board: (string | null)[]; // 9 cells
  winningLine?: number[];
}

export interface LudoState {
  // 4 colors: red, blue, green, yellow
  playerColors: Record<string, 'red' | 'blue' | 'green' | 'yellow'>;
  // token positions per player color (array of 4 numbers)
  tokens: Record<string, number[]>;
  lastDiceRoll?: number;
  lastRollTime?: number;
  canRollDice: boolean;
  hasMovedThisTurn: boolean;
}

export interface SnakesState {
  // player positions (1-100)
  positions: Record<string, number>;
  lastDiceRoll?: number;
  lastRollTime?: number;
  boardSnakes: Record<number, number>; // start -> end
  boardLadders: Record<number, number>; // start -> end
}

export interface GameRoom {
  id: string;
  code: string; // e.g. RM-8391
  gameType: GameType;
  maxPlayers: number;
  status: RoomStatus;
  hostId: string;
  players: PlayerInRoom[];
  currentTurnUserId?: string;
  turnTimeout: number; // seconds, default 30
  turnDeadline?: number; // timestamp
  winnerId?: string | 'draw';
  createdAt: string;
  updatedAt: string;
  isPrivate: boolean;
  ticTacToe?: TicTacToeState;
  ludo?: LudoState;
  snakes?: SnakesState;
  moveHistory: {
    userId: string;
    details: any;
    timestamp: string;
  }[];
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  text: string;
  isSystem?: boolean;
  timestamp: string;
}

export type ReportCategory = 'spam' | 'cheating' | 'abuse' | 'language' | 'fake_account';

export interface UserReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  category: ReportCategory;
  description: string;
  roomId?: string;
  status: 'pending' | 'reviewed' | 'banned' | 'dismissed';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'invite' | 'turn' | 'system' | 'broadcast';
  read: boolean;
  createdAt: string;
}

export interface AdminConfig {
  botToken: string;
  adminId: string;
  databaseUrl: string;
  redisUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  defaultTurnTime: number; // seconds
}

export interface PlatformStats {
  totalUsers: number;
  onlineUsers: number;
  activeRooms: number;
  totalGamesPlayed: number;
  pendingReportsCount: number;
}
