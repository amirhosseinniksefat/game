import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Dices } from 'lucide-react';
import { playDiceSound } from '../utils/audio';

export { playDiceSound };

interface Dice3DProps {
  value?: number;
  isRolling?: boolean;
  canRoll?: boolean;
  onRoll?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showBanner?: boolean;
}

// Component to render pips/dots on a single face
export const DiceFace: React.FC<{ num: number; sizePx?: number }> = ({ num, sizePx = 64 }) => {
  const getDots = () => {
    switch (num) {
      case 1:
        return [{ row: 2, col: 2, red: true }];
      case 2:
        return [
          { row: 1, col: 1 },
          { row: 3, col: 3 },
        ];
      case 3:
        return [
          { row: 1, col: 1 },
          { row: 2, col: 2 },
          { row: 3, col: 3 },
        ];
      case 4:
        return [
          { row: 1, col: 1 },
          { row: 1, col: 3 },
          { row: 3, col: 1 },
          { row: 3, col: 3 },
        ];
      case 5:
        return [
          { row: 1, col: 1 },
          { row: 1, col: 3 },
          { row: 2, col: 2 },
          { row: 3, col: 1 },
          { row: 3, col: 3 },
        ];
      case 6:
        return [
          { row: 1, col: 1, red: true },
          { row: 1, col: 3, red: true },
          { row: 2, col: 1, red: true },
          { row: 2, col: 3, red: true },
          { row: 3, col: 1, red: true },
          { row: 3, col: 3, red: true },
        ];
      default:
        return [{ row: 2, col: 2 }];
    }
  };

  const dots = getDots();
  const dotSize = Math.max(8, Math.floor(sizePx * 0.18));

  return (
    <div
      style={{ width: `${sizePx}px`, height: `${sizePx}px` }}
      className="bg-gradient-to-br from-white via-zinc-100 to-zinc-200 border-2 border-zinc-400/80 rounded-xl shadow-inner grid grid-cols-3 grid-rows-3 p-1.5 items-center justify-items-center select-none"
    >
      {dots.map((dot, idx) => (
        <div
          key={idx}
          style={{
            gridRow: dot.row,
            gridColumn: dot.col,
            width: `${dotSize}px`,
            height: `${dotSize}px`,
          }}
          className={`rounded-full shadow-inner ${
            dot.red ? 'bg-rose-600 ring-1 ring-rose-400' : 'bg-zinc-900 ring-1 ring-zinc-700'
          }`}
        />
      ))}
    </div>
  );
};

// Target rotations for each face (1-6)
const faceRotations: Record<number, { rx: number; ry: number }> = {
  1: { rx: 0, ry: 0 },
  2: { rx: 0, ry: -90 },
  3: { rx: -90, ry: 0 },
  4: { rx: 90, ry: 0 },
  5: { rx: 0, ry: 90 },
  6: { rx: 0, ry: 180 },
};

// Keyframes for continuous 3D tumbling while rolling
const diceTumbleKeyframes = `
@keyframes diceTumble {
  0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
  25% { transform: rotateX(180deg) rotateY(90deg) rotateZ(45deg); }
  50% { transform: rotateX(360deg) rotateY(270deg) rotateZ(90deg); }
  75% { transform: rotateX(540deg) rotateY(450deg) rotateZ(135deg); }
  100% { transform: rotateX(720deg) rotateY(720deg) rotateZ(180deg); }
}
`;

