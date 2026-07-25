import React, { useState } from 'react';
import { UserProfile } from '../types/index';
import { X, Trophy, Users, Shield, Copy, Check, UserPlus, UserCheck, Share2 } from 'lucide-react';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onAddFriend?: (friendId: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  onClose,
  onAddFriend,
}) => {
  const [friendIdInput, setFriendIdInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const inviteLink = `https://t.me/GameCenterBot?start=ref_${user.telegramId}`;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* User Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-sky-500/20">
            {user.displayName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{user.displayName}</h3>
              <span className="bg-sky-500/10 text-sky-400 text-xs px-2.5 py-0.5 rounded-full border border-sky-500/20 font-medium">
                {user.rank}
              </span>
            </div>
            <p className="text-xs text-slate-400">@{user.username} • شناسه: {user.telegramId}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
          <div>
            <span className="text-[10px] text-slate-400 block">بازی‌ها</span>
            <span className="text-sm font-bold text-white">{user.gamesPlayed}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">بردها</span>
            <span className="text-sm font-bold text-emerald-400">{user.wins}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">باخت‌ها</span>
            <span className="text-sm font-bold text-rose-400">{user.losses}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">درصد برد</span>
            <span className="text-sm font-bold text-amber-400">{user.winRate}%</span>
          </div>
        </div>

        {/* Coins & Level */}
        <div className="flex items-center justify-between bg-slate-950/80 px-4 py-3 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-lg">💰</span>
            <span className="text-slate-300">موجودی سکه:</span>
            <span className="font-bold text-amber-400">{user.coins}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-300">سطح کاربری:</span>
            <span className="font-bold text-sky-400">Level {user.level}</span>
          </div>
        </div>

        {/* Share Referral Link */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-sky-400" />
            <span>لینک اختصاصی دعوت از دوستان:</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 bg-slate-900 text-slate-300 text-xs px-3 py-2 rounded-xl border border-slate-800 font-mono"
            />
            <button
              onClick={handleCopyInvite}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs px-3 py-2 rounded-xl transition-colors flex items-center gap-1 font-bold"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'کپی شد' : 'کپی'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
