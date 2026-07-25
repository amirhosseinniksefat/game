import React, { useState, useEffect } from 'react';
import { GameRoom, UserProfile, GameType } from '../types/index';
import { TicTacToeBoard } from './TicTacToeBoard';
import { LudoBoard } from './LudoBoard';
import { SnakesBoard } from './SnakesBoard';
import { GameResultOverlay } from './GameResultOverlay';
import { Gamepad2, Users, Send, MessageSquare, Flag, LogOut, Play, Copy, Check, Sparkles, Plus, Bot } from 'lucide-react';

interface WebGameHubProps {
  currentUser: UserProfile;
  currentRoom: GameRoom | null;
  chatMessages: any[];
  onStartGame: (roomId: string) => void;
  onMakeMove: (roomId: string, moveType: string, details: any) => void;
  onSendChatMessage: (roomId: string, text: string) => void;
  onCreateRoom: (gameType: GameType, isPrivate: boolean) => void;
  onJoinRoomCode: (code: string) => void;
  onQuickMatch: (gameType: GameType) => void;
  onPlayVsBot: (gameType: GameType) => void;
  onLeaveRoom: (roomId: string) => void;
  onOpenReportModal: (reportedUserId: string) => void;
}

export const WebGameHub: React.FC<WebGameHubProps> = ({
  currentUser,
  currentRoom,
  chatMessages,
  onStartGame,
  onMakeMove,
  onSendChatMessage,
  onCreateRoom,
  onJoinRoomCode,
  onQuickMatch,
  onPlayVsBot,
  onLeaveRoom,
  onOpenReportModal,
}) => {
  const [selectedGameType, setSelectedGameType] = useState<GameType>('tictactoe');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyInviteLink = () => {
    if (!currentRoom) return;
    const link = `https://t.me/GameCenterBot?start=room_${currentRoom.code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (currentRoom) {
    const isHost = currentRoom.hostId === currentUser.id;
    const canStart = isHost && currentRoom.status === 'waiting' && currentRoom.players.length >= 2;

    return (
      <div className="max-w-6xl mx-auto py-6 px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Game Area (Col 1 & 2) */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-sm p-5 shadow-2xl flex flex-col justify-between">
          
          {/* Room Top Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <span className="bg-emerald-500/10 text-emerald-400 p-2 rounded-sm border border-emerald-500/20">
                <Gamepad2 className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-zinc-100 font-mono">
                    اتاق {currentRoom.code}
                  </h3>
                  <span className="bg-zinc-800 text-zinc-300 text-xs px-2.5 py-0.5 rounded-sm border border-zinc-700 font-bold">
                    {currentRoom.gameType === 'tictactoe'
                      ? 'دوز'
                      : currentRoom.gameType === 'ludo'
                      ? 'منچ'
                      : 'مار و پله'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyInviteLink}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3 py-1.5 rounded-sm border border-zinc-700 flex items-center gap-1.5 transition-colors font-bold"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{copiedCode ? 'لینک کپی شد' : 'کپی لینک دعوت'}</span>
              </button>

              <button
                onClick={() => onLeaveRoom(currentRoom.id)}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs px-3 py-1.5 rounded-sm border border-rose-500/30 flex items-center gap-1.5 transition-colors font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            </div>
          </div>

          {/* Game Board Content */}
          <div className="my-4">
            {currentRoom.status === 'waiting' ? (
              <div className="py-12 text-center bg-[#050505] rounded-sm border border-zinc-800 p-6">
                <div className="w-16 h-16 rounded-sm bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 animate-pulse">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-zinc-100 mb-2 uppercase tracking-wide">
                  در انتظار ورود سایر بازیکنان...
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-6">
                  لینک دعوت اتاق را برای دوستان خود بفرستید یا منتظر اتصال آنلاین باشید.
                </p>

                {canStart && (
                  <button
                    onClick={() => onStartGame(currentRoom.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm px-6 py-3 rounded-sm flex items-center gap-2 mx-auto shadow-xl transition-all active:scale-95 uppercase tracking-wider"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>شروع بازی الان</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {currentRoom.gameType === 'tictactoe' && (
                  <TicTacToeBoard
                    room={currentRoom}
                    currentUser={currentUser}
                    onMakeMove={(cellIdx, fromIdx) =>
                      onMakeMove(currentRoom.id, 'move', { cellIndex: cellIdx, fromIndex: fromIdx })
                    }
                  />
                )}
                {currentRoom.gameType === 'ludo' && (
                  <LudoBoard
                    room={currentRoom}
                    currentUser={currentUser}
                    onRollDice={() => onMakeMove(currentRoom.id, 'roll', {})}
                    onMoveToken={(tIdx) =>
                      onMakeMove(currentRoom.id, 'move', { tokenIndex: tIdx })
                    }
                  />
                )}
                {currentRoom.gameType === 'snakes' && (
                  <SnakesBoard
                    room={currentRoom}
                    currentUser={currentUser}
                    onRollDice={() => onMakeMove(currentRoom.id, 'roll', {})}
                  />
                )}
                
                {/* Result Overlay with Victory / Defeat sounds & animations */}
                <GameResultOverlay
                  room={currentRoom}
                  currentUser={currentUser}
                  onLeaveRoom={onLeaveRoom}
                  onPlayAgain={() => onStartGame(currentRoom.id)}
                />
              </>
            )}
          </div>

        </div>

        {/* Live In-Game Chat Drawer (Col 3) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-4 shadow-2xl flex flex-col h-[650px]">
          <div className="pb-3 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">چت زنده بازی</h4>
            </div>
            <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-sm border border-zinc-700">
              کانال امن WS
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5 text-xs">
            {chatMessages.map((msg: any) => (
              <div
                key={msg.id}
                className={`p-2.5 rounded-sm border ${
                  msg.isSystem
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 text-[11px]'
                    : msg.senderId === currentUser.id
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-100 mr-4'
                    : 'bg-[#050505] border-zinc-800 text-zinc-200 ml-4'
                }`}
              >
                {!msg.isSystem && (
                  <span className="font-bold text-[10px] text-emerald-400 block mb-0.5 font-mono">
                    {msg.senderName}:
                  </span>
                )}
                <span className="leading-relaxed">{msg.text}</span>
              </div>
            ))}
          </div>

          {/* Emoji Suggestions */}
          <div className="py-2 border-t border-zinc-800 flex items-center gap-1.5 overflow-x-auto text-sm no-scrollbar">
            {['👋', '😂', '🔥', '👏', '🎯', '🏁', '😎'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => onSendChatMessage(currentRoom.id, emoji)}
                className="bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded-sm border border-zinc-700 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Chat Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (chatInput.trim()) {
                onSendChatMessage(currentRoom.id, chatInput);
                setChatInput('');
              }
            }}
            className="pt-2 border-t border-zinc-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="پیام یا چت زنده..."
              className="flex-1 bg-[#050505] text-zinc-200 placeholder-zinc-500 text-xs px-3 py-2 rounded-sm border border-zinc-800 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-sm transition-colors"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>
        </div>

      </div>
    );
  }

  // Room Lobby Launcher View
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      
      {/* Game Selection Cards */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-black text-white uppercase tracking-tight">انتخاب بازی آنلاین</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Tic Tac Toe */}
          <div
            onClick={() => setSelectedGameType('tictactoe')}
            className={`p-5 rounded-sm border transition-all cursor-pointer relative overflow-hidden ${
              selectedGameType === 'tictactoe'
                ? 'bg-zinc-900 border-emerald-500 shadow-xl'
                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="w-12 h-12 rounded-sm bg-rose-500/10 text-rose-400 flex items-center justify-center text-2xl font-black mb-3 border border-rose-500/20">
              ❌⭕
            </div>
            <h3 className="text-base font-bold text-white mb-1 uppercase tracking-wide">بازی دوز (Tic Tac Toe)</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              رقابت ۲ نفره کلاسیک، تشخیص هوشمند برد و مساوی با سیستم زمان‌بندی نوبت.
            </p>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-400">
              <span>تعداد: ۲ بازیکن</span>
              <span>زمان: ۳۰ ثانیه</span>
            </div>
          </div>

          {/* Ludo */}
          <div
            onClick={() => setSelectedGameType('ludo')}
            className={`p-5 rounded-sm border transition-all cursor-pointer relative overflow-hidden ${
              selectedGameType === 'ludo'
                ? 'bg-zinc-900 border-emerald-500 shadow-xl'
                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="w-12 h-12 rounded-sm bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl font-black mb-3 border border-amber-500/20">
              🎲
            </div>
            <h3 className="text-base font-bold text-white mb-1 uppercase tracking-wide">بازی منچ (Ludo)</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              رقابت ۲ تا ۴ نفره، سیستم تاس هوشمند، خانه‌های امن و زدن مهره حریف.
            </p>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400">
              <span>تعداد: ۲ تا ۴ بازیکن</span>
              <span>تاس: ۶ جایزه</span>
            </div>
          </div>

          {/* Snakes & Ladders */}
          <div
            onClick={() => setSelectedGameType('snakes')}
            className={`p-5 rounded-sm border transition-all cursor-pointer relative overflow-hidden ${
              selectedGameType === 'snakes'
                ? 'bg-zinc-900 border-emerald-500 shadow-xl'
                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="w-12 h-12 rounded-sm bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl font-black mb-3 border border-emerald-500/20">
              🐍🪜
            </div>
            <h3 className="text-base font-bold text-white mb-1 uppercase tracking-wide">مار و پله (Snakes)</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              صفحه ۱۰۰ خانه‌ای، صعود با نردبان و سقوط با نیش مار، رسیدن دقیق به ۱۰۰.
            </p>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-400">
              <span>تعداد: ۲ تا ۴ بازیکن</span>
              <span>تاس: ۱ تا ۶</span>
            </div>
          </div>
        </div>
      </div>

      {/* Room Action Buttons */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Single Player vs Bot */}
        <div className="flex flex-col justify-between p-4 bg-[#050505] rounded-sm border border-amber-500/40 relative overflow-hidden">
          <div className="absolute top-0 left-0 bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-br-sm uppercase tracking-wider">
            تکنفره
          </div>
          <div className="mt-2">
            <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5 uppercase tracking-wider">
              <Bot className="w-4 h-4 text-amber-400" />
              <span>بازی با ربات (vs AI)</span>
            </h4>
            <p className="text-xs text-zinc-400 mb-4">
              رقابت تک‌نفره فوری با ربات هوشمند بدون نیاز به انتظار.
            </p>
          </div>
          <button
            onClick={() => onPlayVsBot(selectedGameType)}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black text-xs py-3 rounded-sm transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-lg shadow-amber-600/20"
          >
            <Bot className="w-4 h-4" />
            <span>شروع بازی با ربات</span>
          </button>
        </div>

        {/* Quick Match */}
        <div className="flex flex-col justify-between p-4 bg-[#050505] rounded-sm border border-zinc-800">
          <div>
            <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-wider">جستجوی سریع بازیکن</h4>
            <p className="text-xs text-zinc-400 mb-4">
              اتصال اتوماتیک به اولین بازیکن آنلاین منتظر در شبکه.
            </p>
          </div>
          <button
            onClick={() => onQuickMatch(selectedGameType)}
            className="w-full bg-white hover:bg-zinc-200 text-black font-black text-xs py-3 rounded-sm transition-all uppercase tracking-wider"
          >
            جستجوی فوری حریف
          </button>
        </div>

        {/* Create Public Room */}
        <div className="flex flex-col justify-between p-4 bg-[#050505] rounded-sm border border-zinc-800">
          <div>
            <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-wider">ساخت اتاق عمومی</h4>
            <p className="text-xs text-zinc-400 mb-4">
              ایجاد اتاق بازی عمومی در لیست اتاق‌ها جهت ملحق شدن همه.
            </p>
          </div>
          <button
            onClick={() => onCreateRoom(selectedGameType, false)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 rounded-sm transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span>ایجاد اتاق جدید</span>
          </button>
        </div>

        {/* Join Code */}
        <div className="flex flex-col justify-between p-4 bg-[#050505] rounded-sm border border-zinc-800">
          <div>
            <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-wider">ورود با کد اختصاصی اتاق</h4>
            <p className="text-xs text-zinc-400 mb-2">
              کد اتاق (مانند RM-8391) را وارد کنید:
            </p>
            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              placeholder="مثلاً RM-8391"
              className="w-full bg-zinc-900 text-zinc-100 font-mono text-xs px-3 py-2 rounded-sm border border-zinc-800 mb-3"
            />
          </div>
          <button
            onClick={() => onJoinRoomCode(roomCodeInput)}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs py-3 rounded-sm border border-zinc-700 transition-all uppercase tracking-wider"
          >
            پیوستن به اتاق
          </button>
        </div>

      </div>

    </div>
  );
};
