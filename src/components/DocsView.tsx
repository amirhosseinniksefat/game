import React from 'react';
import { BookOpen, Server, Database, Shield, Gamepad2, Radio, Code2, Layers, Cpu } from 'lucide-react';

export const DocsView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white">
            مستندات کامل معماری پلتفرم بازی آنلاین تلگرام
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          این پروژه به صورت کاملاً ماژولار، مقیاس‌پذیر و آماده تولید (Production-Ready) بر پایه‌ی معماری Server-Authoritative طراحی شده است.
        </p>
      </div>

      {/* Tech Stack Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
          <Server className="w-6 h-6 text-sky-400" />
          <h3 className="text-sm font-bold text-white">بک‌اند و سرور (Backend)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Node.js، Express/NestJS، TypeScript، REST API و WebSocket جهت همگام‌سازی آنلاین بازی‌ها در زمان واقعی.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
          <Database className="w-6 h-6 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">دیتابیس و حافظه (Database)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            PostgreSQL با Prisma ORM جهت ذخیره‌سازی داده‌ها و سیستم Redis جهت کشینگ سریع جلسات و صف Matchmaking.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
          <Shield className="w-6 h-6 text-amber-400" />
          <h3 className="text-sm font-bold text-white">امنیت و نظارت (Security)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            محدودکننده نرخ (Rate Limiting)، اعتبارسنجی سمت سرور، سیستم آنتی‌اسپم، گزارش‌گیری و پنل مدیریت کامل.
          </p>
        </div>
      </div>

      {/* Database Schema Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          <span>جداول و ساختار دیتابیس (Schema)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <span className="font-bold text-sky-400 block mb-1">Users & Profiles</span>
            <span className="text-slate-400">ذخیره مشخصات، آمار، برد/باخت، درصد برد و سکه‌ها</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <span className="font-bold text-emerald-400 block mb-1">Games & Rooms</span>
            <span className="text-slate-400">اتاق‌های عمومی و خصوصی، کد اختصاصی، وضعیت نوبت‌ها</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <span className="font-bold text-amber-400 block mb-1">Friends & Invites</span>
            <span className="text-slate-400">سیستم لیست دوستان، بلاک کاربری و لینک‌های دعوت</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <span className="font-bold text-rose-400 block mb-1">Reports & Moderation</span>
            <span className="text-slate-400">ثبت گزارشات تخلف، اسپم، تقلب و پنل بررسی مدیر</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <span className="font-bold text-indigo-400 block mb-1">Chat & Notifications</span>
            <span className="text-slate-400">چت زنده بازی‌ها و اعلانات سیستم</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <span className="font-bold text-purple-400 block mb-1">Future Economy & Clans</span>
            <span className="text-slate-400">آماده‌سازی لیدربورد، تورنمنت‌ها، سکه و فروشگاه</span>
          </div>
        </div>
      </div>

    </div>
  );
};
