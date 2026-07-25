import { GameRoom } from '../../types/index.js';
import { db } from '../store.js';
import { getGlobalCircuitPos } from '../../utils/ludoUtils.js';

const ALL_COLORS: ('red' | 'green' | 'yellow' | 'blue')[] = ['red', 'green', 'yellow', 'blue'];

// Safe global positions on 52-cell main path
const SAFE_CELLS = [1, 9, 14, 22, 27, 35, 40, 48];

export { getGlobalCircuitPos };

export function initLudo(room: GameRoom) {
  if (room.players.length < 2) throw new Error('برای بازی منچ حداقل به ۲ بازیکن نیاز است');

  const playerColors: Record<string, 'red' | 'green' | 'yellow' | 'blue'> = {};
  const tokens: Record<string, number[]> = {};

  room.players.forEach((p, idx) => {
    const color = ALL_COLORS[idx % ALL_COLORS.length];
    p.color = color;
    playerColors[p.id] = color;
    tokens[p.id] = [0, 0, 0, 0]; // 4 tokens in base
  });

  room.ludo = {
    playerColors,
    tokens,
    canRollDice: true,
    hasMovedThisTurn: false,
  };

  room.status = 'playing';
  room.currentTurnUserId = room.players[0].id;
  room.turnDeadline = Date.now() + room.turnTimeout * 1000;

  db.updateRoom(room);
  db.addChatMessage(room.id, 'system', 'سیستم', '🎲 بازی جذاب منچ شروع شد! تاس بریزید.', true);
  return room;
}

export function rollLudoDice(room: GameRoom, userId: string): { room: GameRoom; dice: number } {
  if (room.status !== 'playing' || !room.ludo) throw new Error('بازی در حال اجرا نیست');
  if (String(room.currentTurnUserId) !== String(userId)) throw new Error('نوبت شما نیست!');
  if (!room.ludo.canRollDice) throw new Error('تاس قبلاً انداخته شده است، مهره‌تان را حرکت دهید');

  const dice = Math.floor(Math.random() * 6) + 1; // 1 to 6
  room.ludo.lastDiceRoll = dice;
  room.ludo.lastRollTime = Date.now();
  room.ludo.canRollDice = false;

  const playerTokens = room.ludo.tokens[userId] || [0, 0, 0, 0];
  const canMoveAny = playerTokens.some((pos) => {
    if (pos === 0) return dice === 6; // Needs 6 to exit base
    if (pos === 59) return false; // Already finished
    return pos + dice <= 59;
  });

  const pName = room.players.find((p) => String(p.id) === String(userId))?.displayName || 'بازیکن';
  db.addChatMessage(
    room.id,
    'system',
    'سیستم',
    `🎲 ${pName} تاس انداخت: عدد ${dice}`,
    true
  );

  if (!canMoveAny) {
    // Cannot move, pass turn unless rolled 6
    if (dice !== 6) {
      db.addChatMessage(room.id, 'system', 'سیستم', 'مهره قابل حرکتی وجود ندارد. نوبت به نفر بعد رسید.', true);
      passLudoTurn(room);
    } else {
      room.ludo.canRollDice = true; // Extra roll for 6
    }
  }

  db.updateRoom(room);
  return { room, dice };
}

export function moveLudoToken(room: GameRoom, userId: string, tokenIndex: number): GameRoom {
  if (room.status !== 'playing' || !room.ludo) throw new Error('بازی در حال اجرا نیست');
  if (String(room.currentTurnUserId) !== String(userId)) throw new Error('نوبت شما نیست!');
  if (room.ludo.canRollDice || !room.ludo.lastDiceRoll) throw new Error('ابتدا تاس بریزید');

  const dice = room.ludo.lastDiceRoll;
  const tokens = room.ludo.tokens[userId];
  if (!tokens || tokenIndex < 0 || tokenIndex > 3) throw new Error('مهره نامعتبر است');

  const currentPos = tokens[tokenIndex];

  if (currentPos === 0 && dice !== 6) {
    throw new Error('برای خروج مهره از خانه باید عدد ۶ بیاورید');
  }

  if (currentPos === 59) {
    throw new Error('این مهره به مقصد رسیده است');
  }

  let nextPos = currentPos;
  if (currentPos === 0 && dice === 6) {
    nextPos = 1; // Start path
  } else {
    nextPos = currentPos + dice;
  }

  if (nextPos > 59) {
    throw new Error('مقدار تاس بیشتر از تعداد خانه‌های باقی‌مانده است');
  }

  tokens[tokenIndex] = nextPos;

  // Check capture if in main path (1-52) and not in safe zone
  const myColor = room.ludo.playerColors[userId];
  const nextGlobalPos = getGlobalCircuitPos(myColor, nextPos);

  if (nextPos >= 1 && nextPos <= 52 && nextGlobalPos !== null && !SAFE_CELLS.includes(nextGlobalPos)) {
    Object.entries(room.ludo.tokens).forEach(([otherUserId, otherTokens]) => {
      if (String(otherUserId) !== String(userId)) {
        const otherColor = room.ludo.playerColors[otherUserId];
        if (!otherColor) return;
        otherTokens.forEach((otherPos, otherIdx) => {
          if (otherPos >= 1 && otherPos <= 52) {
            const otherGlobalPos = getGlobalCircuitPos(otherColor, otherPos);
            if (otherGlobalPos === nextGlobalPos) {
              // Capture opponent's token!
              otherTokens[otherIdx] = 0; // Send back to base
              const opponentName = room.players.find((p) => String(p.id) === String(otherUserId))?.displayName || 'حریف';
              db.addChatMessage(
                room.id,
                'system',
                'سیستم',
                `💥 مهره ${opponentName} توسط مهره شما زده شد و به خانه بازگشت!`,
                true
              );
            }
          }
        });
      }
    });
  }

  // Check Win condition: All 4 tokens at 59
  const isWinner = tokens.every((p) => p === 59);
  if (isWinner) {
    room.status = 'finished';
    room.winnerId = userId;
    db.incrementGamesCount();
    const winner = room.players.find((p) => String(p.id) === String(userId));
    db.addChatMessage(
      room.id,
      'system',
      'سیستم',
      `🏆 تبریک! ${winner?.displayName} تمام مهره‌ها را به مقصد رساند و برنده منچ شد!`,
      true
    );
  } else {
    // If rolled 6, user gets another roll; otherwise pass turn
    if (dice === 6) {
      room.ludo.canRollDice = true;
      db.addChatMessage(room.id, 'system', 'سیستم', 'چون ۶ آوردید یک نوبت دیگر تاس بریزید!', true);
    } else {
      passLudoTurn(room);
    }
  }

  db.updateRoom(room);
  return room;
}

function passLudoTurn(room: GameRoom) {
  if (!room.ludo) return;
  const currentIdx = room.players.findIndex((p) => String(p.id) === String(room.currentTurnUserId));
  const nextIdx = (currentIdx + 1) % room.players.length;
  room.currentTurnUserId = room.players[nextIdx].id;
  room.ludo.canRollDice = true;
  room.turnDeadline = Date.now() + room.turnTimeout * 1000;
}

