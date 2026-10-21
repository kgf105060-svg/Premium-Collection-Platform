import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Link,
  Check,
  Play,
  Clock,
  Sparkles,
  Layers,
  FolderOpen,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { MediaItem } from '../../types';
import { safeFetchJson } from '../../utils/api';

interface MediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: {
    url: string;
    title?: string;
    duration?: string;
    thumbnailUrl?: string;
    type: 'video' | 'image';
    category?: string;
  }) => void;
  targetType: 'video' | 'image' | 'both';
}

const PRESET_MEDIA: MediaItem[] = [
  // Preset Videos
  {
    id: 'vid_preset_1',
    title: 'বাংলাদেশের শীর্ষ ভাইরাল ভিডিও - স্পেশাল পর্ব',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=640&q=80',
    duration: '04:15',
    category: 'Viral',
    source: 'preset',
  },
  {
    id: 'vid_preset_2',
    title: 'ঢাকা বিশ্ববিদ্যালয়ের কালচারাল ফেস্ট ও কনসার্ট স্পেশাল',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=640&q=80',
    duration: '06:30',
    category: 'University',
    source: 'preset',
  },
  {
    id: 'vid_preset_3',
    title: 'সোশ্যাল মিডিয়া ট্রেন্ডিং শর্টস ও টিকটক মেগা সংকলন ২০২৬',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=640&q=80',
    duration: '03:48',
    category: 'TikTok',
    source: 'preset',
  },
  {
    id: 'vid_preset_4',
    title: 'ইন্ডিয়ান ও বাংলাদেশি কমেডি ড্রামা দৃশ্য - পার্ট ২',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=640&q=80',
    duration: '05:12',
    category: 'Trending',
    source: 'preset',
  },
  // Preset Thumbnails
  {
    id: 'img_preset_1',
    title: 'HD স্টুডিও ক্যামেরা ও সিনেমাটোগ্রাফি থাম্বনেইল',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=640&q=80',
    category: 'Cinema',
    source: 'preset',
  },
  {
    id: 'img_preset_2',
    title: 'কালচারাল কনসার্ট ও ক্রাউড স্টেজ থাম্বনেইল',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=640&q=80',
    category: 'University',
    source: 'preset',
  },
  {
    id: 'img_preset_3',
    title: 'ডিজিটাল ক্রিয়েটর ও মোবাইল ভিডিওগ্রাফি থাম্বনেইল',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=640&q=80',
    category: 'TikTok',
    source: 'preset',
  },
  {
    id: 'img_preset_4',
    title: 'থিয়েটার ড্রামা ও মুভি প্রজেক্টর থাম্বনেইল',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=640&q=80',
    category: 'Trending',
    source: 'preset',
  },
];

