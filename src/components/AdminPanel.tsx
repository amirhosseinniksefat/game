import React, { useState, useEffect } from 'react';
import {
  AdminConfig,
  PlatformStats,
  UserProfile,
  UserReport,
  GameRoom,
} from '../types/index';
import {
  ShieldCheck,
  Key,
  Users,
  Gamepad2,
  AlertTriangle,
  Send,
  Database,
  Radio,
  Ban,
  CheckCircle2,
  XCircle,
  Eye,
  Coins,
  Trophy,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: UserProfile;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<
    'settings' | 'users' | 'rooms' | 'reports' | 'broadcast' | 'roadmap'
  >('settings');

  const [botToken, setBotToken] = useState('');
  const [adminId, setAdminId] = useState('');
  const [databaseUrl, setDatabaseUrl] = useState('');
  const [redisUrl, setRedisUrl] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  const [broadcastText, setBroadcastText] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  const fetchAdminData = async () => {
    try {
      const [resConfig, resStats, resUsers, resReports, resRooms] = await Promise.all([
        fetch('/api/admin/config').then((r) => r.json()),
        fetch('/api/admin/stats').then((r) => r.json()),
        fetch('/api/admin/users').then((r) => r.json()),
        fetch('/api/admin/reports').then((r) => r.json()),
        fetch('/api/rooms').then((r) => r.json()),
      ]);

      setConfig(resConfig);
      setStats(resStats);
      setUsers(resUsers);
      setReports(resReports);
      setRooms(resRooms);

      setBotToken(resConfig.botToken || '');
      setAdminId(resConfig.adminId || '');
      setDatabaseUrl(resConfig.databaseUrl || '');
      setRedisUrl(resConfig.redisUrl || '');
      setMaintenanceMode(resConfig.maintenanceMode || false);
      setMaintenanceMessage(resConfig.maintenanceMessage || '');
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken,
          adminId,
          databaseUrl,
          redisUrl,
          maintenanceMode,
          maintenanceMessage,
        }),
      });
      if (res.ok) {
        setSaveStatus('✅ تنظیمات با موفقیت ذخیره شدند.');
        setTimeout(() => setSaveStatus(''), 3000);
        fetchAdminData();
      }
    } catch (err) {
      setSaveStatus('❌ خطا در ذخیره تنظیمات.');
    }
  };

  const handleUserAction = async (userId: string, action: 'ban' | 'unban' | 'mute') => {
    try {
      await fetch('/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      fetchAdminData();
    } catch (err) {
      console.error('User action error:', err);
    }
  };

  const handleReportAction = async (reportId: string, status: 'reviewed' | 'dismissed') => {
    try {
      await fetch('/api/admin/reports/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status }),
      });
      fetchAdminData();
    } catch (err) {
      console.error('Report action error:', err);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastText.trim()) return;
    try {
      await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: broadcastText }),
      });
      setBroadcastText('');
      alert('اعلان همگانی با موفقیت ارسال شد!');
    } catch (err) {
      alert('خطا در ارسال اعلان همگانی');
    }
  };

  const handleForceEndRoom = async (roomId: string) => {
    try {
      await fetch('/api/admin/force-end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
      fetchAdminData();
    } catch (err) {
      console.error('Force end error:', err);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.id.includes(userSearchQuery)
  );

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      
      {/* Top Admin Banner */}
      <div className="bg-zinc-900 border border-amber-500/40 rounded-sm p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-tight">داشبورد مدیریت تلگرام و پلتفرم گیمینگ</h2>
              <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2.5 py-0.5 rounded-sm border border-amber-500/30 font-mono font-bold uppercase">
                سطح دسترسی ادمین
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              مدیریت تنظیمات ربات، کاربران، اتاق‌ها، گزارشات تخلف و حالت تعمیرات
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3.5 py-2 rounded-sm border border-zinc-700 flex items-center gap-2 transition-colors font-bold uppercase tracking-wider"
        >
          <RefreshCw className="w-4 h-4 text-amber-400" />
          <span>به‌روزرسانی داده‌ها</span>
        </button>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm text-center">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">کل کاربران</span>
          <span className="text-xl font-mono font-black text-white mt-1 block">{stats?.totalUsers || 0}</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm text-center">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">کاربران آنلاین</span>
          <span className="text-xl font-mono font-black text-emerald-400 mt-1 block">{stats?.onlineUsers || 0}</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm text-center">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">اتاق‌های فعال</span>
          <span className="text-xl font-mono font-black text-sky-400 mt-1 block">{stats?.activeRooms || 0}</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm text-center">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">مجموع بازی‌ها</span>
          <span className="text-xl font-mono font-black text-amber-400 mt-1 block">{stats?.totalGamesPlayed || 0}</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">گزارشات معلق</span>
          <span className="text-xl font-mono font-black text-rose-400 mt-1 block">{stats?.pendingReportsCount || 0}</span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto bg-zinc-900 p-1.5 rounded-sm border border-zinc-800 text-xs no-scrollbar">
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-4 py-2 rounded-sm font-bold transition-all whitespace-nowrap uppercase tracking-wider ${
            activeSubTab === 'settings'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          ⚙️ تنظیمات اصلی و .env
        </button>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 rounded-sm font-bold transition-all whitespace-nowrap uppercase tracking-wider ${
            activeSubTab === 'users'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          👥 مدیریت کاربران ({users.length})
        </button>
        <button
          onClick={() => setActiveSubTab('rooms')}
          className={`px-4 py-2 rounded-sm font-bold transition-all whitespace-nowrap uppercase tracking-wider ${
            activeSubTab === 'rooms'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          🚪 اتاق‌های بازی ({rooms.length})
        </button>
        <button
          onClick={() => setActiveSubTab('reports')}
          className={`px-4 py-2 rounded-sm font-bold transition-all whitespace-nowrap uppercase tracking-wider ${
            activeSubTab === 'reports'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          ⚠️ گزارشات تخلف ({reports.length})
        </button>
        <button
          onClick={() => setActiveSubTab('broadcast')}
          className={`px-4 py-2 rounded-sm font-bold transition-all whitespace-nowrap uppercase tracking-wider ${
            activeSubTab === 'broadcast'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          📢 پیام همگانی
        </button>
        <button
          onClick={() => setActiveSubTab('roadmap')}
          className={`px-4 py-2 rounded-sm font-bold transition-all whitespace-nowrap uppercase tracking-wider ${
            activeSubTab === 'roadmap'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          🚀 معماری توسعه آینده
        </button>
      </div>

      {/* SUB TAB 1: SETTINGS */}
      {activeSubTab === 'settings' && (
        <form onSubmit={handleSaveConfig} className="bg-zinc-900 border border-zinc-800 rounded-sm p-6 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide">
            <SlidersHorizontal className="w-5 h-5 text-amber-400" />
            <span>تنظیمات عمومی پلتفرم و حالت تعمیرات</span>
          </h3>

          {saveStatus && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-sm font-bold">
              {saveStatus}
            </div>
          )}

          {/* Info banner about .env configuration */}
          <div className="p-4 bg-[#050505] border border-zinc-800 rounded-sm space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Key className="w-4 h-4" />
              <span>پیکربندی متغیرهای محیطی (.env)</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              اطلاعات حساس سرور (شامل توکن ربات تلگرام، آیدی عددی ادمین، اتصال دیتابیس PostgreSQL و Redis) مستقیماً از فایل <code className="text-amber-300 font-mono">.env</code> خوانده می‌شوند تا امنیت سرور حفظ شود و نیازی به وارد کردن مجدد در پنل نباشد.
            </p>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">حالت تعمیرات و نگهداری (MAINTENANCE_MODE)</h4>
                <p className="text-xs text-zinc-400">
                  در صورت فعال‌سازی، دسترسی تمام کاربران غیرمدیر به بازی‌ها مسدود می‌شود.
                </p>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-5 h-5 accent-amber-500 cursor-pointer"
              />
            </div>

            {maintenanceMode && (
              <textarea
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="پیام تعمیرات..."
                rows={2}
                className="w-full bg-[#050505] text-zinc-100 text-xs p-3 rounded-sm border border-zinc-800 focus:outline-none focus:border-amber-500"
              />
            )}
          </div>

          <button
            type="submit"
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-6 py-3 rounded-sm transition-all uppercase tracking-wider"
          >
            ذخیره تغییرات پیکربندی
          </button>
        </form>
      )}

      {/* SUB TAB 2: USERS */}
      {activeSubTab === 'users' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white uppercase tracking-wide">مدیریت کاربران پلتفرم</h3>
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="جستجو نام، آیدی یا یوزرنیم..."
              className="bg-[#050505] text-zinc-100 text-xs px-3 py-2 rounded-sm border border-zinc-800 w-60"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#050505] text-zinc-400 font-bold border-b border-zinc-800">
                <tr>
                  <th className="p-3 uppercase">شناسه / یوزرنیم</th>
                  <th className="p-3 uppercase">نام نمایش</th>
                  <th className="p-3 uppercase">بازی / برد / باخت</th>
                  <th className="p-3 uppercase">درصد برد</th>
                  <th className="p-3 uppercase">وضعیت</th>
                  <th className="p-3 uppercase">عملیات مدیریت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/40">
                    <td className="p-3 font-mono text-zinc-300">
                      {u.telegramId} (@{u.username})
                    </td>
                    <td className="p-3 font-bold text-zinc-100">{u.displayName}</td>
                    <td className="p-3 font-mono text-zinc-300">
                      {u.gamesPlayed} / {u.wins} / {u.losses}
                    </td>
                    <td className="p-3 text-emerald-400 font-mono font-bold">{u.winRate}%</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-sm text-[10px] font-bold font-mono uppercase ${
                          u.status === 'banned'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : u.status === 'muted'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {u.status === 'banned' ? 'مسدود' : u.status === 'muted' ? 'سکوت' : 'فعال'}
                      </span>
                    </td>
                    <td className="p-3 flex items-center gap-2">
                      {u.status === 'banned' ? (
                        <button
                          onClick={() => handleUserAction(u.id, 'unban')}
                          className="bg-emerald-600 text-white px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase"
                        >
                          رفع مسدودیت
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction(u.id, 'ban')}
                          className="bg-rose-600 text-white px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase"
                        >
                          مسدود کردن
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB TAB 3: ROOMS */}
      {activeSubTab === 'rooms' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-white uppercase tracking-wide">لیست اتاق‌های بازی آنلاین</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((r) => (
              <div key={r.id} className="bg-[#050505] p-4 rounded-sm border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold font-mono text-sm text-white">اتاق {r.code}</span>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-sm border border-emerald-500/20 font-bold">
                      {r.gameType === 'tictactoe' ? 'دوز' : r.gameType === 'ludo' ? 'منچ' : 'مار و پله'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">
                    بازیکنان: ({r.players.length}/{r.maxPlayers}) | وضعیت: {r.status}
                  </p>
                </div>
                <button
                  onClick={() => handleForceEndRoom(r.id)}
                  className="bg-rose-600/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-sm text-xs font-bold hover:bg-rose-600 hover:text-white transition-colors uppercase"
                >
                  خاتمه اجباری
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB TAB 4: REPORTS */}
      {activeSubTab === 'reports' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-white uppercase tracking-wide">گزارشات تخلف ارسال‌شده توسط کاربران</h3>
          <div className="space-y-3">
            {reports.map((rep) => (
              <div key={rep.id} className="bg-[#050505] p-4 rounded-sm border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-zinc-200">
                      گزارش‌دهنده: {rep.reporterName} ➔ متخلف: {rep.reportedUserName}
                    </span>
                    <span className="bg-rose-500/20 text-rose-400 text-[10px] px-2 py-0.5 rounded-sm border border-rose-500/30 font-bold uppercase">
                      دسته‌بندی: {rep.category}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{rep.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReportAction(rep.id, 'reviewed')}
                    className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-sm font-bold uppercase"
                  >
                    تایید و بررسی
                  </button>
                  <button
                    onClick={() => handleReportAction(rep.id, 'dismissed')}
                    className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-sm font-bold uppercase border border-zinc-700"
                  >
                    رد کردن
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB TAB 5: BROADCAST */}
      {activeSubTab === 'broadcast' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-white uppercase tracking-wide">ارسال پیام همگانی (Broadcast)</h3>
          <p className="text-xs text-zinc-400">
            پیام زیر به صورت همزمان در تمام اتاق‌های فعال و وب‌اپ بازی به عنوان اعلان رسمی نمایش داده می‌شود.
          </p>
          <textarea
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            placeholder="متن پیام همگانی..."
            rows={4}
            className="w-full bg-[#050505] text-zinc-100 text-xs p-4 rounded-sm border border-zinc-800 focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={handleSendBroadcast}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-6 py-3 rounded-sm transition-all flex items-center gap-2 uppercase tracking-wider"
          >
            <Send className="w-4 h-4" />
            <span>ارسال پیام همگانی الان</span>
          </button>
        </div>
      )}

      {/* SUB TAB 6: ROADMAP */}
      {activeSubTab === 'roadmap' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide">
            <Radio className="w-5 h-5 text-amber-400" />
            <span>معماری و دیتابیس آماده برای ویژگی‌های آینده</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#050505] p-4 rounded-sm border border-zinc-800">
              <h4 className="text-xs font-bold text-amber-400 mb-1 uppercase tracking-wider">🪙 اقتصاد و سکه (Coins & Store)</h4>
              <p className="text-[11px] text-zinc-400">
                جدول Coins و Inventory در دیتابیس آماده است. پاداش برد، خرید پوسته و تاس‌های اختصاصی.
              </p>
            </div>

            <div className="bg-[#050505] p-4 rounded-sm border border-zinc-800">
              <h4 className="text-xs font-bold text-sky-400 mb-1 uppercase tracking-wider">🏆 تورنمنت و لیگ‌ها (Tournaments)</h4>
              <p className="text-[11px] text-zinc-400">
                ساختار حذفی و گروهی، رتبه‌بندی هفتگی و فصل‌های رقابتی (Ranked Seasons).
              </p>
            </div>

            <div className="bg-[#050505] p-4 rounded-sm border border-zinc-800">
              <h4 className="text-xs font-bold text-emerald-400 mb-1 uppercase tracking-wider">👑 اشتراک ویژه (Premium & Clans)</h4>
              <p className="text-[11px] text-zinc-400">
                سیستم کلن‌ها و گروه‌های بازی، اشتراک پریمیوم بدون تبلیغ با مزایای ویژوال.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
