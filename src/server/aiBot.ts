import { db } from './store.js';
import { makeTicTacToeMove } from './games/tictactoe.js';
import { rollLudoDice, moveLudoToken } from './games/ludo.js';
import { rollSnakesDice } from './games/snakes.js';
import { GameRoom } from '../types/index.js';

export function ensureBotUser(botId: string, name: string, username: string) {
  return db.getOrCreateUser(botId, username, name);
}

// Seed standard bots
ensureBotUser('bot_ai_1', '🤖 ربات هوشمند (آلفا)', 'bot_alpha');
ensureBotUser('bot_ai_2', '🤖 ربات هوشمند (بتا)', 'bot_beta');
ensureBotUser('bot_ai_3', '🤖 ربات هوشمند (گاما)', 'bot_gamma');

export async function processBotTurnIfNeeded(roomId: string, broadcastFn: (roomId: string) => void) {
  const room = db.getRoom(roomId);
  if (!room || room.status !== 'playing' || !String(room.currentTurnUserId).startsWith('bot_')) {
    return;
  }

  // Delay for natural feel
  setTimeout(async () => {
    try {
      const currentRoom = db.getRoom(roomId);
      if (!currentRoom || currentRoom.status !== 'playing' || !String(currentRoom.currentTurnUserId).startsWith('bot_')) {
        return;
      }

      const botId = currentRoom.currentTurnUserId;

      if (currentRoom.gameType === 'tictactoe' && currentRoom.ticTacToe) {
        handleTicTacToeBotTurn(currentRoom, botId);
      } else if (currentRoom.gameType === 'ludo' && currentRoom.ludo) {
        handleLudoBotTurn(currentRoom, botId, broadcastFn);
      } else if (currentRoom.gameType === 'snakes' && currentRoom.snakes) {
        handleSnakesBotTurn(currentRoom, botId);
      }

      broadcastFn(roomId);

      // Check if next turn is also a bot
      const freshRoom = db.getRoom(roomId);
      if (freshRoom && freshRoom.status === 'playing' && freshRoom.currentTurnUserId.startsWith('bot_')) {
        processBotTurnIfNeeded(roomId, broadcastFn);
      }
    } catch (err) {
      console.error('Error executing bot turn:', err);
    }
  }, 900);
}

// --- TIC TAC TOE BOT ---
function handleTicTacToeBotTurn(room: GameRoom, botId: string) {
  if (!room.ticTacToe) return;
  const board = room.ticTacToe.board;
  const botPlayer = room.players.find((p) => String(p.id) === String(botId));
  const humanPlayer = room.players.find((p) => String(p.id) !== String(botId));
  if (!botPlayer || !botPlayer.color) return;

  const botSymbol = botPlayer.color;
  const humanSymbol = humanPlayer?.color || (botSymbol === 'X' ? 'O' : 'X');

  const botPositions: number[] = [];
  const emptyIndices: number[] = [];

  board.forEach((val, idx) => {
    if (val === botSymbol) botPositions.push(idx);
    else if (val === null) emptyIndices.push(idx);
  });

  if (botPositions.length < 3) {
    // Phase 1: Placement
    let chosenCell = -1;

    // 1. Check if bot can win in 1 move
    chosenCell = findWinningCell(board, botSymbol);

    // 2. Check if human can win and block
    if (chosenCell === -1) {
      chosenCell = findWinningCell(board, humanSymbol);
    }

    // 3. Take center cell if empty
    if (chosenCell === -1 && board[4] === null) {
      chosenCell = 4;
    }

    // 4. Take corners if empty
    if (chosenCell === -1) {
      const corners = [0, 2, 6, 8].filter((c) => board[c] === null);
      if (corners.length > 0) {
        chosenCell = corners[Math.floor(Math.random() * corners.length)];
      }
    }

    // 5. Take any open cell
    if (chosenCell === -1 && emptyIndices.length > 0) {
      chosenCell = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    if (chosenCell !== -1) {
      makeTicTacToeMove(room, botId, chosenCell);
    }
  } else {
    // Phase 2: Movement Phase
    let bestFrom = -1;
    let bestTo = -1;

    // 1. Check if moving any piece creates a winning 3-in-a-row for bot
    for (const fromIdx of botPositions) {
      for (const toIdx of emptyIndices) {
        const testBoard = [...board];
        testBoard[fromIdx] = null;
        testBoard[toIdx] = botSymbol;

        if (checkBoardWin(testBoard)) {
          bestFrom = fromIdx;
          bestTo = toIdx;
          break;
        }
      }
      if (bestFrom !== -1) break;
    }

    // 2. Check if human is about to win and block by moving a piece to that spot
    if (bestFrom === -1) {
      const humanWinCell = findWinningCell(board, humanSymbol);
      if (humanWinCell !== -1) {
        // Try to move a bot piece into humanWinCell
        for (const fromIdx of botPositions) {
          const testBoard = [...board];
          testBoard[fromIdx] = null;
          testBoard[humanWinCell] = botSymbol;
          // Ensure we don't accidentally leave an open win for human by moving this piece
          bestFrom = fromIdx;
          bestTo = humanWinCell;
          break;
        }
      }
    }

    // 3. Pick center or strategic move, or random move
    if (bestFrom === -1) {
      // Pick random bot piece and random empty cell
      const randomFrom = botPositions[Math.floor(Math.random() * botPositions.length)];
      const randomTo = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      bestFrom = randomFrom;
      bestTo = randomTo;
    }

    if (bestFrom !== -1 && bestTo !== -1) {
      makeTicTacToeMove(room, botId, bestTo, bestFrom);
    }
  }
}

function checkBoardWin(board: (string | null)[]): boolean {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (const line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return true;
    }
  }
  return false;
}

