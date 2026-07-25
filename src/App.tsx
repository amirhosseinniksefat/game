import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { TelegramSimulator } from './components/TelegramSimulator';
import { WebGameHub } from './components/WebGameHub';
import { AdminPanel } from './components/AdminPanel';
import { DocsView } from './components/DocsView';
import { ProfileModal } from './components/ProfileModal';
import { ReportModal } from './components/ReportModal';
import { UserProfile, PlatformStats, GameRoom, GameType, ReportCategory } from './types/index';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'hub' | 'admin' | 'docs'>('simulator');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [reportedUserId, setReportedUserId] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);

  // Auto initialize user profile on start
  useEffect(() => {
    async function initUser() {
      try {
        const telegramId = localStorage.getItem('tg_user_id') || `user_${Math.floor(100000 + Math.random() * 900000)}`;
        localStorage.setItem('tg_user_id', telegramId);

        const res = await fetch('/api/auth/me', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId,
            username: `player_${telegramId.slice(-4)}`,
            displayName: `بازیکن ${telegramId.slice(-4)}`,
          }),
        });

        const userData = await res.json();
        setCurrentUser(userData);

        // Fetch platform stats
        const statsRes = await fetch('/api/admin/stats').then((r) => r.json());
        setStats(statsRes);
      } catch (err) {
        console.error('Failed to init user:', err);
      }
    }

    initUser();
  }, []);

  // Setup WebSocket connection
  useEffect(() => {
    if (!currentUser) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', userId: currentUser.id }));
      if (currentRoom) {
        ws.send(JSON.stringify({ type: 'join_room_socket', roomId: currentRoom.id }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'room_update') {
          setCurrentRoom(data.room);
          if (data.chat) setChatMessages(data.chat);
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [currentUser]);

  // Fallback room sync polling
  useEffect(() => {
    if (!currentRoom) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${currentRoom.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.room) {
            setCurrentRoom((prev) => {
              if (!prev) return data.room;
              if (JSON.stringify(prev) === JSON.stringify(data.room)) return prev;
              return data.room;
            });
            if (data.chat) {
              setChatMessages((prev) => {
                if (JSON.stringify(prev) === JSON.stringify(data.chat)) return prev;
                return data.chat;
              });
            }
          }
        }
      } catch (err) {
        // silent sync fallback
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentRoom?.id]);

  // Join room socket when room changes
  useEffect(() => {
    if (currentRoom && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'join_room_socket', roomId: currentRoom.id }));
    }
  }, [currentRoom?.id]);

  const handleCreateRoom = async (gameType: GameType, isPrivate: boolean) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameType,
          hostId: currentUser.id,
          isPrivate,
        }),
      });
      const room = await res.json();
      setCurrentRoom(room);
      setActiveTab('hub');
    } catch (err) {
      alert('خطا در ایجاد اتاق جدید');
    }
  };

  const handleJoinRoomCode = async (code: string) => {
    if (!currentUser || !code) return;
    try {
      const res = await fetch('/api/rooms/join-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId: currentUser.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'ورود به اتاق ناموفق بود');
        return;
      }
      const room = await res.json();
      setCurrentRoom(room);
      setActiveTab('hub');
    } catch (err) {
      alert('خطا در پیوستن به اتاق');
    }
  };

  const handleQuickMatch = async (gameType: GameType) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/rooms/quick-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType, userId: currentUser.id }),
      });
      const data = await res.json();
      setCurrentRoom(data.room);
      setActiveTab('hub');
    } catch (err) {
      alert('خطا در پیدا کردن حریف سریع');
    }
  };

  const handlePlayVsBot = async (gameType: GameType) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/rooms/vs-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameType,
          userId: currentUser.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'خطا در ایجاد بازی با ربات');
        return;
      }
      const room = await res.json();
      setCurrentRoom(room);
      setActiveTab('hub');
    } catch (err) {
      alert('خطا در شروع بازی تک‌نفره با ربات');
    }
  };

  const handleStartGame = async (roomId: string) => {
    try {
      await fetch(`/api/rooms/${roomId}/start`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };

  const handleMakeMove = async (roomId: string, moveType: string, details: any) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/rooms/${roomId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          moveType,
          details,
        }),
      });
    } catch (err) {
      console.error('Move error:', err);
    }
  };

  const handleSendChatMessage = async (roomId: string, text: string) => {
    if (!currentUser || !text.trim()) return;
    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          senderId: currentUser.id,
          senderName: currentUser.displayName,
          text,
        }),
      });
    } catch (err) {
      console.error('Chat error:', err);
    }
  };

  const handleLeaveRoom = async (roomId: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/rooms/${roomId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      setCurrentRoom(null);
      setChatMessages([]);
    } catch (err) {
      console.error('Leave room error:', err);
    }
  };

  const handleSubmitReport = async (reportedUserId: string, category: ReportCategory, description: string) => {
    if (!currentUser) return;
    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: currentUser.id,
          reportedUserId,
          category,
          description,
          roomId: currentRoom?.id,
        }),
      });
      alert('گزارش شما با موفقیت ثبت شد و توسط مدیریت بررسی می‌شود.');
    } catch (err) {
      alert('خطا در ثبت گزارش');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        stats={stats}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1">
        {activeTab === 'simulator' && currentUser && (
          <TelegramSimulator
            currentUser={currentUser}
            onLaunchGame={(roomId) => {
              if (roomId) handleJoinRoomCode(roomId);
              setActiveTab('hub');
            }}
            onOpenAdmin={() => setActiveTab('admin')}
            onOpenProfile={() => setIsProfileOpen(true)}
          />
        )}

        {activeTab === 'hub' && currentUser && (
          <WebGameHub
            currentUser={currentUser}
            currentRoom={currentRoom}
            chatMessages={chatMessages}
            onStartGame={handleStartGame}
            onMakeMove={handleMakeMove}
            onSendChatMessage={handleSendChatMessage}
            onCreateRoom={handleCreateRoom}
            onJoinRoomCode={handleJoinRoomCode}
            onQuickMatch={handleQuickMatch}
            onPlayVsBot={handlePlayVsBot}
            onLeaveRoom={handleLeaveRoom}
            onOpenReportModal={(targetUserId) => setReportedUserId(targetUserId)}
          />
        )}

        {activeTab === 'admin' && currentUser && (
          <AdminPanel currentUser={currentUser} />
        )}

        {activeTab === 'docs' && <DocsView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        پلتفرم آنلاین گیمینگ تلگرام • تمام حقوق محفوظ است © ۱۴۰۵
      </footer>

      {/* Profile Modal */}
      {isProfileOpen && currentUser && (
        <ProfileModal
          user={currentUser}
          onClose={() => setIsProfileOpen(false)}
        />
      )}

      {/* Report Modal */}
      {reportedUserId && (
        <ReportModal
          reportedUserId={reportedUserId}
          onClose={() => setReportedUserId(null)}
          onSubmitReport={handleSubmitReport}
        />
      )}

    </div>
  );
}
