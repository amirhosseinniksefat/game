import React, { useState } from 'react';
import { GameRoom, UserProfile } from '../types/index';
import { Trophy, ArrowRightLeft, MousePointerClick, AlertCircle, Sparkles } from 'lucide-react';

interface TicTacToeBoardProps {
  room: GameRoom;
  currentUser: UserProfile;
  onMakeMove: (cellIndex: number, fromIndex?: number) => void;
}

export const TicTacToeBoard: React.FC<TicTacToeBoardProps> = ({
  room,
  currentUser,
  onMakeMove,
}) => {
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const board = room.ticTacToe?.board || Array(9).fill(null);
  const winningLine = room.ticTacToe?.winningLine || [];
  
  const currentTurnUserIdStr = String(room.currentTurnUserId);
  const currentUserIdStr = String(currentUser.id);
  const isMyTurn = currentTurnUserIdStr === currentUserIdStr;
  const isFinished = room.status === 'finished';

  const playerX = room.players.find((p) => p.color === 'X');
  const playerO = room.players.find((p) => p.color === 'O');

  const myPlayer = room.players.find((p) => String(p.id) === currentUserIdStr) ||
    (room.players[0] && String(room.players[0].id) === currentUserIdStr ? room.players[0] : room.players[1]);
  const mySymbol = myPlayer?.color || (room.players[0] && String(room.players[0].id) === currentUserIdStr ? 'X' : 'O');

  const myPieceCount = board.filter((c) => c === mySymbol).length;
  const isMovementPhase = myPieceCount >= 3;

  const handleCellClick = (idx: number) => {
    if (isFinished) return;

    if (!isMyTurn) {
      setNotice('⌛ هنوز نوبت شما نرسیده است! لطفاً منتظر حرکت حریف باشید.');
      return;
    }

    if (!isMovementPhase) {
      // Phase 1: Placement Phase ( placing first 3 pieces )
      if (board[idx] !== null) {
        setNotice('⚠️ این خانه قبلاً پر شده است. لطفاً یک خانه خالی را انتخاب کنید.');
        return;
      }
      setNotice(null);
      onMakeMove(idx);
    } else {
      // Phase 2: Movement Phase ( moving one of 3 pieces )
      if (selectedPieceIndex === null) {
        // Step 1: User needs to select one of their pieces first
        if (board[idx] === mySymbol) {
          setSelectedPieceIndex(idx);
          setNotice('✅ مهره شما انتخاب شد. اکنون یک خانه خالی مقصد را لمس کنید.');
        } else if (board[idx] === null) {
          setNotice('👈 ابتدا یکی از ۳ مهره خود را (که دور آن کادر طلایی است) لمس کنید تا انتخاب شود!');
        } else {
          setNotice('❌ این مهره حریف است! شما فقط می‌توانید مهره‌های خود را جابجا کنید.');
        }
      } else {
        // Step 2: A piece is already selected
        if (idx === selectedPieceIndex) {
          // Deselect
          setSelectedPieceIndex(null);
          setNotice('انتخاب مهره لغو شد.');
        } else if (board[idx] === mySymbol) {
          // Switch selection to another piece of mine
          setSelectedPieceIndex(idx);
          setNotice('✅ مهره جدید انتخاب شد. اکنون خانه خالی مقصد را لمس کنید.');
        } else if (board[idx] === null) {
          // Move piece from selectedPieceIndex to idx
          setNotice(null);
          onMakeMove(idx, selectedPieceIndex);
          setSelectedPieceIndex(null);
        } else {
          setNotice('❌ این خانه پر است! لطفاً یک خانه خالی را برای مقصد جابجایی انتخاب کنید.');
        }
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Turn & Status Header */}
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-sm p-4 mb-4 shadow-xl text-center">
        {!isFinished ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border ${
                  room.currentTurnUserId === playerX?.id
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 font-bold ring-1 ring-rose-500/30'
                    : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-500'
                }`}
              >
                <span className="text-base font-black">❌</span>
                <span className="text-xs truncate max-w-[90px]">{playerX?.displayName || 'بازیکن ۱'}</span>
                <span className="text-[10px] font-mono bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-700">
                  {board.filter((c) => c === 'X').length}/3
                </span>
              </div>

              <div className="text-center">
                <span className={`text-xs font-bold block uppercase tracking-wider ${isMyTurn ? 'text-amber-400 animate-pulse' : 'text-zinc-400'}`}>
                  {isMyTurn ? '⚡ نوبت شماست!' : '⌛ در انتظار حریف...'}
                </span>
                <div className="w-20 bg-zinc-800 h-1 rounded-full mt-1 overflow-hidden mx-auto">
                  {isMyTurn && <div className="bg-amber-400 h-full w-full animate-pulse"></div>}
                </div>
              </div>

              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border ${
                  room.currentTurnUserId === playerO?.id
                    ? 'bg-sky-500/10 border-sky-500/40 text-sky-400 font-bold ring-1 ring-sky-500/30'
                    : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-500'
                }`}
              >
                <span className="text-base font-black">⭕</span>
                <span className="text-xs truncate max-w-[90px]">{playerO?.displayName || 'بازیکن ۲'}</span>
                <span className="text-[10px] font-mono bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-700">
                  {board.filter((c) => c === 'O').length}/3
                </span>
              </div>
            </div>

            {/* Instruction Banner */}
            <div className="bg-[#050505] p-2.5 rounded-sm border border-zinc-800 text-[11px] text-zinc-300 flex items-center justify-center gap-2 mb-2">
              {!isMovementPhase ? (
                <>
                  <MousePointerClick className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>
                    مرحله چیدمان ({myPieceCount}/3): یک خانه خالی را جهت قرار دادن مهره لمس کنید.
                  </span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-spin" />
                  <span>
                    {selectedPieceIndex === null
                      ? 'مرحله جابجایی: ابتدا یکی از ۳ مهره خود را لمس کنید تا انتخاب شود.'
                      : 'اکنون یک خانه خالی مقصد را برای جابجایی لمس کنید.'}
                  </span>
                </>
              )}
            </div>

            {/* Interactive Feedback / Notice Toast */}
            {notice && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] p-2 rounded-sm flex items-center justify-center gap-1.5 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                <span>{notice}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-2 flex flex-col items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
            <h3 className="text-base font-bold text-zinc-100">
              {room.winnerId === 'draw'
                ? '🤝 بازی با نتیجه مساوی به پایان رسید!'
                : `🏆 برنده بازی: ${
                    room.players.find((p) => p.id === room.winnerId)?.displayName || 'بازیکن'
                  }`}
            </h3>
          </div>
        )}
      </div>

      {/* Grid Board */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs aspect-square bg-zinc-900/90 p-4 rounded-sm border border-zinc-800 shadow-2xl relative">
        {board.map((cell, idx) => {
          const isWinningCell = winningLine.includes(idx);
          const isSelected = selectedPieceIndex === idx;
          const isMyPiece = cell === mySymbol;
          const isValidDestination = isMovementPhase && selectedPieceIndex !== null && cell === null;

          // Determine cell styling - using consistent border-2 across all states to prevent size shifts
          let cellBgClass = 'bg-zinc-800/80 hover:bg-zinc-700/80 border-2 border-zinc-700/60';
          let cellTextClass = 'text-zinc-600';

          if (cell === 'X') {
            cellTextClass = 'text-rose-500 font-extrabold';
            cellBgClass = 'bg-rose-500/10 border-2 border-rose-500/40 shadow-rose-500/10';
          } else if (cell === 'O') {
            cellTextClass = 'text-sky-400 font-extrabold';
            cellBgClass = 'bg-sky-500/10 border-2 border-sky-500/40 shadow-sky-500/10';
          }

          // Special movement highlights
          if (isMovementPhase && isMyTurn && !isFinished) {
            if (isMyPiece && selectedPieceIndex === null) {
              cellBgClass += ' ring-2 ring-amber-400/80 border-2 border-amber-400 animate-pulse';
            } else if (isValidDestination) {
              cellBgClass = 'bg-amber-500/15 border-2 border-dashed border-amber-400 text-amber-300 animate-pulse';
            }
          }

          if (isSelected) {
            cellBgClass = 'bg-amber-500/25 border-2 border-amber-400 ring-4 ring-amber-400/50 z-10';
          }

          if (isWinningCell) {
            cellBgClass = 'bg-emerald-500/20 border-2 border-emerald-400 ring-4 ring-emerald-400/40 z-10';
          }

          return (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              className={`w-full h-full aspect-square rounded-sm flex items-center justify-center text-4xl select-none shadow-inner relative transition-colors duration-150 ${cellBgClass} ${
                isMyTurn && !isFinished ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <span className={`leading-none flex items-center justify-center ${cellTextClass}`}>{cell || ''}</span>
              {isValidDestination && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
