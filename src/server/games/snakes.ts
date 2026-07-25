import { GameRoom } from '../../types/index.js';
import { db } from '../store.js';

const SNAKES_MAP: Record<number, number> = {
  99: 54,
  95: 75,
  87: 24,
  62: 18,
  49: 11,
  16: 6,
};

const LADDERS_MAP: Record<number, number> = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91,
};

export function initSnakes(room: GameRoom) {
  if (room.players.length < 2) throw new Error('برای شروع مار و پله حداقل ۲ بازیکن لازم است');

  const positions: Record<string, number> = {};
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']; // red, blue, green, yellow

  room.players.forEach((p, idx) => {
    positions[p.id] = 1; // start at square 1
    p.color = colors[idx % colors.length];
  });

  room.snakes = {
    positions,
    boardSnakes: SNAKES_MAP,
    boardLadders: LADDERS_MAP,
  };

  room.status = 'playing';
  room.currentTurnUserId = room.players[0].id;
  room.turnDeadline = Date.now() + room.turnTimeout * 1000;

  db.updateRoom(room);
  db.addChatMessage(room.id, 'system', 'سیستم', '🐍 🪜 بازی هیجان‌انگیز مار و پله شروع شد! به خانه ۱۰۰ برسید.', true);
  return room;
}

export function rollSnakesDice(room: GameRoom, userId: string): { room: GameRoom; dice: number; eventText?: string } {
  if (room.status !== 'playing' || !room.snakes) throw new Error('بازی در حال اجرا نیست');
  if (room.currentTurnUserId !== userId) throw new Error('نوبت شما نیست!');

  const dice = Math.floor(Math.random() * 6) + 1; // 1 to 6
  room.snakes.lastDiceRoll = dice;
  room.snakes.lastRollTime = Date.now();

  const currentPos = room.snakes.positions[userId] || 1;
  let newPos = currentPos + dice;
  let eventText = '';

  const player = room.players.find((p) => p.id === userId);
  const name = player?.displayName || 'بازیکن';

  if (newPos > 100) {
    // Need exact number to reach 100
    newPos = currentPos;
    eventText = `${name} عدد ${dice} آورد ولی برای برنده شدن نیاز به عدد دقیق دارد.`;
  } else {
    // Check ladder
    if (LADDERS_MAP[newPos]) {
      const ladderEnd = LADDERS_MAP[newPos];
      eventText = `🪜 ${name} از خانه ${newPos} با نردبان به خانه ${ladderEnd} صعود کرد!`;
      newPos = ladderEnd;
    }
    // Check snake
    else if (SNAKES_MAP[newPos]) {
      const snakeEnd = SNAKES_MAP[newPos];
      eventText = `🐍 نیش مار در خانه ${newPos}! ${name} به خانه ${snakeEnd} سقوط کرد.`;
      newPos = snakeEnd;
    } else {
      eventText = `🎲 ${name} عدد ${dice} آورد و به خانه ${newPos} رفت.`;
    }
  }

  room.snakes.positions[userId] = newPos;

  // Log chat
  db.addChatMessage(room.id, 'system', 'سیستم', eventText, true);

  // Check Win
  if (newPos === 100) {
    room.status = 'finished';
    room.winnerId = userId;
    db.incrementGamesCount();

    // Update stats
    room.players.forEach((p) => {
      const u = db.getUser(p.id);
      if (!u) return;
      u.gamesPlayed += 1;
      if (p.id === userId) {
        u.wins += 1;
        u.coins += 150;
      } else {
        u.losses += 1;
      }
      u.winRate = Math.round((u.wins / u.gamesPlayed) * 100);
      db.updateUser(u);
    });

    db.addChatMessage(room.id, 'system', 'سیستم', `🏆 تبریک! ${name} به خانه ۱۰۰ رسید و برنده شد!`, true);
  } else {
    // If rolled 6, roll again, else pass turn
    if (dice === 6) {
      db.addChatMessage(room.id, 'system', 'سیستم', `چون ${name} ۶ آورد دوباره تاس می‌ریزد!`, true);
      room.turnDeadline = Date.now() + room.turnTimeout * 1000;
    } else {
      const currentIdx = room.players.findIndex((p) => p.id === userId);
      const nextIdx = (currentIdx + 1) % room.players.length;
      room.currentTurnUserId = room.players[nextIdx].id;
      room.turnDeadline = Date.now() + room.turnTimeout * 1000;
    }
  }

  db.updateRoom(room);
  return { room, dice, eventText };
}
