import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
  CheckCircle2,
  XCircle,
  ExternalLink,
  X,
  Play,
  Clock,
  Sparkles,
  ShieldAlert,
  FolderOpen,
  Image,
  Copy,
  Check,
  Youtube,
  Tv,
} from 'lucide-react';
import { Video, VideoPart } from '../../types';
import { MediaGalleryModal } from './MediaGalleryModal';
import { safeFetchJson } from '../../utils/api';

interface VideoManagerProps {
  token: string;
}

export const VideoManager: React.FC<VideoManagerProps> = ({ token }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [copiedBloggerId, setCopiedBloggerId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Gallery Modal
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [galleryTarget, setGalleryTarget] = useState<'video' | 'image' | 'both'>('both');
  const [galleryContext, setGalleryContext] = useState<'post_from_gallery' | 'main_video' | 'main_thumb' | 'part_video'>('post_from_gallery');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingVideo, setEditingVideo] = useState<Partial<Video> | null>(null);
  const [isPartsModalOpen, setIsPartsModalOpen] = useState<boolean>(false);
  const [selectedVideoForParts, setSelectedVideoForParts] = useState<Video | null>(null);

  // New Part Form
  const [newPartTitle, setNewPartTitle] = useState<string>('');
  const [newPartUrl, setNewPartUrl] = useState<string>('');
  const [newPartDuration, setNewPartDuration] = useState<string>('02:30');
  const [newPartAds, setNewPartAds] = useState<number>(3);
  const [newPartAdProvider, setNewPartAdProvider] = useState<'all' | 'Monetag' | 'Bengal Ads' | 'GigaPub' | 'AdsGram'>('all');

  const handleGallerySelect = (media: { url: string; title?: string; duration?: string; thumbnailUrl?: string; type: 'video' | 'image'; category?: string }) => {
    if (galleryContext === 'post_from_gallery') {
      setEditingVideo({
        title: media.title || 'গ্যালারি থেকে সংগৃহীত নতুন ভিডিও',
        description: 'অসাধারণ কোয়ালিটি ও এক্সক্লুসিভ কালেকশন। সম্পূর্ণ ভিডিও উপভোগ করতে বিজ্ঞাপন সম্পন্ন করুন।',
        thumbnailUrl: media.thumbnailUrl || (media.type === 'image' ? media.url : 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=640&q=80'),
        category: media.category || 'Trending',
        videoUrl: media.type === 'video' ? media.url : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: media.duration || '03:45',
        status: 'published',
        featured: false,
        requiredAds: 3,
        adProvider: 'all',
      });
      setIsEditModalOpen(true);
    } else if (galleryContext === 'main_video') {
      setEditingVideo((prev) => (prev ? { ...prev, videoUrl: media.url, duration: media.duration || prev.duration || '03:45' } : null));
    } else if (galleryContext === 'main_thumb') {
      setEditingVideo((prev) => (prev ? { ...prev, thumbnailUrl: media.thumbnailUrl || media.url } : null));
    } else if (galleryContext === 'part_video') {
      setNewPartUrl(media.url);
      if (media.duration) setNewPartDuration(media.duration);
      if (media.title && !newPartTitle) setNewPartTitle(media.title);
    }
    setIsGalleryOpen(false);
  };

  const handleOpenGalleryForPost = () => {
    setGalleryTarget('both');
    setGalleryContext('post_from_gallery');
    setIsGalleryOpen(true);
  };

  const handleOpenGalleryForVideo = () => {
    setGalleryTarget('video');
    setGalleryContext('main_video');
    setIsGalleryOpen(true);
  };

  const handleOpenGalleryForThumb = () => {
    setGalleryTarget('image');
    setGalleryContext('main_thumb');
    setIsGalleryOpen(true);
  };

  const handleOpenGalleryForPart = () => {
    setGalleryTarget('video');
    setGalleryContext('part_video');
    setIsGalleryOpen(true);
  };

  const fetchVideos = () => {
    setLoading(true);
    let url = '/api/videos?';
    if (filterCategory !== 'all') url += `category=${encodeURIComponent(filterCategory)}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;

    safeFetchJson<{ videos: Video[] }>(url)
      .then((data) => {
        setVideos(data.videos || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load videos:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchVideos();
  }, [filterCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVideos();
  };

  // Open Create/Edit modal
  const handleOpenCreate = () => {
    setEditingVideo({
      title: '',
      description: '',
      thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=640&q=80',
      category: 'Trending',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      duration: '03:45',
      status: 'published',
      featured: false,
      requiredAds: 3,
      adProvider: 'all',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (v: Video) => {
    setEditingVideo({ ...v });
    setIsEditModalOpen(true);
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo || !editingVideo.title) return;

    try {
      const isUpdating = Boolean(editingVideo.id);
      const url = isUpdating ? `/api/videos/${editingVideo.id}` : '/api/videos';
      const method = isUpdating ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingVideo),
      });

      if (!res.ok) throw new Error('ভিডিও সংরক্ষণে সমস্যা হয়েছে');
      setIsEditModalOpen(false);
      setEditingVideo(null);
      showToast('ভিডিও সফলভাবে সংরক্ষিত হয়েছে!');
      fetchVideos();
    } catch (err: any) {
      showToast(err.message || 'ভিডিও সংরক্ষণে ত্রুটি হয়েছে');
    }
  };

  const handleDeleteVideo = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('ডিলিট ব্যর্থ হয়েছে');
      showToast(`"${title}" ভিডিওটি ডিলিট হয়েছে`);
      fetchVideos();
    } catch (err: any) {
      showToast(err.message || 'ডিলিটে সমস্যা হয়েছে');
    }
  };

  const handleTogglePublish = async (v: Video) => {
    const newStatus = v.status === 'published' ? 'draft' : 'published';
    try {
      await fetch(`/api/videos/${v.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchVideos();
    } catch (err) {
      console.error(err);
    }
  };

  // Open Parts Management
  const handleOpenParts = (v: Video) => {
    setSelectedVideoForParts(v);
    setIsPartsModalOpen(true);
  };

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideoForParts || !newPartTitle) return;

    try {
      const res = await fetch(`/api/videos/${selectedVideoForParts.id}/parts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          partTitle: newPartTitle,
          videoUrl: newPartUrl || selectedVideoForParts.videoUrl,
          duration: newPartDuration,
          requiredAds: newPartAds,
          adProvider: newPartAdProvider,
        }),
      });

      if (!res.ok) throw new Error('অংশ যুক্ত করা যায়নি');

      // Refresh
      const updatedData = await safeFetchJson<{ video: Video }>(`/api/videos/${selectedVideoForParts.id}`);
      setSelectedVideoForParts(updatedData.video);
      setNewPartTitle('');
      showToast('ভিডিও পর্ব সফলভাবে যোগ হয়েছে!');
      fetchVideos();
    } catch (err: any) {
      showToast(err.message || 'অংশ যুক্ত করা যায়নি');
    }
  };

  const handleDeletePart = async (partId: string) => {
    if (!selectedVideoForParts) return;
    try {
      await fetch(`/api/videos/${selectedVideoForParts.id}/parts/${partId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast('পর্ব ডিলিট হয়েছে');
      // Refresh
      const updatedData = await safeFetchJson<{ video: Video }>(`/api/videos/${selectedVideoForParts.id}`);
      setSelectedVideoForParts(updatedData.video);
      fetchVideos();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-xs shadow-xl animate-fade-in flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            ভিডিও ম্যানেজমেন্ট (Video Management)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            নতুন ভিডিও যোগ, এডিট, মাল্টি-পার্ট ম্যানেজমেন্ট ও অ্যাড রিকোয়ারমেন্ট নির্ধারণ করুন।
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenGalleryForPost}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-300 font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-purple-500" />
            <span>গ্যালারি থেকে পোস্ট করুন</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs shadow-md shadow-pink-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ভিডিও যুক্ত করুন</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ভিডিওর শিরোনাম দিয়ে সার্চ করুন..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500"
            />
          </div>
          <button type="submit" className="px-3 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">ক্যাটাগরি:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
          >
            <option value="all">সকল ক্যাটাগরি</option>
            <option value="Trending">Trending</option>
            <option value="Viral">Viral</option>
            <option value="Bangladeshi">Bangladeshi</option>
            <option value="Indian">Indian</option>
            <option value="University">University</option>
            <option value="College">College</option>
            <option value="TikTok">TikTok</option>
            <option value="News">News</option>
          </select>
        </div>
      </div>

      {/* Video Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">ভিডিও তালিকা লোড হচ্ছে...</div>
        ) : videos.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">কোনো ভিডিও পাওয়া যায়নি।</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">ভিডিও ও থাম্বনেইল</th>
                  <th className="py-3 px-4">ক্যাটাগরি</th>
                  <th className="py-3 px-4">দৈর্ঘ্য</th>
                  <th className="py-3 px-4">অ্যাড রিকোয়ার্ড</th>
                  <th className="py-3 px-4">মাল্টি-পার্ট</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {videos.map((vid) => (
                  <tr key={vid.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={vid.thumbnailUrl}
                          alt={vid.title}
                          className="w-14 h-9 rounded-md object-cover bg-slate-800 flex-shrink-0"
                        />
                        <div className="max-w-xs">
                          <h4 className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                            {vid.title}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            ভিউ: {vid.views} &bull; লাইক: {vid.likes}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold text-[10px]">
                        {vid.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{vid.duration}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                          🔒 {vid.requiredAds} ads
                        </span>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                          {vid.adProvider && vid.adProvider !== 'all' ? vid.adProvider : '৪টি নেটওয়ার্ক'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleOpenParts(vid)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-semibold hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>{vid.parts ? vid.parts.length : 0} Parts</span>
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleTogglePublish(vid)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                          vid.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {vid.status === 'published' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{vid.status === 'published' ? 'Published' : 'Draft'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(vid)}
                          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-purple-600 transition-colors"
                          title="Edit Video"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVideo(vid.id, vid.title)}
                          className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 transition-colors"
                          title="Delete Video"
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

      {/* MODAL: ADD / EDIT VIDEO */}
      {isEditModalOpen && editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingVideo.id ? 'ভিডিও সম্পাদনা (Edit Video)' : 'নতুন ভিডিও যুক্ত করুন (Add Video)'}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ভিডিওর শিরোনাম (Title) *
                </label>
                <input
                  type="text"
                  required
                  value={editingVideo.title || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  placeholder="ভিডিওর শিরোনাম দিন..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ক্যাটাগরি (Category)
                  </label>
                  <select
                    value={editingVideo.category || 'Trending'}
                    onChange={(e) => setEditingVideo({ ...editingVideo, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Trending">Trending</option>
                    <option value="Viral">Viral</option>
                    <option value="Bangladeshi">Bangladeshi</option>
                    <option value="Indian">Indian</option>
                    <option value="University">University</option>
                    <option value="College">College</option>
                    <option value="TikTok">TikTok</option>
                    <option value="News">News</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    সময়কাল (Duration)
                  </label>
                  <input
                    type="text"
                    value={editingVideo.duration || '03:45'}
                    onChange={(e) => setEditingVideo({ ...editingVideo, duration: e.target.value })}
                    placeholder="03:45"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    থাম্বনেইল ইমেজ URL (Thumbnail URL)
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenGalleryForThumb}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 transition-colors cursor-pointer"
                  >
                    <Image className="w-3.5 h-3.5" />
                    <span>গ্যালারি থেকে বাছুন</span>
                  </button>
                </div>
                <input
                  type="url"
                  value={editingVideo.thumbnailUrl || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, thumbnailUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    ভিডিও লিঙ্ক / Embed URL (YouTube/MP4/Iframe)
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenGalleryForVideo}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 transition-colors cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>গ্যালারি থেকে ভিডিও বাছুন</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={editingVideo.videoUrl || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, videoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />

                {/* YouTube 16:9 Video Play Box Live Preview */}
                {editingVideo.videoUrl && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-red-400 font-bold">
                        <Youtube className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                        <span>YouTube 16:9 Play Box Preview (ইউটিউব ১৬:৯ প্রিভিউ)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-red-600/20 text-red-300 font-semibold text-[10px] border border-red-500/30">
                        16:9 Ratio
                      </span>
                    </div>

                    <div className="relative w-full aspect-[16/9] min-h-[220px] sm:min-h-[260px] bg-black rounded-xl overflow-hidden border border-white/10 shadow-lg flex items-center justify-center">
                      {(() => {
                        const url = editingVideo.videoUrl || '';
                        const isDirect =
                          url.startsWith('data:video/') ||
                          url.startsWith('blob:') ||
                          url.includes('/api/videos/') ||
                          Boolean(url.match(/\.(mp4|webm|ogg|m4v|mov|m3u8)($|\?)/i));
                        if (isDirect) {
                          return (
                            <video
                              src={url}
                              controls
                              className="w-full h-full object-contain bg-black"
                            />
                          );
                        }
                        const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
                        const embedUrl = ytMatch && ytMatch[1]
                          ? `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=0&rel=0`
                          : url;
                        return (
                          <iframe
                            src={embedUrl}
                            title="YouTube 16:9 Box Preview"
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        );
                      })()}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>সাইজ: YouTube 16:9 Widescreen (1080p Standard)</span>
                      <span>রেশিও: ১৬:৯ অটো-স্কেলিং</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    আনলকে প্রয়োজনীয় বিজ্ঞাপন (Required Ads)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={editingVideo.requiredAds ?? 3}
                    onChange={(e) => setEditingVideo({ ...editingVideo, requiredAds: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                  <span className="text-[10px] text-slate-400">০ দিলে ফ্রি হিসেবে চলবে</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    বিজ্ঞাপন নেটওয়ার্ক (Ad Network)
                  </label>
                  <select
                    value={editingVideo.adProvider || 'all'}
                    onChange={(e) => setEditingVideo({ ...editingVideo, adProvider: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="all">৪টি নেটওয়ার্ক অটো-রোটেশন (System Default)</option>
                    <option value="Monetag">Monetag (সব কয়টি অ্যাড Monetag থেকে)</option>
                    <option value="Bengal Ads">Bengal Ads (সব কয়টি অ্যাড Bengal Ads থেকে)</option>
                    <option value="GigaPub">GigaPub (সব কয়টি অ্যাড GigaPub থেকে)</option>
                    <option value="AdsGram">AdsGram (সব কয়টি অ্যাড AdsGram থেকে)</option>
                  </select>
                  <span className="text-[10px] text-purple-500">নির্দিষ্ট ১টি নেটওয়ার্ক থেকে আনলক করাতে পারেন</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  স্ট্যাটাস (Publish Status)
                </label>
                <select
                  value={editingVideo.status || 'published'}
                  onChange={(e) => setEditingVideo({ ...editingVideo, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  বিবরণ (Description)
                </label>
                <textarea
                  rows={3}
                  value={editingVideo.description || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                  placeholder="ভিডিও সম্পর্কে সংক্ষিপ্ত বিবরণ..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-md shadow-pink-500/20"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MULTI-PART VIDEO MANAGER */}
      {isPartsModalOpen && selectedVideoForParts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-500" />
                  <span>মাল্টি-পার্ট ভিডিও পরিচালনা</span>
                </h3>
                <span className="text-xs text-slate-500 truncate max-w-sm block">
                  {selectedVideoForParts.title}
                </span>
              </div>
              <button onClick={() => setIsPartsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of existing parts */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                বিদ্যমান ভিডিও পর্বসমূহ ({selectedVideoForParts.parts?.length || 0}):
              </span>
              {(!selectedVideoForParts.parts || selectedVideoForParts.parts.length === 0) ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
                  এখনো কোনো পর্ব যোগ করা হয়নি।
                </div>
              ) : (
                selectedVideoForParts.parts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        Part {p.partNumber}: {p.partTitle}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>সময়: {p.duration} &bull; আনলক অ্যাড: {p.requiredAds} ads</span>
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 font-semibold border border-purple-500/20">
                          {p.adProvider || selectedVideoForParts.adProvider || 'Auto'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePart(p.id)}
                      className="p-1.5 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete part"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add new part form */}
            <form onSubmit={handleAddPart} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <span className="font-bold text-slate-900 dark:text-white block">
                নতুন পর্ব যোগ করুন (Add Part)
              </span>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">পর্বের নাম (Part Title) *</label>
                <input
                  type="text"
                  required
                  value={newPartTitle}
                  onChange={(e) => setNewPartTitle(e.target.value)}
                  placeholder="যেমন: পর্ব ২ - ক্লাইম্যাক্স সিন"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-600 dark:text-slate-400">ভিডিও URL / Embed Link</label>
                  <button
                    type="button"
                    onClick={handleOpenGalleryForPart}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 transition-colors cursor-pointer"
                  >
                    <FolderOpen className="w-3 h-3" />
                    <span>গ্যালারি থেকে নিন</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={newPartUrl}
                  onChange={(e) => setNewPartUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">দৈর্ঘ্য</label>
                  <input
                    type="text"
                    value={newPartDuration}
                    onChange={(e) => setNewPartDuration(e.target.value)}
                    placeholder="02:30"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">প্রয়োজনীয় বিজ্ঞাপন</label>
                  <input
                    type="number"
                    min={0}
                    value={newPartAds}
                    onChange={(e) => setNewPartAds(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">বিজ্ঞাপন নেটওয়ার্ক (Ad Network for this part)</label>
                <select
                  value={newPartAdProvider}
                  onChange={(e) => setNewPartAdProvider(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                >
                  <option value="all">অটো-রোটেশন (সব কয়টি নেটওয়ার্ক)</option>
                  <option value="Monetag">Monetag (SmartLink &amp; Zone 11699704)</option>
                  <option value="Bengal Ads">Bengal Ads (বাংলাদেশী স্পন্সর)</option>
                  <option value="GigaPub">GigaPub (গ্লোবাল নেটওয়ার্ক)</option>
                  <option value="AdsGram">AdsGram (টেলিগ্রাম ও ওয়েব রিওয়ার্ড)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors cursor-pointer"
              >
                + পর্বটি সেভ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Media Gallery Modal */}
      <MediaGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={handleGallerySelect}
        targetType={galleryTarget}
      />
    </div>
  );
};