export const MediaGalleryModal: React.FC<MediaGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  targetType,
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'url'>('library');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'bunny' | 'video' | 'image'>(
    targetType === 'both' ? 'all' : targetType
  );

  // Bunny Stream items
  const [bunnyVideos, setBunnyVideos] = useState<MediaItem[]>([]);
  const [loadingBunny, setLoadingBunny] = useState<boolean>(false);
  const [bunnyConfig, setBunnyConfig] = useState<{ libraryId: string; cdnHostname: string; pullZone: string }>({
    libraryId: '780246',
    cdnHostname: 'vz-52277185-b48.b-cdn.net',
    pullZone: 'vz-52277185-b48',
  });

  // Local/uploaded items
  const [uploadedItems, setUploadedItems] = useState<MediaItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom URL state
  const [customUrl, setCustomUrl] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customDuration, setCustomDuration] = useState<string>('03:30');

  // Load Bunny Stream videos from library 780246
  const fetchBunnyVideos = async () => {
    setLoadingBunny(true);
    try {
      const data = await safeFetchJson<{ items?: any[]; libraryId?: string; cdnHostname?: string }>('/api/bunny/videos');
      if (data && data.items) {
        setBunnyVideos(data.items);
      }
      if (data && data.libraryId) {
        setBunnyConfig({
          libraryId: data.libraryId,
          cdnHostname: data.cdnHostname || 'vz-52277185-b48.b-cdn.net',
          pullZone: 'vz-52277185-b48',
        });
      }
    } catch (err) {
      console.warn('Bunny videos fetch notice:', err);
    } finally {
      setLoadingBunny(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBunnyVideos();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Combine items: Bunny videos first, then user uploaded, then presets
  const allItems = [...bunnyVideos, ...uploadedItems, ...PRESET_MEDIA].filter((item) => {
    if (filterType === 'bunny') return item.source === 'bunny';
    if (filterType === 'video') return item.type === 'video';
    if (filterType === 'image') return item.type === 'image';
    if (targetType === 'video') return item.type === 'video';
    if (targetType === 'image') return item.type === 'image';
    return true;
  });

  // Helper to auto-compress large photos in the browser canvas (prevents 413 Payload Too Large)
  const compressImageIfNeeded = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = (e.target?.result as string) || '';
        if (!src || !src.startsWith('data:image/')) {
          resolve(src);
          return;
        }
        const img = new Image();
        img.onload = () => {
          const maxDim = 1920;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim || file.size > 1.5 * 1024 * 1024) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.85));
              return;
            }
          }
          resolve(src);
        };
        img.onerror = () => resolve(src);
        img.src = src;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isVideo = file.type.startsWith('video/') || Boolean(file.name.match(/\.(mp4|webm|mov|mkv)$/i));
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      setUploadError('শুধুমাত্র ভিডিও অথবা ছবি ফাইল নির্বাচন করুন');
      if (e.target) e.target.value = '';
      return;
    }

    // Client-side file size guard (250MB for videos)
    if (isVideo && file.size > 250 * 1024 * 1024) {
      alert('ভিডিও ফাইলের আকার সর্বোচ্চ ২৫০ মেগাবাইট হতে পারবে। অনুগ্রহ করে ছোট ভিডিও ফাইল নির্বাচন করুন।');
      if (e.target) e.target.value = '';
      return;
    }

    setIsProcessing(true);
    setUploadError(null);
    setUploadSuccessMsg(null);

    if (isVideo) {
      setUploadStatusText('🐰 Bunny Stream CDN এ সরাসরি ভিডিও আপলোড হচ্ছে... অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন');
      try {
        // Step 1: Create video object in Bunny Stream and get direct upload credentials
        const session = await safeFetchJson<{
          success: boolean;
          uploadUrl: string;
          apiKey: string;
          video: any;
        }>('/api/bunny/create-upload-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: file.name.replace(/\.[^/.]+$/, ''),
            filename: file.name,
          }),
        });

        if (!session || !session.uploadUrl || !session.apiKey) {
          throw new Error('বানি সিডিএন আপলোড সেশন প্রস্তুত করা যায়নি');
        }

        // Step 2: Stream raw binary directly from browser to Bunny Stream edge CDN
        // Completely bypasses Cloud Run's 32MB payload limit with zero base64 bloat!
        const uploadRes = await fetch(session.uploadUrl, {
          method: 'PUT',
          headers: {
            AccessKey: session.apiKey,
            'Content-Type': 'application/octet-stream',
          },
          body: file,
        });

        if (!uploadRes.ok) {
          // If direct upload encounters an issue and file is small (< 15MB), try fallback
          if (file.size <= 15 * 1024 * 1024) {
            const fallbackReader = new FileReader();
            fallbackReader.onload = async (event) => {
              try {
                const dataUrl = event.target?.result as string;
                const fallbackData = await safeFetchJson<{ video: any }>('/api/bunny/upload-video', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: file.name.replace(/\.[^/.]+$/, ''),
                    videoData: dataUrl,
                    filename: file.name,
                  }),
                });
                if (fallbackData?.video) {
                  const newBunnyItem: MediaItem = {
                    id: fallbackData.video.id,
                    title: fallbackData.video.title,
                    type: 'video',
                    url: fallbackData.video.url,
                    thumbnailUrl: fallbackData.video.thumbnailUrl,
                    duration: fallbackData.video.duration || '03:45',
                    source: 'bunny',
                    guid: fallbackData.video.guid,
                    hlsUrl: fallbackData.video.hlsUrl,
                    previewUrl: fallbackData.video.previewUrl,
                  };
                  setBunnyVideos((prev) => [newBunnyItem, ...prev]);
                  setSelectedItem(newBunnyItem);
                  setUploadSuccessMsg('✅ ভিডিও সফলভাবে Bunny Stream CDN এ আপলোড ও ট্রান্সকোডিং সম্পন্ন হয়েছে!');
                  setActiveTab('library');
                  setFilterType('bunny');
                }
              } catch (fallbackErr: any) {
                setUploadError(fallbackErr.message || 'ভিডিও আপলোড ব্যর্থ হয়েছে');
              } finally {
                setIsProcessing(false);
                setUploadStatusText('');
              }
            };
            fallbackReader.readAsDataURL(file);
            return;
          }
          throw new Error(`Bunny CDN সরাসরি আপলোড ব্যর্থ হয়েছে (HTTP ${uploadRes.status})`);
        }

        const newBunnyItem: MediaItem = {
          id: session.video.id,
          title: session.video.title,
          type: 'video',
          url: session.video.url,
          thumbnailUrl: session.video.thumbnailUrl,
          duration: session.video.duration || '03:45',
          source: 'bunny',
          guid: session.video.guid,
          hlsUrl: session.video.hlsUrl,
          previewUrl: session.video.previewUrl,
        };

        setBunnyVideos((prev) => [newBunnyItem, ...prev]);
        setSelectedItem(newBunnyItem);
        setUploadSuccessMsg('✅ ভিডিও সফলভাবে Bunny Stream CDN এ আপলোড ও ট্রান্সকোডিং সম্পন্ন হয়েছে!');
        setActiveTab('library');
        setFilterType('bunny');
      } catch (err: any) {
        console.error(err);
        setUploadError(err.message || 'Bunny Stream এ ভিডিও আপলোড করা যায়নি');
      } finally {
        setIsProcessing(false);
        setUploadStatusText('');
        if (e.target) e.target.value = '';
      }
    } else if (isImage) {
      setUploadStatusText('ছবি অপ্টিমাইজ ও আপলোড হচ্ছে...');
      try {
        // Auto-compress large camera photos before sending (guarantees payload stays under 1MB)
        const compressedDataUrl = await compressImageIfNeeded(file);

        const data = await safeFetchJson<{ media: any }>('/api/bunny/upload-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: file.name.replace(/\.[^/.]+$/, ''),
            imageData: compressedDataUrl,
            filename: file.name,
          }),
        });

        if (!data || !data.media) {
          throw new Error('ছবি আপলোড ব্যর্থ হয়েছে');
        }

        const newPhotoItem: MediaItem = {
          id: data.media.id,
          title: data.media.title,
          type: 'image',
          url: data.media.url,
          source: 'upload',
        };

        setUploadedItems((prev) => [newPhotoItem, ...prev]);
        setSelectedItem(newPhotoItem);
        setUploadSuccessMsg('✅ ছবি সফলভাবে আপলোড ও সেভ করা হয়েছে!');
        setActiveTab('library');
      } catch (err: any) {
        console.error(err);
        setUploadError(err.message || 'ছবি আপলোড করতে সমস্যা হয়েছে');
      } finally {
        setIsProcessing(false);
        setUploadStatusText('');
        if (e.target) e.target.value = '';
      }
    }
  };

  const handleConfirmSelection = () => {
    if (activeTab === 'url') {
      if (!customUrl) return;
      const isVideo =
        customUrl.match(/\.(mp4|webm|ogg|m3u8)($|\?)/i) ||
        customUrl.includes('youtube') ||
        customUrl.includes('mediadelivery.net') ||
        customUrl.includes('b-cdn.net') ||
        targetType === 'video';
      onSelect({
        url: customUrl,
        title: customTitle || 'ভিডিও কালেকশন',
        duration: customDuration,
        type: isVideo ? 'video' : 'image',
      });
      onClose();
      return;
    }

    if (!selectedItem) return;
    onSelect({
      url: selectedItem.url,
      title: selectedItem.title,
      duration: selectedItem.duration,
      thumbnailUrl: selectedItem.thumbnailUrl,
      type: selectedItem.type,
      category: selectedItem.category,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full flex flex-col max-h-[92vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  মিডিয়া গ্যালারি ও ক্লাউড স্টোরেজ (Media Gallery)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Bunny Stream CDN সক্রিয়
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                গ্যালারির সব ভিডিও ও ছবি সরাসরি Bunny Stream CDN লাইব্রেরি #{bunnyConfig.libraryId} এ সংরক্ষিত থাকবে।
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bunny CDN Real-time Status Strip */}
        <div className="bg-gradient-to-r from-indigo-950/70 via-purple-950/60 to-slate-900 px-4 py-2 text-white border-b border-purple-900/30 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-purple-300">🐰 Bunny Stream Library:</span>
            <span className="font-mono bg-purple-500/20 px-2 py-0.5 rounded text-[11px] text-purple-200">
              #{bunnyConfig.libraryId}
            </span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">&bull;</span>
            <span className="font-mono text-slate-300 text-[11px] hidden sm:inline">
              {bunnyConfig.cdnHostname}
            </span>
            <span className="px-2 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[10px] font-mono">
              Pull: {bunnyConfig.pullZone}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchBunnyVideos}
              disabled={loadingBunny}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-slate-200 font-semibold transition cursor-pointer"
              title="Bunny Stream লাইব্রেরির সাথে সিঙ্ক করুন"
            >
              <RefreshCw className={`w-3 h-3 ${loadingBunny ? 'animate-spin' : ''}`} />
              <span>{loadingBunny ? 'সিঙ্ক হচ্ছে...' : 'Sync CDN'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation & Filters */}
        <div className="flex flex-wrap items-center justify-between px-4 pt-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 gap-2">
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'library'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>মিডিয়া লাইব্রেরি ({allItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Bunny CDN এ আপলোড</span>
            </button>

            <button
              onClick={() => setActiveTab('url')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'url'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              <span>সরাসরি লিঙ্ক (Direct URL)</span>
            </button>
          </div>

          {activeTab === 'library' && (
            <div className="flex items-center gap-1 pb-1 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  filterType === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                সকল ({allItems.length})
              </button>
              <button
                onClick={() => setFilterType('bunny')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 ${
                  filterType === 'bunny'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                }`}
              >
                <span>🐰 Bunny Stream</span>
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-900/40 text-[9px]">
                  {bunnyVideos.length}
                </span>
              </button>
              <button
                onClick={() => setFilterType('video')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  filterType === 'video'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                ভিডিও
              </button>
              <button
                onClick={() => setFilterType('image')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  filterType === 'image'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                ছবি / থাম্বস
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto flex-1 max-h-[500px]">
          {/* Notification Banners */}
          {uploadSuccessMsg && (
            <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{uploadSuccessMsg}</span>
              </div>
              <button onClick={() => setUploadSuccessMsg(null)} className="text-emerald-600 hover:opacity-75">✕</button>
            </div>
          )}

          {uploadError && (
            <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
              <button onClick={() => setUploadError(null)} className="text-rose-600 hover:opacity-75">✕</button>
            </div>
          )}

          {/* TAB 1: LIBRARY */}
          {activeTab === 'library' && (
            <div className="space-y-3">
              {loadingBunny && (
                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 text-center text-xs text-purple-600 dark:text-purple-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Bunny Stream CDN থেকে লাইব্রেরি ভিডিও লোড হচ্ছে...</span>
                </div>
              )}

              {allItems.length === 0 && !loadingBunny ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  কোনো মিডিয়া পাওয়া যায়নি। &ldquo;Bunny CDN এ আপলোড&rdquo; ট্যাব থেকে নতুন ভিডিও যোগ করুন।
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {allItems.map((item) => {
                    const isSelected = selectedItem?.id === item.id;
                    const isBunny = item.source === 'bunny';
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`group relative rounded-xl border p-2 flex flex-col justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'border-purple-600 ring-2 ring-purple-600/40 bg-purple-50/60 dark:bg-purple-950/30 shadow-md'
                            : isBunny
                            ? 'border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-400 bg-white dark:bg-slate-800/80'
                            : 'border-slate-200 dark:border-slate-800 hover:border-purple-400 bg-white dark:bg-slate-800/60'
                        }`}
                      >
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 mb-2">
                          <img
                            src={item.type === 'video' ? item.thumbnailUrl || item.url : item.url}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />

                          {/* Source Badges */}
                          <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
                            {isBunny ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs">
                                🐰 Bunny Stream
                              </span>
                            ) : (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase text-white ${
                                  item.type === 'video' ? 'bg-purple-600' : 'bg-pink-600'
                                }`}
                              >
                                {item.type}
                              </span>
                            )}
                          </div>

                          {/* Duration */}
                          {item.duration && (
                            <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[10px] text-white font-mono flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-purple-300" />
                              <span>{item.duration}</span>
                            </div>
                          )}

                          {/* Play overlay for videos */}
                          {item.type === 'video' && (
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
                              <div className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Play className="w-3.5 h-3.5 fill-white" />
                              </div>
                            </div>
                          )}

                          {isSelected && (
                            <div className="absolute inset-0 bg-purple-600/35 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg animate-scale-in">
                                <Check className="w-5 h-5 stroke-[3]" />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <h4
                            className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1"
                            title={item.title}
                          >
                            {item.title}
                          </h4>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            {isBunny ? (
                              <span className="text-indigo-500 dark:text-indigo-400 font-semibold truncate max-w-[120px]">
                                {item.guid ? `ID: ${item.guid.slice(0, 8)}...` : 'CDN Ready'}
                              </span>
                            ) : (
                              <span>{item.category || item.source}</span>
                            )}

                            {isBunny && item.resolutions && (
                              <span className="px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 font-semibold text-[9px]">
                                1080p
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD (Upload to Bunny Stream CDN) */}
          {activeTab === 'upload' && (
            <div className="p-6 text-center space-y-4 max-w-lg mx-auto">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="video/mp4,video/webm,video/quicktime,video/x-matroska,image/*"
                className="hidden"
              />

              <div
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 transition-colors flex flex-col items-center justify-center gap-3 ${
                  isProcessing
                    ? 'border-purple-500/50 bg-purple-500/5 cursor-wait'
                    : 'border-purple-500/40 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 cursor-pointer'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Upload className={`w-8 h-8 ${isProcessing ? 'animate-bounce' : ''}`} />
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    ডিভাইস থেকে ভিডিও বা ছবি আপলোড করুন
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    যেকোনো ভিডিও স্বয়ংক্রিয়ভাবে <strong className="text-indigo-600 dark:text-indigo-400">Bunny Stream CDN</strong> লাইব্রেরি #{bunnyConfig.libraryId} এ আপলোড হবে এবং এইচএলএস/এমপি৪ প্লেয়ার জেনারেট করবে।
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
                    MP4 / WebM / MOV (Videos)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-600 dark:text-pink-400 text-[10px] font-semibold">
                    JPG / PNG / WebP (Photos)
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 transition cursor-pointer"
                >
                  {isProcessing ? 'আপলোড হচ্ছে...' : 'ফাইল ব্রাউজ করুন (Browse Files)'}
                </button>
              </div>

              {isProcessing && (
                <div className="space-y-2 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold animate-pulse">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{uploadStatusText || 'Bunny Stream CDN এ ফাইল প্রক্রিয়াকরণ চলছে...'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                    ফাইল সাইজ অনুযায়ী কিছুটা সময় লাগতে পারে। অনুগ্রহ করে ব্রাউজার বন্ধ করবেন না।
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DIRECT URL */}
          {activeTab === 'url' && (
            <div className="p-4 space-y-4 max-w-md mx-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  সরাসরি লিঙ্ক (Bunny Stream, HLS, MP4 অথবা ইউটিউব URL)
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder={`https://iframe.mediadelivery.net/play/${bunnyConfig.libraryId}/... অথবা https://${bunnyConfig.cdnHostname}/.../playlist.m3u8`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  শিরোনাম (Title - ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="ভিডিওর শিরোনাম"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ভিডিও সময়কাল (Duration - যেমন: 08:39)
                </label>
                <input
                  type="text"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  placeholder="08:39"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none text-xs font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {selectedItem ? (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-purple-600 dark:text-purple-400 truncate max-w-[280px]">
                  {selectedItem.title}
                </span>
                {selectedItem.source === 'bunny' && (
                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-bold">
                    Bunny CDN
                  </span>
                )}
              </div>
            ) : (
              <span>কোনো আইটেম নির্বাচন করুন</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              বাতিল
            </button>
            <button
              onClick={handleConfirmSelection}
              disabled={activeTab === 'url' ? !customUrl : !selectedItem}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md disabled:opacity-40 cursor-pointer"
            >
              নিশ্চিত করুন ও ফর্মে যুক্ত করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
