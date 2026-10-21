import React, { useState, useEffect } from 'react';
import { Users, Shield, CheckCircle, Ban, Eye, Unlock } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

interface UserItem {
  id: string;
  ip: string;
  userAgent: string;
  totalUnlocks: number;
  adViews: number;
  createdAt: string;
  status: 'active' | 'blocked';
}

interface UserManagerProps {
  token: string;
}

export const UserManager: React.FC<UserManagerProps> = ({ token }) => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    safeFetchJson<{ users: UserItem[] }>('/api/analytics/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load users:', err);
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          ইউজার ম্যানেজমেন্ট (User Sessions & Activity)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          ওয়েবসাইটের সক্রিয় ভিজিটর, তাদের আনলক হিস্টোরি এবং অ্যাডভিউ ট্র্যাক করুন।
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">লোড হচ্ছে...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">কোনো ইউজার রেকর্ড নেই।</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">ইউজার আইডি</th>
                  <th className="py-3 px-4">আইপি ঠিকানা (IP)</th>
                  <th className="py-3 px-4">ডিভাইস / ব্রাউজার</th>
                  <th className="py-3 px-4">মোট আনলক</th>
                  <th className="py-3 px-4">বিজ্ঞাপন দর্শন (Ad Views)</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {u.id}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {u.ip}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={u.userAgent}>
                      {u.userAgent}
                    </td>
                    <td className="py-3 px-4 font-bold text-purple-600 dark:text-purple-400">
                      {u.totalUnlocks}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                      {u.adViews}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          u.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {u.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                        <span>{u.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
