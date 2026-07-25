import React, { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import { ReportCategory } from '../types/index';

interface ReportModalProps {
  reportedUserId: string;
  onClose: () => void;
  onSubmitReport: (reportedUserId: string, category: ReportCategory, description: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  reportedUserId,
  onClose,
  onSubmitReport,
}) => {
  const [category, setCategory] = useState<ReportCategory>('abuse');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    onSubmitReport(reportedUserId, category, description);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
        
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">ثبت گزارش تخلف کاربر</h3>
            <p className="text-xs text-slate-400">شناسه کاربر متخلف: {reportedUserId}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              نوع و دسته‌بندی تخلف:
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReportCategory)}
              className="w-full bg-slate-950 text-slate-200 text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-rose-500"
            >
              <option value="spam">ارسال اسپم یا پیام‌های مکرر (Spam)</option>
              <option value="cheating">تقلب یا دستکاری در بازی (Cheating)</option>
              <option value="abuse">توهین، فحاشی یا پیام نامناسب (Abuse)</option>
              <option value="language">زبان رکیک و توهین‌آمیز (Offensive Language)</option>
              <option value="fake_account">حساب کاربری جعلی یا مشکوک (Fake Account)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              توضیحات تکمیلی گزارش:
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="لطفاً جزییات تخلف صورت گرفته را توضیح دهید..."
              rows={3}
              required
              className="w-full bg-slate-950 text-slate-200 text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-rose-500 placeholder-slate-600"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg shadow-rose-600/20"
          >
            ثبت نهایی گزارش برای بررسی تیم مدیریت
          </button>
        </form>

      </div>
    </div>
  );
};
