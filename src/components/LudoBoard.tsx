import React, { useState, useEffect, useRef } from 'react';
import { GameRoom, UserProfile } from '../types/index';
import { Dices, Sparkles, Trophy, Shield, Star, User } from 'lucide-react';
import { Dice3D } from './Dice3D';
import { playDiceSound, playMoveSound, playCaptureSound, playHomeSound } from '../utils/audio';
import { getGlobalCircuitPos } from '../utils/ludoUtils';

interface LudoBoardProps {
  room: GameRoom;
  currentUser: UserProfile;
  onRollDice: () => void;
  onMoveToken: (tokenIndex: number) => void;
}

type ColorType = 'red' | 'green' | 'yellow' | 'blue';

// Grid coordinates for 52 main circuit cells (1..52) on 15x15 board
const CIRCUIT_GRID: Record<number, [number, number]> = {
  1: [6, 1],   2: [6, 2],   3: [6, 3],   4: [6, 4],   5: [6, 5],
  6: [5, 6],   7: [4, 6],   8: [3, 6],   9: [2, 6],   10: [1, 6],  11: [0, 6],
  12: [0, 7],  13: [0, 8],
  14: [1, 8],  15: [2, 8],  16: [3, 8],  17: [4, 8],  18: [5, 8],
  19: [6, 9],  20: [6, 10], 21: [6, 11], 22: [6, 12], 23: [6, 13], 24: [6, 14],
  25: [7, 14], 26: [8, 14],
  27: [8, 13], 28: [8, 12], 29: [8, 11], 30: [8, 10], 31: [8, 9],
  32: [9, 8],  33: [10, 8], 34: [11, 8], 35: [12, 8], 36: [13, 8], 37: [14, 8],
  38: [14, 7], 39: [14, 6],
  40: [13, 6], 41: [12, 6], 42: [11, 6], 43: [10, 6], 44: [9, 6],
  45: [8, 5],  46: [8, 4],  47: [8, 3],  48: [8, 2],  49: [8, 1],  50: [8, 0],
  51: [7, 0],  52: [6, 0],
};

// Safe main circuit cell numbers
const SAFE_CELLS = [1, 9, 14, 22, 27, 35, 40, 48];

// Home run paths (53..58 local -> 1..5 steps)
const HOME_RUN_GRID: Record<ColorType, Record<number, [number, number]>> = {
  red:    { 1: [7, 1], 2: [7, 2], 3: [7, 3], 4: [7, 4], 5: [7, 5] },
  green:  { 1: [1, 7], 2: [2, 7], 3: [3, 7], 4: [4, 7], 5: [5, 7] },
  yellow: { 1: [7, 13], 2: [7, 12], 3: [7, 11], 4: [7, 10], 5: [7, 9] },
  blue:   { 1: [13, 7], 2: [12, 7], 3: [11, 7], 4: [10, 7], 5: [9, 7] },
};

// Corner yard configurations
const YARD_CONFIGS: Record<ColorType, { name: string; bg: string; border: string; text: string; lightBg: string; startGlobal: number }> = {
  red: {
    name: 'قرمز',
    bg: 'bg-rose-600',
    border: 'border-rose-500',
    text: 'text-rose-400',
    lightBg: 'bg-rose-500/20',
    startGlobal: 1,
  },
  green: {
    name: 'سبز',
    bg: 'bg-emerald-600',
    border: 'border-emerald-500',
    text: 'text-emerald-400',
    lightBg: 'bg-emerald-500/20',
    startGlobal: 14,
  },
  yellow: {
    name: 'زرد',
    bg: 'bg-amber-500',
    border: 'border-amber-400',
    text: 'text-amber-400',
    lightBg: 'bg-amber-500/20',
    startGlobal: 27,
  },
  blue: {
    name: 'آبی',
    bg: 'bg-sky-600',
    border: 'border-sky-500',
    text: 'text-sky-400',
    lightBg: 'bg-sky-500/20',
    startGlobal: 40,
  },
};

