import { GameRoom, PlayerInRoom } from '../../types/index.js';
import { db } from '../store.js';

export function initTicTacToe(room: GameRoom) {
  if (room.players.length < 2) throw new Error('برای شروع دوز حداقل ۲ بازیکن نیاز است');

  // Assign X and O
  room.players[0].color = 'X';
  room.players[1].color = 'O';

  room.ticTacToe = {
    board: Array(9).fill(null),
  };

  room.status = 'playing';
  room.currentTurnUserId = room.players[0].id;
  room.turnDeadline = Date.now() + room.turnTimeout * 1000;

  db.updateRoom(room);
  db.addChatMessage(room.id, 'system', 'سیستم', 'بازی دوز آغاز شد! نوبت بازیکن اول است.', true);
  return room;
}

export function makeTicTacToeMove(
  room: GameRoom,
  userId: string,
  cellIndex: number,
  fromIndex?: number
): GameRoom {
  if (room.status !== 'playing' || !room.ticTacToe) {
    throw new Error('بازی در حال اجرا نیست');
  }

  if (String(room.currentTurnUserId) !== String(userId)) {
    throw new Error('نوبت شما نیست!');
  }

  const player = room.players.find((p) => String(p.id) === String(userId));
  if (!player || !player.color) throw new Error('بازیکن یافت نشد');

  const board = room.ticTacToe.board;
  const playerColor = player.color; // 'X' or 'O'
  const playerPieceCount = board.filter((c) => c === playerColor).length;

  if (playerPieceCount < 3) {
    // Phase 1: Placement Phase
    if (cellIndex < 0 || cellIndex > 8 || board[cellIndex] !== null) {
      throw new Error('این خانه قبلاً انتخاب شده یا معتبر نیست');
    }

    board[cellIndex] = playerColor;
    room.moveHistory.push({
      userId,
      details: { type: 'place', cellIndex, symbol: playerColor },
      timestamp: new Date().toISOString(),
    });

    const totalPlaced = board.filter((c) => c !== null).length;
    if (totalPlaced === 6) {
      db.addChatMessage(
        room.id,
        'system',
        'سیستم',
        '🎯 هر دو بازیکن ۳ مهره خود را گذاشتند! اکنون نوبت جابجایی مهره‌هاست.',
        true
      );
    }
  } else {
    // Phase 2: Movement Phase
    if (fromIndex === undefined || fromIndex === null || fromIndex < 0 || fromIndex > 8) {
      throw new Error('لطفاً ابتدا مهره‌ای را که می‌خواهید جابجا کنید انتخاب کنید');
    }

    if (board[fromIndex] !== playerColor) {
      throw new Error('شما فقط می‌توانید مهره‌های خود را جابجا کنید');
    }

    if (cellIndex < 0 || cellIndex > 8 || board[cellIndex] !== null) {
      throw new Error('مقصد جابجایی باید یک خانه خالی باشد');
    }

    if (fromIndex === cellIndex) {
      throw new Error('مبدا و مقصد جابجایی نمی‌تواند یکسان باشد');
    }

    // Move piece
    board[fromIndex] = null;
    board[cellIndex] = playerColor;

    room.moveHistory.push({
      userId,
      details: { type: 'move', fromIndex, cellIndex, symbol: playerColor },
      timestamp: new Date().toISOString(),
    });
  }

  // Check win
  const winningLine = checkWin(board);
  if (winningLine) {
    room.ticTacToe.winningLine = winningLine;
    room.status = 'finished';
    room.winnerId = userId;
    
    // Update player stats
    updateGameStats(room, userId);
    db.addChatMessage(
      room.id,
      'system',
      'سیستم',
      `🎉 بازیکن ${player.displayName} برنده‌‌ی بازی دوز شد!`,
      true
    );
  } else {
    // Switch turn
    const opponent = room.players.find((p) => String(p.id) !== String(userId));
    if (opponent) {
      room.currentTurnUserId = opponent.id;
      room.turnDeadline = Date.now() + room.turnTimeout * 1000;
    }
  }

  db.updateRoom(room);
  return room;
}

function checkWin(board: (string | null)[]): number[] | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  for (const line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line;
    }
  }
  return null;
}

function checkDraw(board: (string | null)[]): boolean {
  return board.every((cell) => cell !== null);
}

function updateGameStats(room: GameRoom, winnerId: string) {
  db.incrementGamesCount();
  room.players.forEach((p) => {
    const user = db.getUser(p.id);
    if (!user) return;
    user.gamesPlayed += 1;
    if (winnerId === 'draw') {
      user.draws += 1;
    } else if (p.id === winnerId) {
      user.wins += 1;
      user.coins += 100; // Reward coins
    } else {
      user.losses += 1;
    }
    user.winRate = Math.round((user.wins / user.gamesPlayed) * 100);
    db.updateUser(user);
  });
}