function findWinningCell(board: (string | null)[], symbol: string): number {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (const line of lines) {
    const [a, b, c] = line;
    const vals = [board[a], board[b], board[c]];
    const countSymbol = vals.filter((v) => v === symbol).length;
    const countNull = vals.filter((v) => v === null).length;

    if (countSymbol === 2 && countNull === 1) {
      if (board[a] === null) return a;
      if (board[b] === null) return b;
      if (board[c] === null) return c;
    }
  }
  return -1;
}

// --- LUDO BOT ---
function handleLudoBotTurn(room: GameRoom, botId: string, broadcastFn: (roomId: string) => void) {
  if (!room.ludo) return;

  if (room.ludo.canRollDice) {
    // Roll dice for bot
    const { dice } = rollLudoDice(room, botId);
    broadcastFn(room.id);

    // After rolling, check if bot can move tokens
    const tokens = room.ludo.tokens[botId] || [0, 0, 0, 0];
    const moveableTokenIndices: number[] = [];

    tokens.forEach((pos, idx) => {
      if (pos === 0 && dice === 6) moveableTokenIndices.push(idx);
      else if (pos > 0 && pos < 59 && pos + dice <= 59) moveableTokenIndices.push(idx);
    });

    if (moveableTokenIndices.length > 0) {
      // Pick best token to move
      const bestIdx = pickBestLudoToken(room, botId, dice, moveableTokenIndices);
      setTimeout(() => {
        try {
          const r = db.getRoom(room.id);
          if (r && r.status === 'playing' && String(r.currentTurnUserId) === String(botId) && !r.ludo?.canRollDice) {
            moveLudoToken(r, botId, bestIdx);
            broadcastFn(room.id);

            // If turn is still bot (e.g. rolled 6), repeat
            const fresh = db.getRoom(room.id);
            if (fresh && fresh.status === 'playing' && String(fresh.currentTurnUserId).startsWith('bot_')) {
              processBotTurnIfNeeded(room.id, broadcastFn);
            }
          }
        } catch (e) {
          console.error('Ludo bot move token error:', e);
        }
      }, 1000);
    } else {
      // Cannot move any token. If rolled 6 or pass turn, wait before next bot action
      setTimeout(() => {
        const fresh = db.getRoom(room.id);
        if (fresh && fresh.status === 'playing' && String(fresh.currentTurnUserId).startsWith('bot_')) {
          processBotTurnIfNeeded(room.id, broadcastFn);
        }
      }, 1000);
    }
  } else {
    // Dice already rolled, pick token to move
    const dice = room.ludo.lastDiceRoll || 1;
    const tokens = room.ludo.tokens[botId] || [0, 0, 0, 0];
    const moveableTokenIndices: number[] = [];

    tokens.forEach((pos, idx) => {
      if (pos === 0 && dice === 6) moveableTokenIndices.push(idx);
      else if (pos > 0 && pos < 59 && pos + dice <= 59) moveableTokenIndices.push(idx);
    });

    if (moveableTokenIndices.length > 0) {
      const bestIdx = pickBestLudoToken(room, botId, dice, moveableTokenIndices);
      moveLudoToken(room, botId, bestIdx);
      broadcastFn(room.id);
      const fresh = db.getRoom(room.id);
      if (fresh && fresh.status === 'playing' && String(fresh.currentTurnUserId).startsWith('bot_')) {
        processBotTurnIfNeeded(room.id, broadcastFn);
      }
    }
  }
}

function pickBestLudoToken(room: GameRoom, botId: string, dice: number, validIndices: number[]): number {
  if (!room.ludo) return validIndices[0];
  const botTokens = room.ludo.tokens[botId];

  let bestIndex = validIndices[0];
  let maxScore = -999;

  validIndices.forEach((tIdx) => {
    const curPos = botTokens[tIdx];
    let nextPos = curPos === 0 ? 1 : curPos + dice;
    let score = 0;

    // 1. Spawning out of yard on 6
    if (curPos === 0 && dice === 6) {
      score += 50;
    }

    // 2. Reaching exact home 59
    if (nextPos === 59) {
      score += 100;
    }

    // 3. Capturing opponent
    if (nextPos >= 1 && nextPos <= 52) {
      Object.entries(room.ludo!.tokens).forEach(([otherId, otherTokens]) => {
        if (String(otherId) !== String(botId)) {
          otherTokens.forEach((oPos) => {
            if (oPos === nextPos) {
              score += 150; // High priority for capture
            }
          });
        }
      });
    }

    // 4. Moving farthest token forward
    score += curPos * 2;

    if (score > maxScore) {
      maxScore = score;
      bestIndex = tIdx;
    }
  });

  return bestIndex;
}

// --- SNAKES BOT ---
function handleSnakesBotTurn(room: GameRoom, botId: string) {
  rollSnakesDice(room, botId);
}
