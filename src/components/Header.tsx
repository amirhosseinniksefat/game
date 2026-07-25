import React from 'react';
import { Gamepad2, ShieldCheck, UserCheck, Activity, Key, BookOpen } from 'lucide-react';
import { UserProfile, PlatformStats } from '../types/index';

interface HeaderProps {
  activeTab: 'hub' | 'admin' | 'docs';
  setActiveTab: (tab: 'hub' | 'admin' | 'docs') => void;
  currentUser: UserProfile | null;
  stats: PlatformStats | null;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  stats,
  onOpenProfile,
}) => {
  return (
    <header className="bg-[#050505] border-b border-zinc-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-3">
          
          {/* Editorial Title & Branding */}
          <div className="flex flex-col">
            <span className="text-zinc-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">
              نسخه ۲.۵ — معماری سرور سرور-اتوریتیو
            </span>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase leading-none text-white">
                پلتفرم گیمینگ <span className="text-emerald-500 underline decoration-4 underline-offset-8">تلگرام</span>
              </h1>
            </div>
          </div>

          {/* Server Status Monitor & User Info */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 bg-zinc-900/80 px-3 py-1.5 rounded-sm border border-zinc-800 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>سرور فعال — {stats?.onlineUsers || 1} کاربر آنلاین</span>
            </div>

            {currentUser && (
              <div className="flex items-center gap-2">
                <div className="bg-zinc-900 px-3 py-1.5 rounded-sm border border-zinc-800 text-amber-400 font-bold">
                  💰 {currentUser.coins} ₮
                </div>
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3 py-1.5 rounded-sm border border-zinc-700 font-sans transition-colors"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold truncate max-w-[120px]">{currentUser.displayName}</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 overflow-x-auto pt-3 border-t border-zinc-900 text-xs font-bold no-scrollbar">
          <button
            onClick={() => setActiveTab('hub')}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-all whitespace-nowrap uppercase tracking-wider ${
              activeTab === 'hub'
                ? 'bg-emerald-600 text-white font-black shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 border border-transparent hover:border-zinc-800'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>پلتفرم گیمینگ و وب‌اپ</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-all whitespace-nowrap uppercase tracking-wider ${
              activeTab === 'admin'
                ? 'bg-amber-600 text-white font-black shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 border border-transparent hover:border-zinc-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>پنل مدیریت پیشرفته</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-all whitespace-nowrap uppercase tracking-wider ${
              activeTab === 'docs'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 font-black'
                : 'text-zinc-400 hover:text-zinc-200 border border-transparent hover:border-zinc-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>معماری و مستندات</span>
          </button>
        </nav>

      </div>
    </header>
  );
};
