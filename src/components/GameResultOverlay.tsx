import React, { useEffect, useRef } from 'react';
import { GameRoom, UserProfile } from '../types/index';
import { Trophy, Frown, Sparkles, LogOut, RotateCcw, Volume2, Award, Skull, Scale } from 'lucide-react';
import { playVictoryFanfare, playDefeatSound, playHomeSound } from '../utils/audio';

interface GameResultOverlayProps {
  room: GameRoom;
  currentUser: UserProfile;
  onLeaveRoom?: (roomId: string) => void;
  onPlayAgain?: () => void;
}

export const GameResultOverlay: React.FC<GameResultOverlayProps> = ({
  room,
  currentUser,
  onLeaveRoom,
  onPlayAgain,
}) => {
  if (room.status !== 'finished') return null;

  const currentUserIdStr = String(currentUser.id);
  const winnerIdStr = room.winnerId ? String(room.winnerId) : null;
  const isDraw = winnerIdStr === 'draw';
  const isWinner = winnerIdStr === currentUserIdStr;
  const isLoser = !isWinner && !isDraw && winnerIdStr !== null;

  const winnerPlayer = room.players.find((p) => String(p.id) === winnerIdStr);

  const hasPlayedSoundRef = useRef(false);

  useEffect(() => {
    if (!hasPlayedSoundRef.current) {
      hasPlayedSoundRef.current = true;
      if (isWinner) {
        playVictoryFanfare();
      } else if (isLoser) {
        playDefeatSound();
      } else if (isDraw) {
        playHomeSound();
      }
    }
  }, [isWinner, isLoser, isDraw]);

  const handleReplayAudio = () => {
    if (isWinner) playVictoryFanfare();
    else if (isLoser) playDefeatSound();
    else if (isDraw) playHomeSound();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div
        className={`w-full max-w-md bg-zinc-900 rounded-lg p-6 sm:p-8 text-center relative overflow-hidden shadow-2xl border-2 transition-all ${
          isWinner
            ? 'border-amber-500/80 shadow-[0_0_60px_rgba(245,158,11,0.35)]'
            : isLoser
            ? 'border-rose-500/80 shadow-[0_0_60px_rgba(244,63,94,0.35)]'
            : 'border-sky-500/80 shadow-[0_0_60px_rgba(14,165,233,0.35)]'
        }`}
      >
        {/* Decorative Top Radial Glow */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none ${
            isWinner ? 'bg-amber-400' : isLoser ? 'bg-rose-500' : 'bg-sky-400'
          }`}
        />

        {/* Content Section */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Main Icon */}
          <div className="mb-4 relative">
            {isWinner ? (
              <div className="relative">
                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/40 animate-pulse">
                  <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
                </div>
                <Sparkles className="w-6 h-6 text-amber-300 absolute -top-2 -right-2 animate-spin" />
                <Sparkles className="w-5 h-5 text-amber-400 absolute -bottom-1 -left-2 animate-pulse" />
              </div>
            ) : isLoser ? (
              <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center border border-rose-500/40">
                <Skull className="w-12 h-12 text-rose-400 animate-pulse" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-sky-500/20 rounded-full flex items-center justify-center border border-sky-500/40">
                <Scale className="w-12 h-12 text-sky-400" />
              </div>
            )}
          </div>

          {/* Result Title */}
          <h2
            className={`text-2xl sm:text-3xl font-black mb-2 tracking-wide ${
              isWinner
                ? 'text-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]'
                : isLoser
                ? 'text-rose-400 drop-shadow-[0_2px_10px_rgba(244,63,94,0.5)]'
                : 'text-sky-300'
            }`}
          >
            {isWinner
              ? '🏆 پیروز شدید!'
              : isLoser
              ? '💔 شکست خوردید!'
              : '🤝 مساوی شد!'}
          </h2>

          {/* Subtitle Message */}
          <p className="text-sm sm:text-base text-zinc-300 font-medium mb-6 leading-relaxed max-w-xs">
            {isWinner
              ? 'تبریک فوق‌العاده! شما با مهارت برنده این بازی شدید 🎉'
              : isLoser
              ? 'متأسفانه در این مسابقه شکست خوردید. ناامید نشوید و دوباره شانس خود را امتحان کنید!'
              : 'رقابت بسیار پایاپای بود و بازی با نتیجه مساوی خاتمه یافت.'}
          </p>

          {/* Winner Details Card if loser */}
          {isLoser && winnerPlayer && (
            <div className="w-full bg-zinc-950/80 border border-zinc-800 rounded-md p-3 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">👑</span>
                <div className="text-right">
                  <span className="text-[11px] text-zinc-400 block">برنده بازی</span>
                  <span className="text-sm font-bold text-amber-400">{winnerPlayer.displayName}</span>
                </div>
              </div>
              <Award className="w-5 h-5 text-amber-400" />
            </div>
          )}

          {/* Sound Replay button */}
          <button
            onClick={handleReplayAudio}
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 mb-6 px-3 py-1 bg-zinc-800/60 hover:bg-zinc-800 rounded-full border border-zinc-700/50 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>پخش مجدد صدای {isWinner ? 'پیروزی' : isLoser ? 'شکست' : 'نتیجه'}</span>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-3 w-full">
            {onLeaveRoom && (
              <button
                onClick={() => onLeaveRoom(room.id)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs sm:text-sm font-bold py-2.5 px-4 rounded-md border border-zinc-700 flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4 text-zinc-400" />
                <span>خروج به لابی</span>
              </button>
            )}

            {onPlayAgain && (
              <button
                onClick={onPlayAgain}
                className={`flex-1 text-xs sm:text-sm font-bold py-2.5 px-4 rounded-md flex items-center justify-center gap-2 transition-colors ${
                  isWinner
                    ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>بازی مجدد</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