export const Dice3D: React.FC<Dice3DProps> = ({
  value,
  isRolling = false,
  canRoll = false,
  onRoll,
  size = 'md',
  showBanner = true,
}) => {
  const prevValueRef = useRef<number | undefined>(value);
  const prevIsRollingRef = useRef<boolean>(isRolling);

  const displayValue = value && value >= 1 && value <= 6 ? value : 1;
  const target = faceRotations[displayValue] || faceRotations[1];

  const [rotation, setRotation] = useState(() => ({
    rx: target.rx,
    ry: target.ry,
  }));

  useEffect(() => {
    const isRollingEnded = prevIsRollingRef.current && !isRolling;
    const valueChanged = value !== undefined && value !== prevValueRef.current;

    if (isRollingEnded || (valueChanged && !isRolling)) {
      setRotation((prev) => {
        // Keep angle increments bounded while adding a full 720deg spin
        const baseRx = Math.floor(prev.rx / 360) * 360 + 720;
        const baseRy = Math.floor(prev.ry / 360) * 360 + 720;
        return {
          rx: baseRx + target.rx,
          ry: baseRy + target.ry,
        };
      });
    } else if (!isRolling && value === undefined) {
      setRotation({
        rx: target.rx,
        ry: target.ry,
      });
    }

    prevIsRollingRef.current = isRolling;
    prevValueRef.current = value;
  }, [isRolling, value, target.rx, target.ry]);

  const handleContainerClick = () => {
    if (canRoll && !isRolling && onRoll) {
      onRoll();
    }
  };

  const dimMap = {
    sm: { box: 48, translate: 24 },
    md: { box: 64, translate: 32 },
    lg: { box: 88, translate: 44 },
  };

  const currentDim = dimMap[size];
  const isSix = displayValue === 6;

  return (
    <div className="flex flex-col items-center justify-center gap-2 select-none">
      <style>{diceTumbleKeyframes}</style>
      {/* 3D Dice Container */}
      <div
        onClick={handleContainerClick}
        className={`relative flex items-center justify-center p-2 rounded-2xl transition-all ${
          canRoll && !isRolling
            ? 'cursor-pointer hover:scale-110 active:scale-95 ring-2 ring-amber-400/80 shadow-lg shadow-amber-500/30 bg-amber-500/15 animate-pulse'
            : 'cursor-default'
        }`}
        style={{ perspective: '600px' }}
      >
        <div
          className="relative"
          style={{
            width: `${currentDim.box}px`,
            height: `${currentDim.box}px`,
            transformStyle: 'preserve-3d',
            animation: isRolling ? 'diceTumble 0.35s linear infinite' : 'none',
            transition: isRolling ? 'none' : 'transform 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
            transform: isRolling
              ? undefined
              : `rotateX(${rotation.rx}deg) rotateY(${rotation.ry}deg) rotateZ(0deg)`,
          }}
        >
          {/* Front: 1 */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-white shadow-md border border-zinc-300"
            style={{ transform: `translateZ(${currentDim.translate}px)` }}
          >
            <DiceFace num={1} sizePx={currentDim.box} />
          </div>

          {/* Back: 6 */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-white shadow-md border border-zinc-300"
            style={{ transform: `rotateY(180deg) translateZ(${currentDim.translate}px)` }}
          >
            <DiceFace num={6} sizePx={currentDim.box} />
          </div>

          {/* Right: 2 */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-white shadow-md border border-zinc-300"
            style={{ transform: `rotateY(90deg) translateZ(${currentDim.translate}px)` }}
          >
            <DiceFace num={2} sizePx={currentDim.box} />
          </div>

          {/* Left: 5 */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-white shadow-md border border-zinc-300"
            style={{ transform: `rotateY(-90deg) translateZ(${currentDim.translate}px)` }}
          >
            <DiceFace num={5} sizePx={currentDim.box} />
          </div>

          {/* Top: 3 */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-white shadow-md border border-zinc-300"
            style={{ transform: `rotateX(90deg) translateZ(${currentDim.translate}px)` }}
          >
            <DiceFace num={3} sizePx={currentDim.box} />
          </div>

          {/* Bottom: 4 */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-white shadow-md border border-zinc-300"
            style={{ transform: `rotateX(-90deg) translateZ(${currentDim.translate}px)` }}
          >
            <DiceFace num={4} sizePx={currentDim.box} />
          </div>
        </div>
      </div>

      {/* Outcome Banner */}
      {showBanner && value !== undefined && !isRolling && (
        <div className="animate-fadeIn">
          {isSix ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 ring-2 ring-amber-300 animate-bounce">
              <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
              <span>🎉 تاس شش آمد! (نوبت جایزه + امکان خروج مهره)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold">
              <Dices className="w-3.5 h-3.5 text-sky-400" />
              <span>عدد تاس:</span>
              <span className="text-amber-400 text-base font-black px-1">{displayValue}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

