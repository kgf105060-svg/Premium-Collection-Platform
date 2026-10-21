import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Eye, ThumbsUp, Unlock } from 'lucide-react';
import { Video } from '../../types';
import { safeFetchJson } from '../../utils/api';

interface VideoAnalyticsProps {
  token: string;
}

export const VideoAnalytics: React.FC<VideoAnalyticsProps> = ({ token }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<string>('views');

  useEffect(() => {
    setLoading(true);
    safeFetchJson<{ videos: Video[] }>(`/api/analytics/videos?sortBy=${sortBy}&order=desc`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        setVideos(data.videos || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load video analytics:', err);
        setLoading(false);
      });
  }, [sortBy, token]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            ভিডিও অ্যানালিটিক্স (Video Analytics)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ভিডিওর ভিউ, আনলক হার, লাইক ও বিজ্ঞাপনের পারফরম্যান্স ট্র্যাক করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">বাছাই করুন (Sort By):</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none"
          >
            <option value="views">সর্বাধিক ভিউ (Most Viewed)</option>
            <option value="likes">সর্বাধিক লাইক (Most Liked)</option>
            <option value="newest">সর্বশেষ প্রকাশিত (Newest)</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">অ্যানালিটিক্স লোড হচ্ছে...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">ভিডিও</th>
                  <th className="py-3 px-4">ক্যাটাগরি</th>
                  <th className="py-3 px-4">মোট ভিউ</th>
                  <th className="py-3 px-4">লাইক</th>
                  <th className="py-3 px-4">প্রয়োজনীয় অ্যাড</th>
                  <th className="py-3 px-4">আনুমানিক আনলক</th>
                  <th className="py-3 px-4">সম্পন্নতার হার</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {videos.map((v) => {
                  const estUnlocks = Math.round(v.views * 0.18);
                  const completionRate = Math.min(95, Math.round(65 + (v.likes % 25)));
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={v.thumbnailUrl}
                            alt={v.title}
                            className="w-12 h-8 rounded object-cover bg-slate-800 flex-shrink-0"
                          />
                          <span className="font-semibold text-slate-900 dark:text-white line-clamp-1 max-w-xs">
                            {v.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold text-[10px]">
                          {v.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {v.views.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {v.likes.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-purple-600 dark:text-purple-400">
                        {v.requiredAds} Ads
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {estUnlocks.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {completionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
