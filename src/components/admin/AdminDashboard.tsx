import React, { useEffect, useState } from 'react';
import {
  Video as VideoIcon,
  Users,
  Unlock,
  Eye,
  Send,
  PlusCircle,
  Download,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DashboardMetrics, Video, ActivityLog } from '../../types';
import { safeFetchJson } from '../../utils/api';

interface AdminDashboardProps {
  token: string;
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, onNavigate }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    safeFetchJson<{
      metrics?: DashboardMetrics;
      recentVideos?: Video[];
      recentActivity?: ActivityLog[];
    }>('/api/analytics/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        if (data.metrics) {
          setMetrics(data.metrics);
          setRecentVideos(data.recentVideos || []);
          setRecentActivity(data.recentActivity || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load dashboard:', err);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        ড্যাশবোর্ড ডেটা লোড হচ্ছে...
      </div>
    );
  }

  const statCards = [
    {
      label: 'মোট ভিডিও (Total Videos)',
      value: metrics?.totalVideos || 0,
      sub: `${metrics?.publishedVideos || 0} প্রকাশিত &bull; ${metrics?.draftVideos || 0} ড্রাফট`,
      icon: VideoIcon,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      label: 'আনলক করা ভিডিও (Unlocked Videos)',
      value: metrics?.unlockedVideos || 0,
      sub: 'সফলভাবে সম্পন্ন হওয়া ভিডিও অ্যাক্সেস',
      icon: Unlock,
      color: 'from-emerald-600 to-teal-600',
    },
    {
      label: 'বিজ্ঞাপন ভিউ (Total Ad Views)',
      value: metrics?.totalAdViews || 0,
      sub: `${metrics?.adUnlockRequests || 0} টি রিকোয়েস্টের মধ্যে`,
      icon: Eye,
      color: 'from-purple-600 to-pink-600',
    },
    {
      label: 'টেলিগ্রাম বট স্ট্যাটাস (Bot Status)',
      value: metrics?.telegramBotStatus?.toUpperCase() || 'ONLINE',
      sub: 'ওয়েবহুক সক্রিয় ও কানেক্টেড',
      icon: Send,
      color: 'from-sky-500 to-blue-600',
    },
    {
      label: 'মোট ভিজিটর/ইউজার (Total Users)',
      value: metrics?.totalUsers || 0,
      sub: 'সক্রিয় ভিজিটর সেশন',
      icon: Users,
      color: 'from-amber-500 to-orange-600',
    },
    {
      label: 'সক্রিয় বিজ্ঞাপন ইউনিট (Active Ads)',
      value: metrics?.activeAds || 0,
      sub: 'Monetag, Bengal Ads, Banners',
      icon: Layers,
      color: 'from-fuchsia-600 to-rose-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-purple-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            রিয়েল-টাইম অ্যাডমিন ড্যাশবোর্ড
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">স্বাগতম, অ্যাডমিনিস্ট্রেটর!</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            ভিডিও কন্টেন্ট, মাল্টি-পার্ট ভিডিও, বিজ্ঞাপন নেটওয়ার্ক ও ব্লুগার থিম এক স্থান থেকেই পরিচালনা করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('videos')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs shadow-md shadow-pink-500/30 flex items-center gap-2 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন ভিডিও যোগ করুন</span>
          </button>
          <a
            href="/api/theme/download"
            download
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Blogger XML (.xml)</span>
          </a>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  {card.label}
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {card.value}
                </span>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5" dangerouslySetInnerHTML={{ __html: card.sub }} />
              </div>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Recent Videos & Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Videos */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <VideoIcon className="w-4 h-4 text-purple-500" />
              <span>সাম্প্রতিক ভিডিও সমূহ (Recent Videos)</span>
            </h3>
            <button
              onClick={() => onNavigate('videos')}
              className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline"
            >
              সবগুলো দেখুন &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {recentVideos.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">কোনো ভিডিও পাওয়া যায়নি।</p>
            ) : (
              recentVideos.map((vid) => (
                <div
                  key={vid.id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <img
                    src={vid.thumbnailUrl}
                    alt={vid.title}
                    className="w-16 h-10 rounded-lg object-cover bg-slate-800 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {vid.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-500 font-semibold">
                        {vid.category}
                      </span>
                      <span>👁 {vid.views}</span>
                      <span>🔒 {vid.requiredAds} ads</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Logs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>অ্যাডমিন অ্যাক্টিভিটি লগ (Audit Logs)</span>
            </h3>
            <button
              onClick={() => onNavigate('logs')}
              className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline"
            >
              সব দেখুন &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">কোনো লগ নেই।</p>
            ) : (
              recentActivity.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {log.action} &bull; <span className="text-purple-500">{log.target}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {log.details}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
