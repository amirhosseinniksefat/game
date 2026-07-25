import React, { useState, useEffect, useRef } from 'react';
import { GameRoom, UserProfile } from '../types/index';
import { Dices, Trophy, Sparkles } from 'lucide-react';
import { Dice3D } from './Dice3D';
import { playDiceSound, playMoveSound, playHomeSound, playLadderSound, playSnakeSound } from '../utils/audio';

interface SnakesBoardProps {
  room: GameRoom;
  currentUser: UserProfile;
  onRollDice: () => void;
}

export const SnakesBoard: React.FC<SnakesBoardProps> = ({
  room,
  currentUser,
  onRollDice,
}) => {
  const isMyTurn = room.currentTurnUserId === currentUser.id;
  const snakesState = room.snakes;
  const positions = snakesState?.positions || {};
  const isFinished = room.status === 'finished';
  const lastDice = snakesState?.lastDiceRoll;
  const lastRollTime = snakesState?.lastRollTime;

  const [isRolling, setIsRolling] = useState(false);
  const [showRollEffect, setShowRollEffect] = useState(false);
  const [prevRollTime, setPrevRollTime] = useState<number | undefined>(lastRollTime);

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
      }, 3000);

      return () => {
        clearTimeout(timer);
        clearTimeout(toastTimer);
        setIsRolling(false);
      };
    }
  }, [lastRollTime, prevRollTime]);

  // Track pawn movements to play sound effects (moves, ladders, snakes, victory)
  const prevPositionsRef = useRef<Record<string, number>>({});
  useEffect(() => {
    if (!positions) return;

    Object.entries(positions).forEach(([userId, posVal]) => {
      const pos = Number(posVal);
      const prevPos = prevPositionsRef.current[userId];
      if (prevPos !== undefined && prevPos !== pos) {
        if (pos === 100) {
          playHomeSound();
        } else if (pos < prevPos) {
          // Slide down snake
          playSnakeSound();
        } else if (pos - prevPos > 6) {
          // Climbed ladder
          playLadderSound();
        } else {
          // Regular step move
          playMoveSound();
        }
      }
    });

    prevPositionsRef.current = { ...positions };
  }, [positions]);

  const handleRollClick = () => {
    if (!isMyTurn || isFinished || isRolling) return;
    setIsRolling(true);
    playDiceSound();
    onRollDice();

    const timer = setTimeout(() => {
      setIsRolling(false);
    }, 700);
    return () => clearTimeout(timer);
  };

  // Generate 100 cells (10x10) from 100 down to 1
  const cells = Array.from({ length: 100 }, (_, i) => 100 - i);

  return (
    <div className="flex flex-col items-center justify-center p-3 relative">
      {/* Floating Dice Result Toast */}
      {showRollEffect && lastDice !== undefined && (
        <div className="fixed top-20 z-50 animate-bounce">
          <div className="bg-zinc-900/95 border-2 border-emerald-500/60 text-emerald-300 font-extrabold px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-sm">
            <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
            <span>تاس ماروپله: <strong className="text-amber-400 text-lg px-1">{lastDice}</strong> آمد!</span>
          </div>
        </div>
      )}

      {/* Header Controls */}
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-200">
            نوبت: {room.players.find((p) => String(p.id) === String(room.currentTurnUserId))?.displayName || 'بازیکن'}
          </span>

          <Dice3D
            value={lastDice}
            isRolling={isRolling}
            canRoll={isMyTurn && !isFinished}
            onRoll={handleRollClick}
            size="sm"
            showBanner={false}
          />
        </div>

        <button
          disabled={!isMyTurn || isFinished || isRolling}
          onClick={handleRollClick}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
        >
          <Dices className="w-4.5 h-4.5" />
          <span>{isRolling ? 'در حال چرخش...' : 'انداختن تاس'}</span>
        </button>
      </div>

      {/* 100 Cell Board Grid */}
      <div className="w-full max-w-md bg-slate-950 border-2 border-slate-800 rounded-3xl p-3 shadow-2xl relative">
        <div className="grid grid-cols-10 gap-1 aspect-square">
          {cells.map((cellNum) => {
            // Find players on this cell
            const playersOnCell = room.players.filter(
              (p) => (positions[p.id] || 1) === cellNum
            );

            const isSnakeHead = [99, 95, 87, 62, 49, 16].includes(cellNum);
            const isLadderStart = [4, 9, 20, 28, 40, 51, 63, 71].includes(cellNum);

            return (
              <div
                key={cellNum}
                className={`relative rounded-lg flex flex-col items-center justify-between p-1 border text-[10px] font-bold select-none ${
                  cellNum === 100
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : isSnakeHead
                    ? 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                    : isLadderStart
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{cellNum}</span>
                  {isSnakeHead && <span title="نیش مار">🐍</span>}
                  {isLadderStart && <span title="نردبان">🪜</span>}
                  {cellNum === 100 && <span>🏆</span>}
                </div>

                {/* Pawns */}
                {playersOnCell.length > 0 && (
                  <div className="flex items-center gap-0.5 z-10 my-0.5">
                    {playersOnCell.map((p) => (
                      <div
                        key={p.id}
                        title={p.displayName}
                        style={{ backgroundColor: p.color || '#3b82f6' }}
                        className="w-3.5 h-3.5 rounded-full border border-white shadow-md animate-pulse"
                      ></div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

