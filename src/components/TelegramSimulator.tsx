import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, CheckCheck, Sparkles, Gamepad2, User, HelpCircle, Shield, RotateCcw, ExternalLink } from 'lucide-react';
import { UserProfile } from '../types/index';

interface TelegramSimulatorProps {
  currentUser: UserProfile;
  onLaunchGame: (roomId?: string) => void;
  onOpenAdmin: () => void;
  onOpenProfile: () => void;
}

interface ChatItem {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  inlineKeyboard?: any[];
  timestamp: string;
}

export const TelegramSimulator: React.FC<TelegramSimulatorProps> = ({
  currentUser,
  onLaunchGame,
  onOpenAdmin,
  onOpenProfile,
}) => {
  const [messages, setMessages] = useState<ChatItem[]>([
    {
      id: '1',
      sender: 'bot',
      text: `سلام ${currentUser.displayName} عزیز! 👋\nبه **پلتفرم جامع بازی‌های چندنفره آنلاین تلگرام** خوش آمدید.\n\nیک بازی انتخاب کنید، با دوستان خود یا بازیکنان آنلاین رقابت کنید و لذت ببرید!`,
      inlineKeyboard: [
        [{ text: '🎮 شروع بازی جدید', callback_data: '/games' }],
        [{ text: '👤 پروفایل کاربری', callback_data: '/profile' }, { text: '🚪 لیست اتاق‌ها', callback_data: '/rooms' }],
        [{ text: '👥 دوستان من', callback_data: '/friends' }, { text: '⚙️ پنل مدیریت', callback_data: '/admin' }]
      ],
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsg: ChatItem = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/bot-sim/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: currentUser.telegramId,
          username: currentUser.username,
          displayName: currentUser.displayName,
          text,
        }),
      });

      const data = await res.json();
      setIsTyping(false);

      const botReply: ChatItem = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.responseText,
        inlineKeyboard: data.inlineKeyboard,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: '❌ خطا در برقراری ارتباط با سرور ربات تلگرام.',
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const handleInlineButtonClick = (btn: any) => {
    if (btn.web_app) {
      onLaunchGame();
      return;
    }

    if (btn.callback_data === 'open_admin_panel' || btn.callback_data === '/admin') {
      onOpenAdmin();
      return;
    }

    if (btn.callback_data === 'menu_profile' || btn.callback_data === '/profile') {
      onOpenProfile();
      return;
    }

    if (btn.callback_data === 'menu_games' || btn.callback_data === '/games') {
      onLaunchGame();
      return;
    }

    const command = btn.callback_data || btn.text;
    handleSendMessage(command);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Container simulating Telegram Client UI */}
      <div className="bg-zinc-900/90 rounded-sm border border-zinc-800 shadow-2xl overflow-hidden flex flex-col h-[750px]">
        
        {/* Telegram Header */}
        <div className="bg-[#0a0a0a] px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-sm bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400 font-bold shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-zinc-900 rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">ربات بازی آنلاین تلگرام</h2>
                <span className="bg-emerald-500/10 text-emerald-400 p-0.5 rounded-sm">
                  <Sparkles className="w-3 h-3" />
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">@GameCenterBot • آنلاین با سرور متمرکز</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onLaunchGame()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-sm flex items-center gap-1.5 transition-colors uppercase tracking-wider"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>باز کردن WebApp گیمینگ</span>
            </button>
            <button
              onClick={() => handleSendMessage('/start')}
              title="راه‌اندازی مجدد (/start)"
              className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-sm border border-zinc-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#050505]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-sm px-4 py-3 shadow-md relative text-sm border ${
                  msg.sender === 'user'
                    ? 'bg-zinc-800 border-zinc-700 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-100'
                }`}
              >
                {/* Message Text with simple formatting */}
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </div>

                {/* Inline Keyboards */}
                {msg.inlineKeyboard && msg.inlineKeyboard.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
                    {msg.inlineKeyboard.map((row: any[], rIdx: number) => (
                      <div key={rIdx} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {row.map((btn: any, bIdx: number) => (
                          <button
                            key={bIdx}
                            onClick={() => handleInlineButtonClick(btn)}
                            className="w-full bg-zinc-800 hover:bg-emerald-600 text-zinc-200 hover:text-white font-bold text-xs px-3 py-2 rounded-sm border border-zinc-700 hover:border-emerald-500 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <span>{btn.text}</span>
                            {btn.web_app && <ExternalLink className="w-3.5 h-3.5 opacity-80" />}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-1 flex items-center justify-end gap-1 text-[10px] font-mono text-zinc-500">
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono bg-zinc-900 w-fit px-3 py-1.5 rounded-sm border border-zinc-800">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              <span className="mr-1">ربات در حال پردازش...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Commands Toolbar */}
        <div className="bg-[#0a0a0a] px-4 py-2 border-t border-zinc-800 flex items-center gap-2 overflow-x-auto text-xs font-mono no-scrollbar">
          <button
            onClick={() => handleSendMessage('/start')}
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-sm border border-zinc-700 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>/start</span>
          </button>
          <button
            onClick={() => handleSendMessage('/games')}
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-sm border border-zinc-700 whitespace-nowrap"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>/games (بازی‌ها)</span>
          </button>
          <button
            onClick={() => handleSendMessage('/profile')}
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-sm border border-zinc-700 whitespace-nowrap"
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>/profile (پروفایل)</span>
          </button>
          <button
            onClick={() => handleSendMessage('/rooms')}
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-sm border border-zinc-700 whitespace-nowrap"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-sky-400" />
            <span>/rooms (اتاق‌ها)</span>
          </button>
          <button
            onClick={() => handleSendMessage('/admin')}
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-sm border border-zinc-700 whitespace-nowrap"
          >
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>/admin (مدیریت)</span>
          </button>
          <button
            onClick={() => handleSendMessage('/help')}
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-sm border border-zinc-700 whitespace-nowrap"
          >
            <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
            <span>/help (راهنما)</span>
          </button>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="دستور یا پیام خود را تایپ کنید (مثلاً /start)..."
            className="flex-1 bg-[#050505] text-zinc-100 placeholder-zinc-500 text-xs px-4 py-2.5 rounded-sm border border-zinc-800 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-2.5 rounded-sm transition-colors"
          >
            <Send className="w-5 h-5 rotate-180" />
          </button>
        </form>

      </div>
    </div>
  );
};