export const LudoBoard: React.FC<LudoBoardProps> = ({
  room,
  currentUser,
  onRollDice,
  onMoveToken,
}) => {
  const ludo = room.ludo;
  const isMyTurn = String(room.currentTurnUserId) === String(currentUser.id);
  const lastDice = ludo?.lastDiceRoll;
  const lastRollTime = ludo?.lastRollTime;
  const canRoll = ludo?.canRollDice;

  const [isRolling, setIsRolling] = useState(false);
  const [showRollEffect, setShowRollEffect] = useState(false);
  const [prevRollTime, setPrevRollTime] = useState<number | undefined>(lastRollTime);

  const isFinished = room.status === 'finished';
  const playerColors = ludo?.playerColors || {};

  // Find user's color & tokens
  const myColor = playerColors[currentUser.id] || 'red';
  const myTokens = ludo?.tokens[currentUser.id] || [0, 0, 0, 0];

  // Active colors actually assigned to players
  const activePlayers = room.players;
  const activeColorsSet = new Set<ColorType>(
    activePlayers.map((p) => playerColors[p.id]).filter(Boolean) as ColorType[]
  );

  // Trigger roll animation & toast effect
  useEffect(() => {
    if (lastRollTime !== undefined && lastRollTime !== prevRollTime) {
      setPrevRollTime(lastRollTime);
      setShowRollEffect(true);
      setIsRolling(true);
      playDiceSound();

      const timer = setTimeout(() => {
        setIsRolling(false);
      }, 700);

      const toastTimer = setTimeout(() => {
        setShowRollEffect(false);
      }, 3500);

      return () => {
        clearTimeout(timer);
        clearTimeout(toastTimer);
        setIsRolling(false);
      };
    }
  }, [lastRollTime, prevRollTime]);

  // Track token moves to play sound effects
  const prevTokensRef = useRef<Record<string, number[]>>({});
  useEffect(() => {
    if (!ludo?.tokens) return;

    let hasMoved = false;
    let reachedHome = false;
    let captured = false;

    Object.entries(ludo.tokens).forEach(([userId, tokens]) => {
      const prev = prevTokensRef.current[userId];
      if (prev && Array.isArray(tokens)) {
        (tokens as number[]).forEach((pos, idx) => {
          const oldPos = prev[idx];
          if (oldPos !== undefined && pos !== oldPos) {
            hasMoved = true;
            if (pos === 58 || pos === 59) {
              reachedHome = true;
            } else if (oldPos > 0 && pos === 0) {
              // Token was sent back to yard (captured)
              captured = true;
            }
          }
        });
      }
    });

    if (hasMoved) {
      if (captured) {
        playCaptureSound();
      } else if (reachedHome) {
        playHomeSound();
      } else {
        playMoveSound();
      }
    }

    prevTokensRef.current = JSON.parse(JSON.stringify(ludo.tokens));
  }, [ludo?.tokens]);

  const handleRollClick = () => {
    if (!isMyTurn || !canRoll || isFinished || isRolling) return;
    setIsRolling(true);
    playDiceSound();
    onRollDice();

    const timer = setTimeout(() => {
      setIsRolling(false);
    }, 700);
    return () => clearTimeout(timer);
  };

  // Build token position mapping for grid
  // Grid cell key "r-c" -> list of tokens { userId, color, tokenIdx, localPos, isMoveable }
  const tokenMap: Record<string, Array<{ userId: string; color: ColorType; tokenIdx: number; localPos: number; isMoveable: boolean }>> = {};

  activePlayers.forEach((p) => {
    const color = playerColors[p.id];
    const tokens = ludo?.tokens[p.id] || [0, 0, 0, 0];
    if (!color) return;

    tokens.forEach((pos, tIdx) => {
      let r = -1;
      let c = -1;

      if (pos === 0) {
        // Token in yard
        // Map 4 yard spots inside corners
        if (color === 'red') {
          const spots = [[1, 1], [1, 4], [4, 1], [4, 4]];
          [r, c] = spots[tIdx];
        } else if (color === 'green') {
          const spots = [[1, 10], [1, 13], [4, 10], [4, 13]];
          [r, c] = spots[tIdx];
        } else if (color === 'yellow') {
          const spots = [[10, 10], [10, 13], [13, 10], [13, 13]];
          [r, c] = spots[tIdx];
        } else if (color === 'blue') {
          const spots = [[10, 1], [10, 4], [13, 1], [13, 4]];
          [r, c] = spots[tIdx];
        }
      } else if (pos >= 1 && pos <= 52) {
        // Main circuit
        const gPos = getGlobalCircuitPos(color, pos);
        if (gPos && CIRCUIT_GRID[gPos]) {
          [r, c] = CIRCUIT_GRID[gPos];
        }
      } else if (pos >= 53 && pos <= 58) {
        // Home run
        const step = pos - 52;
        if (HOME_RUN_GRID[color]?.[step]) {
          [r, c] = HOME_RUN_GRID[color][step];
        }
      } else if (pos === 59) {
        // Center Goal
        r = 7;
        c = 7;
      }

      if (r !== -1 && c !== -1) {
        const key = `${r}-${c}`;
        if (!tokenMap[key]) tokenMap[key] = [];

        // Check if token can be moved by current player
        const isUserTurn = isMyTurn && !canRoll && lastDice !== undefined;
        let isMoveable = false;
        if (isUserTurn && String(p.id) === String(currentUser.id)) {
          if (pos === 0 && lastDice === 6) isMoveable = true;
          else if (pos > 0 && pos < 59 && pos + lastDice <= 59) isMoveable = true;
        }

        tokenMap[key].push({
          userId: p.id,
          color,
          tokenIdx: tIdx,
          localPos: pos,
          isMoveable,
        });
      }
    });
  });

  // Render a single grid cell at row r, col c
  const renderCell = (r: number, c: number) => {
    // 1. Corner Yards (6x6 each)
    if (r < 6 && c < 6) return renderYardCell('red', r, c);
    if (r < 6 && c > 8) return renderYardCell('green', r, c - 9);
    if (r > 8 && c > 8) return renderYardCell('yellow', r - 9, c - 9);
    if (r > 8 && c < 6) return renderYardCell('blue', r - 9, c);

    // 2. Center Goal (3x3 area: rows 6..8, cols 6..8)
    if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
      if (r === 7 && c === 7) {
        // Absolute Center Home Goal
        const centerTokens = tokenMap['7-7'] || [];
        return (
          <div
            key={`${r}-${c}`}
            className="w-full h-full bg-slate-900 border border-amber-400/80 flex flex-col items-center justify-center relative overflow-hidden p-0.5 shadow-inner"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            {centerTokens.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center gap-0.5 flex-wrap p-0.5 bg-amber-500/30">
                {centerTokens.map((t, idx) => (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full border border-white shadow-md flex items-center justify-center ${YARD_CONFIGS[t.color].bg}`}
                  >
                    <span className="text-[8px] font-black text-white">{t.tokenIdx + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      // Colored Triangles in Center Area
      let bgStyle = 'bg-slate-900';
      if (r === 7 && c === 6) bgStyle = 'bg-rose-500/40 border-r-2 border-rose-500';
      if (r === 6 && c === 7) bgStyle = 'bg-emerald-500/40 border-b-2 border-emerald-500';
      if (r === 7 && c === 8) bgStyle = 'bg-amber-500/40 border-l-2 border-amber-500';
      if (r === 8 && c === 7) bgStyle = 'bg-sky-500/40 border-t-2 border-sky-500';

      return (
        <div key={`${r}-${c}`} className={`w-full h-full border border-slate-800 ${bgStyle}`} />
      );
    }

    // 3. Track Cells & Home Runs
    let isSafe = false;
    let isStart = false;
    let trackBg = 'bg-slate-800/90 hover:bg-slate-700/80';
    let trackBorder = 'border-slate-700/60';

    // Check Home Run paths
    if (r === 7 && c >= 1 && c <= 5) {
      trackBg = 'bg-rose-500/30';
      trackBorder = 'border-rose-500/50';
    } else if (c === 7 && r >= 1 && r <= 5) {
      trackBg = 'bg-emerald-500/30';
      trackBorder = 'border-emerald-500/50';
    } else if (r === 7 && c >= 9 && c <= 13) {
      trackBg = 'bg-amber-500/30';
      trackBorder = 'border-amber-500/50';
    } else if (c === 7 && r >= 9 && r <= 13) {
      trackBg = 'bg-sky-500/30';
      trackBorder = 'border-sky-500/50';
    }

    // Check Start Cells
    if (r === 6 && c === 1) { isStart = true; trackBg = 'bg-rose-600/50'; trackBorder = 'border-rose-400'; }
    if (r === 1 && c === 8) { isStart = true; trackBg = 'bg-emerald-600/50'; trackBorder = 'border-emerald-400'; }
    if (r === 8 && c === 13) { isStart = true; trackBg = 'bg-amber-600/50'; trackBorder = 'border-amber-400'; }
    if (r === 13 && c === 6) { isStart = true; trackBg = 'bg-sky-600/50'; trackBorder = 'border-sky-400'; }

    // Check Safe Star Cells
    if (
      (r === 2 && c === 6) ||
      (r === 6 && c === 12) ||
      (r === 12 && c === 8) ||
      (r === 8 && c === 2)
    ) {
      isSafe = true;
    }

    const tokensOnCell = tokenMap[`${r}-${c}`] || [];

    return (
      <div
        key={`${r}-${c}`}
        className={`w-full h-full border ${trackBorder} ${trackBg} flex items-center justify-center relative select-none transition-colors`}
      >
        {isSafe && tokensOnCell.length === 0 && (
          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400/60" />
        )}
        {isStart && tokensOnCell.length === 0 && !isSafe && (
          <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-ping" />
        )}

        {/* Tokens on Cell */}
        {tokensOnCell.length > 0 && (
          <div className="flex items-center justify-center gap-0.5 flex-wrap p-0.5 z-10 w-full h-full">
            {tokensOnCell.map((t) => (
              <button
                key={`${t.color}-${t.tokenIdx}`}
                disabled={!t.isMoveable}
                onClick={() => t.isMoveable && onMoveToken(t.tokenIdx)}
                className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-transform ${
                  YARD_CONFIGS[t.color].bg
                } ${
                  t.isMoveable
                    ? 'ring-4 ring-amber-400 animate-bounce cursor-pointer scale-125 z-30'
                    : 'cursor-default'
                }`}
              >
                <span className="text-[9px] font-black text-white leading-none">{t.tokenIdx + 1}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render 6x6 Yard Corner for a color
  const renderYardCell = (color: ColorType, yr: number, yc: number) => {
    const isActive = activeColorsSet.has(color);
    const cfg = YARD_CONFIGS[color];

    // Inside 4 Token circles at (1,1), (1,4), (4,1), (4,4)
    const isTokenSpot =
      (yr === 1 && yc === 1) ||
      (yr === 1 && yc === 4) ||
      (yr === 4 && yc === 1) ||
      (yr === 4 && yc === 4);

    let spotIdx = 0;
    if (yr === 1 && yc === 1) spotIdx = 0;
    if (yr === 1 && yc === 4) spotIdx = 1;
    if (yr === 4 && yc === 1) spotIdx = 2;
    if (yr === 4 && yc === 4) spotIdx = 3;

    // Calculate actual grid row & col for token lookup
    let absR = yr;
    let absC = yc;
    if (color === 'green') { absR = yr; absC = yc + 9; }
    if (color === 'yellow') { absR = yr + 9; absC = yc + 9; }
    if (color === 'blue') { absR = yr + 9; absC = yc; }

    const spotTokens = tokenMap[`${absR}-${absC}`] || [];

    // Outer Yard frame styling
    let cellBg = isActive ? cfg.lightBg : 'bg-slate-900/40 opacity-40';
    let borderStyle = isActive ? `border-${color}-500/40` : 'border-slate-800';

    return (
      <div
        key={`${absR}-${absC}`}
        className={`w-full h-full border ${borderStyle} ${cellBg} flex items-center justify-center relative`}
      >
        {isTokenSpot && isActive && (
          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-slate-950/90 border border-slate-700 flex items-center justify-center shadow-inner">
            {spotTokens.length > 0 ? (
              spotTokens.map((t) => (
                <button
                  key={`${t.color}-${t.tokenIdx}`}
                  disabled={!t.isMoveable}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (t.isMoveable) onMoveToken(t.tokenIdx);
                  }}
                  className={`w-4.5 h-4.5 md:w-5 md:h-5 rounded-full border border-white shadow-md flex items-center justify-center transition-transform ${
                    cfg.bg
                  } ${
                    t.isMoveable
                      ? 'ring-4 ring-amber-400 animate-bounce cursor-pointer scale-150 z-30'
                      : 'cursor-default'
                  }`}
                >
                  <span className="text-[8px] md:text-[9px] font-black text-white leading-none">{t.tokenIdx + 1}</span>
                </button>
              ))
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600/60" />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 md:p-4 relative max-w-xl mx-auto select-none">
      {/* Toast Notification for Roll Results */}
      {showRollEffect && lastDice !== undefined && (
        <div className="fixed top-20 z-50 animate-bounce duration-300">
          {lastDice === 6 ? (
            <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-zinc-950 font-black px-6 py-3 rounded-2xl shadow-2xl shadow-amber-500/50 border-2 border-yellow-200 flex items-center gap-3 text-sm md:text-base animate-pulse">
              <Sparkles className="w-6 h-6 text-zinc-950 animate-spin" />
              <span>🎉 عالی شد! تاس ۶ آمد! (خروج مهره یا حرکت ۶ خانه + تاس جایزه)</span>
            </div>
          ) : (
            <div className="bg-zinc-900/95 border-2 border-sky-500/60 text-sky-300 font-extrabold px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-sm">
              <Dices className="w-5 h-5 text-sky-400 animate-spin" />
              <span>نتیجه تاس: <strong className="text-amber-400 text-lg px-1">{lastDice}</strong> آمد</span>
            </div>
          )}
        </div>
      )}

      {/* Header Bar */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 mb-3 shadow-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>نوبت:</span>
              <span className={`font-black ${String(room.currentTurnUserId).startsWith('bot_') ? 'text-amber-400 animate-pulse' : 'text-slate-100'}`}>
                {room.players.find((p) => String(p.id) === String(room.currentTurnUserId))?.displayName || 'بازیکن'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <span>رنگ شما:</span>
              <span className={`font-black ${YARD_CONFIGS[myColor].text}`}>{YARD_CONFIGS[myColor].name}</span>
            </div>
          </div>
        </div>

        {/* Interactive Dice Control */}
        <div className="flex items-center gap-3">
          <Dice3D
            value={lastDice}
            isRolling={isRolling}
            canRoll={isMyTurn && !!canRoll && !isFinished}
            onRoll={handleRollClick}
            size="sm"
            showBanner={false}
          />

          <button
            disabled={!isMyTurn || !canRoll || isFinished || isRolling}
            onClick={handleRollClick}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            <Dices className="w-4 h-4" />
            <span>{isRolling ? 'در حال چرخش...' : 'انداختن تاس'}</span>
          </button>
        </div>
      </div>

      {/* Real 15x15 Ludo Board Grid */}
      <div className="w-full aspect-square bg-slate-950 rounded-2xl border-4 border-slate-800 p-1.5 shadow-2xl relative grid grid-cols-15 grid-rows-15 gap-0.5">
        {Array.from({ length: 15 }, (_, r) =>
          Array.from({ length: 15 }, (_, c) => renderCell(r, c))
        )}
      </div>

      {/* Active Players & Token Controls Panel */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 mt-3 shadow-xl">
        <div className="text-xs font-black text-slate-200 mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-sky-400" />
            <span>مهره‌های شما ({YARD_CONFIGS[myColor].name}):</span>
          </div>
          {isMyTurn && lastDice === 6 && (
            <span className="text-[11px] font-black text-amber-400 animate-pulse bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
              🎉 با تاس ۶ می‌توانید مهره جدید وارد بازی کنید!
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {myTokens.map((pos, tIdx) => {
            const canMove =
              isMyTurn &&
              !canRoll &&
              lastDice !== undefined &&
              !isFinished &&
              ((pos === 0 && lastDice === 6) || (pos > 0 && pos < 59 && pos + lastDice <= 59));

            let statusText = '🔴 استارت';
            let subText = 'نیاز به ۶';

            if (pos === 59) {
              statusText = '🏆 مقصد';
              subText = 'تمام شده';
            } else if (pos >= 53 && pos <= 58) {
              statusText = `🏁 مسیر نهایی`;
              subText = `گام ${pos - 52}`;
            } else if (pos > 0) {
              statusText = `🟢 در بازی`;
              subText = `خانه ${pos}`;
            }

            if (canMove) {
              if (pos === 0) {
                subText = '🚀 خروج و ورود به بازی';
              } else {
                subText = `⚡ حرکت ${lastDice} خانه`;
              }
            }

            return (
              <button
                key={tIdx}
                disabled={!canMove}
                onClick={() => canMove && onMoveToken(tIdx)}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  canMove
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/80 shadow-lg shadow-amber-500/20 animate-bounce cursor-pointer'
                    : 'bg-slate-800 border-slate-700/80 text-slate-400 cursor-default opacity-80'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border border-white font-black text-xs text-white flex items-center justify-center shadow ${YARD_CONFIGS[myColor].bg}`}>
                  {tIdx + 1}
                </div>
                <span className="text-[10px] font-extrabold">{statusText}</span>
                <span className="text-[9px] text-slate-300 font-medium leading-none">{subText}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
