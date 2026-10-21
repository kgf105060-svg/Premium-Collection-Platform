import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, ArrowRight, Key } from 'lucide-react';
import { AdminUser } from '../../types';
import { safeFetchJson } from '../../utils/api';

interface AdminLoginProps {
  onLoginSuccess: (token: string, admin: AdminUser) => void;
  onBackToApp?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToApp }) => {
  const [email, setEmail] = useState<string>('kgf105060@gmail.com');
  const [password, setPassword] = useState<string>('Akash@12');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await safeFetchJson<{ token: string; admin: AdminUser }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      // Store token
      localStorage.setItem('premium_admin_token', data.token);
      onLoginSuccess(data.token, data.admin);
    } catch (err: any) {
      setError(err.message || 'নেটওয়ার্ক বা সার্ভার সমস্যা');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[600px] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        <div className="text-center mb-6">
          {onBackToApp && (
            <div className="flex justify-start mb-2">
              <button
                type="button"
                onClick={onBackToApp}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                ← ভিডিও অ্যাপে ফিরে যান
              </button>
            </div>
          )}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-pink-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-pink-500/30">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            অ্যাডমিন প্যানেল লগইন
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            প্রিমিয়াম কালেকশন অ্যাডমিনিস্ট্রেশন ও ভিডিও ম্যানেজমেন্ট
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              অ্যাডমিন ইমেল (Email)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kgf105060@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              পাসওয়ার্ড (Password)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'যাচাই করা হচ্ছে...' : 'লগইন করুন (Secure Sign In)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
