import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, Eye, Smartphone, Monitor } from 'lucide-react';
import { BannerAd } from '../../types';
import { safeFetchJson } from '../../utils/api';

interface BannerManagerProps {
  token: string;
}

export const BannerManager: React.FC<BannerManagerProps> = ({ token }) => {
  const [banners, setBanners] = useState<BannerAd[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBanner, setEditingBanner] = useState<Partial<BannerAd> | null>(null);

  const fetchBanners = () => {
    safeFetchJson<{ banners: BannerAd[] }>('/api/ads/banners', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        setBanners(data.banners || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load banners:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBanners();
  }, [token]);

  const handleOpenCreate = () => {
    setEditingBanner({
      name: '',
      code: '<div style="background:#1e1b4b;color:#fff;padding:12px;text-align:center;border-radius:8px;">স্পনসরড ব্যানার বিজ্ঞাপন</div>',
      placement: 'header',
      device: 'all',
      status: 'active',
      priority: 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: BannerAd) => {
    setEditingBanner({ ...b });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner || !editingBanner.name || !editingBanner.code) return;

    try {
      const isUpdating = Boolean(editingBanner.id);
      const url = isUpdating ? `/api/ads/banners/${editingBanner.id}` : '/api/ads/banners';
      const method = isUpdating ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingBanner),
      });

      if (!res.ok) throw new Error('ব্যানার সংরক্ষণে সমস্যা হয়েছে');
      setIsModalOpen(false);
      setEditingBanner(null);
      fetchBanners();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত "${name}" ব্যানারটি ডিলিট করতে চান?`)) return;

    try {
      const res = await fetch(`/api/ads/banners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('ডিলিট করা যায়নি');
      fetchBanners();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            ব্যানার অ্যাড ম্যানেজমেন্ট (Banner Ads)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            হেডার, ভিডিওর উপরে/নিচে, পোস্টের মধ্যে এবং ফুটার ব্যানার বিজ্ঞাপন পরিচালনা করুন।
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs shadow-md shadow-pink-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন ব্যানার তৈরি করুন</span>
        </button>
      </div>

      {/* Banner list */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">লোড হচ্ছে...</div>
        ) : banners.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">কোনো ব্যানার নেই।</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">ব্যানারের নাম</th>
                  <th className="py-3 px-4">প্লেসমেন্ট (Placement)</th>
                  <th className="py-3 px-4">ডিভাইস টার্গেট</th>
                  <th className="py-3 px-4">প্রায়োরিটি</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {banners.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {b.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold font-mono text-[10px]">
                        {b.placement}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 capitalize">
                      {b.device}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      #{b.priority}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          b.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-purple-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id, b.name)}
                          className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingBanner.id ? 'ব্যানার সম্পাদন' : 'নতুন ব্যানার অ্যাড'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ব্যানারের নাম (Name) *
                </label>
                <input
                  type="text"
                  required
                  value={editingBanner.name || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, name: e.target.value })}
                  placeholder="যেমন: Header Top 728x90"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    প্লেসমেন্ট (Placement)
                  </label>
                  <select
                    value={editingBanner.placement || 'header'}
                    onChange={(e) => setEditingBanner({ ...editingBanner, placement: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="header">Header</option>
                    <option value="below_header">Below Header</option>
                    <option value="above_video">Above Video</option>
                    <option value="between_posts">Between Posts</option>
                    <option value="inside_post">Inside Post</option>
                    <option value="below_video">Below Video</option>
                    <option value="footer">Footer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    টার্গেট ডিভাইস (Device)
                  </label>
                  <select
                    value={editingBanner.device || 'all'}
                    onChange={(e) => setEditingBanner({ ...editingBanner, device: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="all">All Devices</option>
                    <option value="mobile">Mobile Only</option>
                    <option value="tablet">Tablet Only</option>
                    <option value="desktop">Desktop Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ব্যানার HTML / JS কোড (HTML/JS Code) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={editingBanner.code || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, code: e.target.value })}
                  placeholder="<div>...</div> বা <script>...</script>"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[11px] text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    স্ট্যাটাস (Status)
                  </label>
                  <select
                    value={editingBanner.status || 'active'}
                    onChange={(e) => setEditingBanner({ ...editingBanner, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    প্রায়োরিটি (Priority)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editingBanner.priority ?? 1}
                    onChange={(e) => setEditingBanner({ ...editingBanner, priority: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-md shadow-pink-500/20"
                >
                  সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
