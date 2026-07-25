import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/store.js';
import { initTicTacToe, makeTicTacToeMove } from './src/server/games/tictactoe.js';
import { initLudo, rollLudoDice, moveLudoToken } from './src/server/games/ludo.js';
import { initSnakes, rollSnakesDice } from './src/server/games/snakes.js';
import { botEngine } from './src/server/bot.js';
import { processBotTurnIfNeeded, ensureBotUser } from './src/server/aiBot.js';

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Map of connected WS clients: userId -> WebSocket
  const clientSockets = new Map<string, WebSocket>();

  // --- WEBSOCKET ENGINE ---
  wss.on('connection', (ws: WebSocket) => {
    let connectedUserId: string | null = null;
    let currentRoomId: string | null = null;

    ws.on('message', (data: string) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === 'auth') {
          connectedUserId = msg.userId;
          if (connectedUserId) {
            clientSockets.set(connectedUserId, ws);
            db.updateUserStatus(connectedUserId, 'online');
          }
        }

        if (msg.type === 'join_room_socket') {
          currentRoomId = msg.roomId;
          if (connectedUserId && currentRoomId) {
            // Broadcast room state
            broadcastRoomUpdate(currentRoomId);
          }
        }

        if (msg.type === 'typing_indicator') {
          if (msg.roomId && connectedUserId) {
            broadcastToRoom(msg.roomId, {
              type: 'user_typing',
              userId: connectedUserId,
              isTyping: msg.isTyping,
            });
          }
        }
      } catch (err) {
        console.error('WS Message Parse Error:', err);
      }
    });

    ws.on('close', () => {
      if (connectedUserId) {
        clientSockets.delete(connectedUserId);
        db.updateUserStatus(connectedUserId, 'offline');
        if (currentRoomId) {
          const room = db.getRoom(currentRoomId);
          if (room) {
            const player = room.players.find((p) => p.id === connectedUserId);
            if (player) player.isConnected = false;
            db.updateRoom(room);
            broadcastRoomUpdate(currentRoomId);
          }
        }
      }
    });
  });

  function broadcastToRoom(roomId: string, payload: any) {
    const room = db.getRoom(roomId);
    if (!room) return;
    room.players.forEach((p) => {
      const socket = clientSockets.get(p.id);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(payload));
      }
    });
  }

  function broadcastRoomUpdate(roomId: string) {
    const room = db.getRoom(roomId);
    if (!room) return;
    const chat = db.getChatMessages(roomId);
    broadcastToRoom(roomId, {
      type: 'room_update',
      room,
      chat,
    });
  }

  // Periodic Turn Timer Check
  setInterval(() => {
    const activeRooms = db.getActiveRooms().filter((r) => r.status === 'playing');
    const now = Date.now();

    activeRooms.forEach((room) => {
      if (!room.players || room.players.length === 0) return;
      if (room.turnDeadline && now > room.turnDeadline) {
        // Turn timed out -> auto pass turn or timeout
        db.addChatMessage(
          room.id,
          'system',
          'سیستم',
          `⏳ زمان نوبت به پایان رسید. نوبت پاس داده شد.`,
          true
        );

        if (room.gameType === 'tictactoe') {
          const opponent = room.players.find((p) => p.id !== room.currentTurnUserId);
          if (opponent) room.currentTurnUserId = opponent.id;
        } else if (room.gameType === 'ludo' && room.ludo) {
          const idx = room.players.findIndex((p) => p.id === room.currentTurnUserId);
          const nextIdx = (idx + 1) % room.players.length;
          room.currentTurnUserId = room.players[nextIdx].id;
          room.ludo.canRollDice = true;
          room.ludo.lastDiceRoll = undefined;
        } else if (room.gameType === 'snakes' && room.snakes) {
          const idx = room.players.findIndex((p) => p.id === room.currentTurnUserId);
          const nextIdx = (idx + 1) % room.players.length;
          room.currentTurnUserId = room.players[nextIdx].id;
        }

        const timeoutSec = room.turnTimeout || 30;
        room.turnDeadline = Date.now() + timeoutSec * 1000;
        db.updateRoom(room);
        broadcastRoomUpdate(room.id);
      }
    });
  }, 2000);

  // --- REST API ENDPOINTS ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get or Create User
  app.post('/api/auth/me', (req, res) => {
    try {
      const { telegramId, username, displayName } = req.body;
      const id = telegramId || 'guest_1001';
      const user = db.getOrCreateUser(id, username, displayName);
      res.json(user);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get User Profile
  app.get('/api/profile/:id', (req, res) => {
    const user = db.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: 'کاربر یافت نشد' });
    res.json(user);
  });

  // Get Online Users
  app.get('/api/users/online', (req, res) => {
    const users = db.getAllUsers().filter((u) => u.status === 'online' || u.status === 'in_game');
    res.json(users);
  });

  // Friend System
  app.post('/api/users/add-friend', (req, res) => {
    const { userId, friendId } = req.body;
    const ok = db.addFriend(userId, friendId);
    if (ok) res.json({ success: true });
    else res.status(400).json({ error: 'امکان افزودن دوست وجود ندارد' });
  });

  app.post('/api/users/block', (req, res) => {
    const { userId, targetId } = req.body;
    db.blockUser(userId, targetId);
    res.json({ success: true });
  });

  // Matchmaking / Rooms
  app.get('/api/rooms', (req, res) => {
    res.json(db.getActiveRooms());
  });

  app.get('/api/rooms/:id', (req, res) => {
    const room = db.getRoom(req.params.id);
    if (!room) return res.status(404).json({ error: 'اتاق پیدا نشد' });
    const chat = db.getChatMessages(room.id);
    res.json({ room, chat });
  });

  app.post('/api/rooms/create', (req, res) => {
    try {
      const { gameType, hostId, isPrivate, maxPlayers } = req.body;
      const room = db.createRoom(gameType, hostId, isPrivate, maxPlayers);
      res.json(room);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/rooms/join-code', (req, res) => {
    try {
      const { code, userId } = req.body;
      const room = db.getRoomByCode(code);
      if (!room) return res.status(404).json({ error: 'اتاقی با این کد یافت نشد' });
      const updatedRoom = db.joinRoom(room.id, userId);
      broadcastRoomUpdate(updatedRoom.id);
      res.json(updatedRoom);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/rooms/quick-match', (req, res) => {
    try {
      const { gameType, userId } = req.body;
      // Search for open public room
      const existing = db
        .getActiveRooms()
        .find((r) => r.gameType === gameType && !r.isPrivate && r.status === 'waiting' && r.players.length < r.maxPlayers);

      if (existing) {
        const joined = db.joinRoom(existing.id, userId);
        broadcastRoomUpdate(joined.id);
        res.json({ room: joined, joined: true });
      } else {
        const newRoom = db.createRoom(gameType, userId, false);
        res.json({ room: newRoom, joined: false });
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/rooms/vs-bot', (req, res) => {
    try {
      const { gameType, userId, numBots } = req.body;
      const user = db.getUser(userId) || db.getOrCreateUser(userId);
      
      const defaultBots = gameType === 'tictactoe' ? 1 : (numBots ? Math.min(Math.max(1, numBots), 3) : 1);
      const maxPlayers = defaultBots + 1;

      const room = db.createRoom(gameType, user.id, true, maxPlayers);

      const botConfigs = [
        { id: 'bot_ai_1', name: '🤖 ربات آلفا (AI)', username: 'bot_alpha' },
        { id: 'bot_ai_2', name: '🤖 ربات بتا (AI)', username: 'bot_beta' },
        { id: 'bot_ai_3', name: '🤖 ربات گاما (AI)', username: 'bot_gamma' },
      ];

      for (let i = 0; i < defaultBots; i++) {
        const b = botConfigs[i % botConfigs.length];
        ensureBotUser(b.id, b.name, b.username);
        room.players.push({
          id: b.id,
          username: b.username,
          displayName: b.name,
          isReady: true,
          isHost: false,
          isConnected: true,
        });
      }

      let updated: any;
      if (room.gameType === 'tictactoe') {
        updated = initTicTacToe(room);
      } else if (room.gameType === 'ludo') {
        updated = initLudo(room);
      } else if (room.gameType === 'snakes') {
        updated = initSnakes(room);
      }

      db.updateRoom(updated);
      broadcastRoomUpdate(updated.id);

      // Trigger bot turn if bot goes first
      processBotTurnIfNeeded(updated.id, broadcastRoomUpdate);

      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/rooms/:id/start', (req, res) => {
    try {
      const room = db.getRoom(req.params.id);
      if (!room) return res.status(404).json({ error: 'اتاق پیدا نشد' });

      let updated: any;
      if (room.gameType === 'tictactoe') {
        updated = initTicTacToe(room);
      } else if (room.gameType === 'ludo') {
        updated = initLudo(room);
      } else if (room.gameType === 'snakes') {
        updated = initSnakes(room);
      }

      broadcastRoomUpdate(room.id);
      processBotTurnIfNeeded(room.id, broadcastRoomUpdate);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/rooms/:id/leave', (req, res) => {
    try {
      const { userId } = req.body;
      const room = db.leaveRoom(req.params.id, userId);
      broadcastRoomUpdate(req.params.id);
      res.json(room);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GAME MOVES API
  app.post('/api/rooms/:id/move', (req, res) => {
    try {
      const { userId, moveType, details } = req.body;
      const room = db.getRoom(req.params.id);
      if (!room) return res.status(404).json({ error: 'اتاق پیدا نشد' });

      let updatedRoom = room;

      if (room.gameType === 'tictactoe') {
        updatedRoom = makeTicTacToeMove(room, userId, details.cellIndex, details.fromIndex);
      } else if (room.gameType === 'ludo') {
        if (moveType === 'roll') {
          const resLudo = rollLudoDice(room, userId);
          updatedRoom = resLudo.room;
        } else if (moveType === 'move') {
          updatedRoom = moveLudoToken(room, userId, details.tokenIndex);
        }
      } else if (room.gameType === 'snakes') {
        if (moveType === 'roll') {
          const resSnakes = rollSnakesDice(room, userId);
          updatedRoom = resSnakes.room;
        }
      }

      broadcastRoomUpdate(room.id);
      processBotTurnIfNeeded(room.id, broadcastRoomUpdate);
      res.json(updatedRoom);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // CHAT & REPORTS
  app.post('/api/chat/send', (req, res) => {
    try {
      const { roomId, senderId, senderName, text } = req.body;
      const msg = db.addChatMessage(roomId, senderId, senderName, text);
      broadcastRoomUpdate(roomId);
      res.json(msg);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/reports', (req, res) => {
    try {
      const { reporterId, reportedUserId, category, description, roomId } = req.body;
      const report = db.createReport(reporterId, reportedUserId, category, description, roomId);
      res.json(report);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // BOT SIMULATOR & TELEGRAM WEBHOOK
  app.post('/api/bot-sim/message', async (req, res) => {
    try {
      const { telegramId, username, displayName, text } = req.body;
      const reply = await botEngine.handleMessage(
        telegramId || 'sim_user',
        username,
        displayName || 'کاربر شبیه‌ساز',
        text || '/start'
      );
      res.json(reply);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/telegram/webhook', async (req, res) => {
    try {
      const update = req.body;
      if (update.message) {
        const msg = update.message;
        const from = msg.from;
        const text = msg.text || '';
        const reply = await botEngine.handleMessage(
          from.id.toString(),
          from.username,
          from.first_name + (from.last_name ? ` ${from.last_name}` : ''),
          text
        );
        await botEngine.sendTelegramApiMessage(from.id.toString(), reply.responseText, reply.inlineKeyboard);
      }
      res.json({ ok: true });
    } catch (err) {
      res.status(200).json({ ok: true });
    }
  });

  // ADMIN PANEL ENDPOINTS
  app.get('/api/admin/config', (req, res) => {
    res.json(db.getAdminConfig());
  });

  app.post('/api/admin/config', (req, res) => {
    try {
      const updated = db.updateAdminConfig(req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/admin/stats', (req, res) => {
    res.json(db.getStats());
  });

  app.get('/api/admin/users', (req, res) => {
    res.json(db.getAllUsers());
  });

  app.post('/api/admin/users/action', (req, res) => {
    try {
      const { userId, action } = req.body;
      const user = db.getUser(userId);
      if (!user) return res.status(404).json({ error: 'کاربر پیدا نشد' });

      if (action === 'ban') {
        user.status = 'banned';
      } else if (action === 'unban') {
        user.status = 'online';
      } else if (action === 'mute') {
        user.status = 'muted';
      }

      db.updateUser(user);
      res.json(user);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/admin/reports', (req, res) => {
    res.json(db.getReports());
  });

  app.post('/api/admin/reports/update', (req, res) => {
    try {
      const { reportId, status } = req.body;
      db.updateReportStatus(reportId, status);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/broadcast', (req, res) => {
    try {
      const { text } = req.body;
      const activeRooms = db.getActiveRooms();
      activeRooms.forEach((r) => {
        db.addChatMessage(r.id, 'system', '📢 اعلان مدیریت', text, true);
        broadcastRoomUpdate(r.id);
      });
      res.json({ success: true, count: activeRooms.length });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/force-end', (req, res) => {
    try {
      const { roomId } = req.body;
      const room = db.getRoom(roomId);
      if (room) {
        room.status = 'cancelled';
        db.updateRoom(room);
        broadcastRoomUpdate(roomId);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // VITE DEVELOPMENT OR STATIC SERVING
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    botEngine.startPolling();
  });
}

startServer();
