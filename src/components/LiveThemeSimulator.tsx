import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Share2,
  Lock,
  Play,
  Check,
  Copy,
  Send,
  Mail,
  Home,
  Sun,
  Moon,
  X,
  Smartphone,
  Tablet,
  Monitor,
  Flame,
  Clock,
  ThumbsUp,
  Eye,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Download,
  Maximize2,
} from 'lucide-react';
import { Video } from '../types';
import { safeFetchJson } from '../utils/api';

interface LiveThemeSimulatorProps {
  onNavigateToAdmin?: () => void;
  onNavigateToXml?: () => void;
}

export const LiveThemeSimulator: React.FC<LiveThemeSimulatorProps> = ({
  onNavigateToAdmin,
  onNavigateToXml,
}) => {
  const [theaterMode, setTheaterMode] = useState<boolean>(false);
  const [videoFitMode, setVideoFitMode] = useState<'contain' | 'cover'>('contain');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [activePartNumber, setActivePartNumber] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [testAdProvider, setTestAdProvider] = useState<'auto' | 'Monetag' | 'Bengal Ads' | 'AdsGram' | 'GigaPub'>('auto');

  // Format video URLs to seamless 16:9 responsive embeds
  const formatVideoEmbedUrl = (url: string) => {
    if (!url) return 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1';

    // If pasted iframe HTML, extract src
    if (url.includes('<iframe')) {
      const srcMatch = url.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) url = srcMatch[1];
    }

    // Bunny Stream Player
    if (url.includes('mediadelivery.net') || url.includes('b-cdn.net')) {
      if (url.includes('iframe.mediadelivery.net') || url.includes('player.mediadelivery.net')) {
        return url.includes('autoplay') ? url : `${url}${url.includes('?') ? '&' : '?'}autoplay=true&preload=true`;
      }
      const bunnyGuidMatch = url.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
      if (bunnyGuidMatch && bunnyGuidMatch[1]) {
        return `https://iframe.mediadelivery.net/play/780246/${bunnyGuidMatch[1]}?autoplay=true&preload=true`;
      }
    }

    if (url.includes('youtube.com/embed') || url.includes('youtube-nocookie.com/embed')) {
      return url.includes('autoplay') ? url : `${url}${url.includes('?') ? '&' : '?'}autoplay=1&rel=0&modestbranding=1`;
    }
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    }

    // Google Drive file preview
    const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    if (gdriveMatch && gdriveMatch[1]) {
      return `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`;
    }

    // Dailymotion
    const dmMatch = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/i);
    if (dmMatch && dmMatch[1]) {
      return `https://www.dailymotion.com/embed/video/${dmMatch[1]}?autoplay=1`;
    }

    return url;
  };

  // Interactive Live Ad Modal State
  const [activeAd, setActiveAd] = useState<{
    isOpen: boolean;
    provider: {
      name: string;
      placement: string;
      zoneId?: string;
      blockId?: string;
      scriptUrl?: string;
      directUrl?: string;
      adFormat?: string;
      countdownSeconds?: number;
      openInNewTab?: boolean;
      note?: string;
    };
    sessionId: string;
    token: string;
    countdown: number;
    canClaim: boolean;
    openedNewTab?: boolean;
  } | null>(null);

  // Ad Unlock State
  const [unlockStatus, setUnlockStatus] = useState<{
    completedAds: number;
    requiredAds: number;
    unlocked: boolean;
    loading: boolean;
    countdown?: number;
    videoEmbedUrl?: string;
  }>({
    completedAds: 0,
    requiredAds: 3,
    unlocked: false,
    loading: false,
  });

  const categories = [
    { id: 'all', name: 'সকল (All)' },
    { id: 'Trending', name: '🔥 Trending' },
    { id: 'Viral', name: '⚡ Viral' },
    { id: 'Bangladeshi', name: '🇧🇩 Bangladeshi' },
    { id: 'Indian', name: '🇮🇳 Indian' },
    { id: 'University', name: '🎓 University' },
    { id: 'College', name: '🏫 College' },
    { id: 'TikTok', name: '🎵 TikTok' },
    { id: 'News', name: '📰 News' },
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Fetch videos
  const fetchVideos = (cat = 'all', query = '') => {
    let url = '/api/videos?';
    if (cat !== 'all') url += `category=${encodeURIComponent(cat)}&`;
    if (query) url += `search=${encodeURIComponent(query)}&`;

    safeFetchJson<{ videos: Video[] }>(url)
      .then((data) => setVideos(data.videos || []))
      .catch((err) => console.error('Failed to load videos:', err));
  };

  useEffect(() => {
    fetchVideos(selectedCategory, searchQuery);
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVideos(selectedCategory, searchQuery);
  };

  // Check unlock status when selecting a video
  const openVideoDetail = (video: Video) => {
    setSelectedVideo(video);
    setActivePartNumber(1);
    const initialRequired = typeof video.requiredAds === 'number' ? video.requiredAds : 3;
    const isFree = initialRequired === 0;
    setUnlockStatus({
      completedAds: 0,
      requiredAds: initialRequired,
      unlocked: isFree,
      loading: false,
      videoEmbedUrl: isFree ? video.videoUrl : undefined,
    });

    // Check server status
    safeFetchJson<{ completedAds: number; requiredAds: number; unlocked: boolean }>(
      `/api/unlock/status/${video.id}?partNumber=1`
    )
      .then((data) => {
        const required = typeof data.requiredAds === 'number' ? data.requiredAds : initialRequired;
        const unlocked = Boolean(data.unlocked) || required === 0;
        setUnlockStatus({
          completedAds: data.completedAds || 0,
          requiredAds: required,
          unlocked,
          loading: false,
          videoEmbedUrl: unlocked ? video.videoUrl : undefined,
        });
      })
      .catch(() => {});
  };

  // Telegram Mini App BackButton integration
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.BackButton) {
      const tgBack = (window as any).Telegram.WebApp.BackButton;
      if (selectedVideo || activeAd || drawerOpen) {
        tgBack.show();
        const handleBack = () => {
          if (activeAd) {
            setActiveAd(null);
          } else if (drawerOpen) {
            setDrawerOpen(false);
          } else if (selectedVideo) {
            setSelectedVideo(null);
          }
        };
        tgBack.onClick(handleBack);
        return () => {
          try {
            tgBack.offClick(handleBack);
          } catch (e) {}
        };
      } else {
        tgBack.hide();
      }
    }
  }, [selectedVideo, activeAd, drawerOpen]);

  // Start real server-side ad watch with specific ad provider or auto rotation
  const handleWatchAd = () => {
    if (!selectedVideo || unlockStatus.loading) return;

    setUnlockStatus((prev) => ({ ...prev, loading: true }));

    safeFetchJson('/api/unlock/start-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: selectedVideo.id,
        partNumber: activePartNumber,
        provider: testAdProvider !== 'auto' ? testAdProvider : undefined,
      }),
    })
      .then((sessionData: any) => {
        const providerInfo = sessionData.provider || {
          name: 'Monetag',
          placement: 'Direct Link / Interstitial',
          zoneId: '11699704',
          dataZone: '11699704',
          dataSdk: 'show_11699704',
          blockId: '4821',
          scriptUrl: 'https://libtl.com/sdk.js',
          directUrl: 'https://uplcm.com/4/7563307',
          countdownSeconds: 5,
        };

        const duration = Math.min(Number(providerInfo.countdownSeconds) || 5, 8);

        // If Monetag official SDK (Zone 11699704) is available
        if (providerInfo.name === 'Monetag' && typeof window !== 'undefined') {
          const monetagSdk = (window as any).show_11699704 || (providerInfo.dataSdk && (window as any)[providerInfo.dataSdk]);
          if (typeof monetagSdk === 'function') {
            try {
              monetagSdk()
                .then(() => {
                  setActiveAd((prev) => (prev ? { ...prev, countdown: 0, canClaim: true } : null));
                })
                .catch((err: any) => {
                  console.warn('Monetag interstitial SDK note:', err);
                });
            } catch (err) {
              console.warn('Monetag show_11699704 error:', err);
            }
          }
        }

        // If AdsGram official SDK is available (especially in Telegram Mini App)
        if (providerInfo.name === 'AdsGram' && typeof window !== 'undefined' && (window as any).Adsgram) {
          try {
            const adController = (window as any).Adsgram.init({
              blockId: providerInfo.blockId || '4821',
              debug: false,
            });
            adController.show()
              .then((res: any) => {
                if (res && res.done) {
                  setActiveAd((prev) => (prev ? { ...prev, countdown: 0, canClaim: true } : null));
                }
              })
              .catch((err: any) => {
                console.warn('Adsgram fallback to timer:', err);
              });
          } catch (err) {
            console.warn('Adsgram init error:', err);
          }
        }

        // Automatically attempt to open direct ad link in new tab if configured
        if (providerInfo.directUrl && providerInfo.openInNewTab !== false) {
          try {
            window.open(providerInfo.directUrl, '_blank');
          } catch (e) {
            console.warn('Popup notice: ad link ready in modal', e);
          }
        }

        // Launch full Interactive Ad Unit Modal
        setActiveAd({
          isOpen: true,
          provider: providerInfo,
          sessionId: sessionData.sessionId,
          token: sessionData.token,
          countdown: duration,
          canClaim: false,
          openedNewTab: Boolean(providerInfo.directUrl),
        });

        let remaining = duration;
        const timer = setInterval(() => {
          remaining--;
          if (remaining > 0) {
            setActiveAd((prev) => (prev ? { ...prev, countdown: remaining } : null));
          } else {
            clearInterval(timer);
            setActiveAd((prev) => (prev ? { ...prev, countdown: 0, canClaim: true } : null));
          }
        }, 1000);
      })
      .catch((err: any) => {
        setUnlockStatus((prev) => ({ ...prev, loading: false }));
        showToast(err.message || 'বিজ্ঞাপন সেশন শুরু করতে সমস্যা হয়েছে');
      });
  };

  const handleClaimAdReward = () => {
    if (!activeAd || !selectedVideo) return;

    const { sessionId, token } = activeAd;
    setActiveAd(null);

    safeFetchJson('/api/unlock/verify-ad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        token,
        videoId: selectedVideo.id,
        partNumber: activePartNumber,
      }),
    })
      .then((res: any) => {
        const isUnlocked = Boolean(res.unlocked);
        // Prioritize server streaming URL to avoid heavy base64 freezing the video player
        let resolvedUrl = res.videoEmbedUrl || selectedVideo.videoUrl;
        if (!res.videoEmbedUrl && selectedVideo.parts && selectedVideo.parts.length > 0) {
          const part = selectedVideo.parts.find((p) => p.partNumber === activePartNumber);
          if (part && part.videoUrl) {
            resolvedUrl = part.videoUrl;
          }
        }

        setUnlockStatus({
          completedAds: res.completedAds ?? 0,
          requiredAds: res.requiredAds ?? 3,
          unlocked: isUnlocked,
          loading: false,
          countdown: undefined,
          videoEmbedUrl: resolvedUrl,
        });

        if (isUnlocked) {
          showToast('✅ ভিডিও সফলভাবে আনলক হয়েছে!');
        } else {
          showToast(`বিজ্ঞাপন সম্পন্ন (${res.completedAds}/${res.requiredAds})`);
        }
      })
      .catch((err: any) => {
        setUnlockStatus((prev) => ({ ...prev, loading: false }));
        showToast(err.message || 'বিজ্ঞাপন যাচাই করতে সমস্যা হয়েছে');
      });
  };

  return (
    <div
      className={`min-h-screen relative flex flex-col font-sans transition-colors ${
        isDarkMode ? 'bg-[#0b0f19] text-[#f8fafc]' : 'bg-[#f4f5f9] text-[#0f172a]'
      }`}
    >
      {/* FULL RESPONSIVE CONTAINER - Natural mobile view and expansive desktop layout */}
      <div className="w-full flex-1 flex flex-col">
        {/* 1. STICKY HEADER */}
        <header className="sticky top-0 z-40 bg-gradient-to-r from-[#090d16] via-[#171128] to-[#2a124a] text-white px-4 sm:px-6 lg:px-8 py-3 shadow-md border-b border-white/10 w-full">
          <div className="w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setDrawerOpen(true)}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Open Menu"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>

              <div
                onClick={() => {
                  setSelectedVideo(null);
                  setSelectedCategory('all');
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-md shadow-pink-500/30 flex-shrink-0">
                  <div className="w-4 h-4 rotate-45 border-2 border-white bg-white/20" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-base leading-tight tracking-tight text-white">
                    প্রিমিয়াম কালেকশন
                  </span>
                  <span className="text-[10px] text-purple-200 font-medium tracking-wide uppercase">
                    Premium Collection Platform
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Search"
              >
                <Search className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* SEARCH DROPDOWN */}
          {searchOpen && (
            <div className="pt-3 pb-1 w-full">
                  <form onSubmit={handleSearchSubmit} className="flex items-center bg-white/10 border border-white/20 rounded-full px-3 py-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ভিডিও সার্চ করুন..."
                      className="w-full bg-transparent text-white text-xs px-2 py-1 outline-none placeholder-slate-300"
                    />
                    <button type="submit" className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold">
                      খুঁজুন
                    </button>
                  </form>
                </div>
              )}
            </header>

            {/* 2. SIDE DRAWER */}
            {drawerOpen && (
              <div className="fixed inset-0 z-50 flex">
                <div
                  className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
                  onClick={() => setDrawerOpen(false)}
                />
                <div
                  className={`relative w-72 max-w-[80vw] h-full shadow-2xl flex flex-col z-10 ${
                    isDarkMode ? 'bg-[#131b2e] text-white' : 'bg-white text-slate-900'
                  }`}
                >
                  <div className="bg-gradient-to-r from-[#090d16] via-[#171128] to-[#2a124a] text-white p-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center">
                        <div className="w-3 h-3 rotate-45 border-2 border-white" />
                      </div>
                      <span className="font-bold text-sm">প্রিমিয়াম কালেকশন</span>
                    </div>
                    <button onClick={() => setDrawerOpen(false)} className="text-white/80 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-4 space-y-6 flex-1 overflow-y-auto">
                    {/* Appearance */}
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        APPEARANCE
                      </div>
                      <div
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          isDarkMode ? 'bg-[#1a243b] border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isDarkMode ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                          <div>
                            <div className="text-xs font-semibold">{isDarkMode ? 'Dark Theme' : 'Light Theme'}</div>
                            <div className="text-[10px] text-slate-400">
                              {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
                            </div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isDarkMode}
                          onChange={(e) => setIsDarkMode(e.target.checked)}
                          className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        NAVIGATION
                      </div>
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setSelectedVideo(null);
                            setDrawerOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium hover:bg-purple-500/10 hover:text-purple-500 transition-colors text-left"
                        >
                          <Home className="w-4 h-4" />
                          <span>Home (মূল পাতা)</span>
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            showToast('Copied! সাইট লিঙ্ক কপি হয়েছে');
                            setDrawerOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium hover:bg-purple-500/10 hover:text-purple-500 transition-colors text-left"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copy Site Link</span>
                        </button>
                        <button
                          onClick={() => {
                            showToast('Website Shared!');
                            setDrawerOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium hover:bg-purple-500/10 hover:text-purple-500 transition-colors text-left"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Share Website</span>
                        </button>
                        {onNavigateToXml && (
                          <button
                            onClick={() => {
                              setDrawerOpen(false);
                              onNavigateToXml();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition-colors text-left"
                          >
                            <Download className="w-4 h-4" />
                            <span>Blogger XML থিম হাব (Theme Hub)</span>
                          </button>
                        )}
                        {onNavigateToAdmin && (
                          <button
                            onClick={() => {
                              setDrawerOpen(false);
                              onNavigateToAdmin();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-pink-600 dark:text-pink-400 hover:bg-pink-500/10 transition-colors text-left"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>অ্যাডমিন প্যানেল (Admin Panel)</span>
                          </button>
                        )}
                        <a
                          href="https://t.me/Advisit_bot"
                          target="_blank"
                          rel="noreferrer"
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium hover:bg-purple-500/10 hover:text-purple-500 transition-colors text-left"
                        >
                          <Send className="w-4 h-4 text-sky-400" />
                          <span>টেলিগ্রাম বট (@Advisit_bot)</span>
                        </a>
                        <a
                          href="mailto:kgf105060@gmail.com"
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium hover:bg-purple-500/10 hover:text-purple-500 transition-colors text-left"
                        >
                          <Mail className="w-4 h-4 text-emerald-400" />
                          <span>সাপোর্ট ও যোগাযোগ (Contact)</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. CATEGORY PILL NAVIGATION - Excluded per user focus request ("leave these out") */}

            {/* 4. MAIN CONTENT AREA */}
            <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 pb-20">
              {/* IF SINGLE VIDEO VIEW */}
              {selectedVideo ? (
                <div className="max-w-4xl mx-auto space-y-4">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <button
                      onClick={() => setSelectedVideo(null)}
                      className="text-purple-500 hover:underline font-medium cursor-pointer"
                    >
                      Home
                    </button>
                    <span>/</span>
                    <span>{selectedVideo.category}</span>
                    <span>/</span>
                    <span className="truncate max-w-[200px]">{selectedVideo.title}</span>
                  </div>

                  {/* Title */}
                  <h1 className="text-lg sm:text-xl font-bold leading-snug">
                    {selectedVideo.title}
                  </h1>

                  {/* Metadata bar */}
                  <div
                    className={`flex flex-wrap items-center gap-3 p-3 rounded-xl border text-xs ${
                      isDarkMode ? 'bg-[#131b2e] border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="flex items-center gap-1 font-semibold">
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      {selectedVideo.views} Views
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <ThumbsUp className="w-3.5 h-3.5 text-pink-400" />
                      {selectedVideo.likes} Likes
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {selectedVideo.duration}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-semibold text-[10px]">
                      {selectedVideo.category}
                    </span>
                  </div>

                  {/* Notice Box */}
                  <div className="p-3.5 rounded-xl bg-purple-500/10 border-l-4 border-purple-500 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      ভিডিও দেখতে নিচের ভিডিও প্লেয়ার ব্যবহার করুন। ভিডিও লোড না হলে কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন।
                    </div>
                  </div>

                  {/* 16:9 VIDEO PLAY BOX - Prominent, widescreen, responsive HD player */}
                  <div
                    className={`rounded-2xl border overflow-hidden shadow-2xl transition-all duration-300 w-full ${
                      isDarkMode
                        ? 'bg-[#0b101b] border-slate-800'
                        : 'bg-black border-slate-800 text-white'
                    }`}
                  >
                    {/* Header bar on play box */}
                    <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900/95 border-b border-white/10 flex items-center justify-between text-xs text-slate-300 gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                        <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                        <span className="font-bold text-white text-xs sm:text-sm truncate">
                          {selectedVideo.title}
                        </span>
                        <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                          16:9 HD
                        </span>
                        {/* Selected Ad Network Badge */}
                        <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                          💎 {(() => {
                            const part = selectedVideo.parts?.find((p) => p.partNumber === activePartNumber);
                            const net = (part && part.adProvider && part.adProvider !== 'all') ? part.adProvider : (selectedVideo.adProvider || 'all');
                            return net !== 'all' ? net : '৪টি নেটওয়ার্ক অটো-রোটেশন';
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setTheaterMode(!theaterMode)}
                          className="px-2 sm:px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] sm:text-xs font-semibold text-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                          title="থিয়েটার মোড / ফুল উইডথ ভিউ"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span className="hidden sm:inline">{theaterMode ? 'সাধারণ' : 'থিয়েটার'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVideoFitMode(videoFitMode === 'contain' ? 'cover' : 'contain')}
                          className="px-2 sm:px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] sm:text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                          title="ভিডিও ফিট মোড পরিবর্তন করুন"
                        >
                          {videoFitMode === 'contain' ? '🔍 Fill' : '📺 Fit'}
                        </button>
                      </div>
                    </div>

                    {/* Responsive Video Canvas with adaptive height for mobile and desktop */}
                    <div className={`relative w-full bg-black flex items-center justify-center overflow-hidden transition-all duration-300 ${
                      unlockStatus.unlocked
                        ? 'aspect-video min-h-[200px] sm:min-h-[420px] md:min-h-[520px] lg:min-h-[600px]'
                        : 'min-h-[350px] sm:min-h-[440px] md:min-h-[520px] aspect-auto sm:aspect-video'
                    }`}>
                      {unlockStatus.unlocked ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white relative">
                          {(() => {
                            const rawUrl = unlockStatus.videoEmbedUrl || selectedVideo.videoUrl || '';
                            const isDirectVideo =
                              rawUrl.startsWith('data:video/') ||
                              rawUrl.startsWith('blob:') ||
                              rawUrl.includes('/api/videos/') ||
                              Boolean(rawUrl.match(/\.(mp4|webm|ogg|m4v|mov|m3u8)($|\?)/i));
                            if (isDirectVideo) {
                              return (
                                <video
                                  src={rawUrl}
                                  controls
                                  autoPlay
                                  playsInline
                                  className={`w-full h-full bg-black ${videoFitMode === 'cover' ? 'object-cover' : 'object-contain'}`}
                                />
                              );
                            }
                            const embedUrl = formatVideoEmbedUrl(rawUrl);
                            return (
                              <iframe
                                src={embedUrl}
                                title="Video Player"
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                              />
                            );
                          })()}
                        </div>
                      ) : (
                        /* UNLOCK OVERLAY - Spaciously balanced & optimized for mobile */
                        <div className="w-full h-full min-h-[350px] sm:min-h-full bg-gradient-to-b from-black/90 via-purple-950/90 to-black/95 backdrop-blur-xs flex flex-col items-center justify-center p-4 sm:p-6 text-center text-white">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/40 mb-2.5 sm:mb-3 animate-pulse shrink-0">
                            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>

                          <h3 className="font-extrabold text-sm sm:text-xl mb-1 text-white">
                            ভিডিও লক করা আছে (Video Locked)
                          </h3>
                          <p className="text-[11px] sm:text-sm text-slate-300 max-w-md mb-3 sm:mb-4 px-2 leading-relaxed">
                            ভিডিওটি দেখতে অনুগ্রহ করে নিচে থাকা বিজ্ঞাপনটি সম্পূর্ণ দেখুন।
                          </p>

                          {/* Ad Network & Required Ads Indicator */}
                          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 max-w-sm">
                            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-white/10 text-slate-200 border border-white/15">
                              💎 বিজ্ঞাপন নেটওয়ার্ক: {(() => {
                                const part = selectedVideo.parts?.find((p) => p.partNumber === activePartNumber);
                                const net = (part && part.adProvider && part.adProvider !== 'all') ? part.adProvider : (selectedVideo.adProvider || 'all');
                                return net !== 'all' ? `${net}` : '৪টি নেটওয়ার্ক অটো-রোটেশন';
                              })()}
                            </span>
                            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                              {unlockStatus.requiredAds === 0 ? 'ফ্রি ভিডিও' : `${unlockStatus.requiredAds}টি বিজ্ঞাপন প্রয়োজনীয়`}
                            </span>
                          </div>

                          {/* Progress */}
                          {unlockStatus.requiredAds > 0 && (
                            <div className="w-full max-w-xs sm:max-w-sm space-y-1 mb-4 sm:mb-5 px-2">
                              <div className="flex justify-between text-[11px] sm:text-xs font-semibold text-slate-300">
                                <span>বিজ্ঞাপন সম্পন্ন:</span>
                                <span>
                                  {unlockStatus.completedAds} / {unlockStatus.requiredAds} ({Math.round((unlockStatus.completedAds / unlockStatus.requiredAds) * 100)}%)
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-400 transition-all duration-300"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (unlockStatus.completedAds / unlockStatus.requiredAds) * 100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          <button
                            onClick={handleWatchAd}
                            disabled={unlockStatus.loading}
                            className="w-full sm:w-auto max-w-xs sm:max-w-none px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-pink-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white shrink-0" />
                            <span className="truncate">
                              {unlockStatus.loading
                                ? `বিজ্ঞাপন প্রস্তুত হচ্ছে...`
                                : unlockStatus.completedAds > 0
                                ? `পরবর্তী বিজ্ঞাপন দেখুন (${unlockStatus.completedAds + 1}/${unlockStatus.requiredAds})`
                                : `বিজ্ঞাপন দেখুন ও আনলক করুন`}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Multi-part tabs if video has parts */}
                  {selectedVideo.parts && selectedVideo.parts.length > 1 && (
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <span className="text-xs font-semibold text-slate-400">অন্যান্য পর্ব:</span>
                      {selectedVideo.parts.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setActivePartNumber(p.partNumber);
                            const partRequired = typeof p.requiredAds === 'number' ? p.requiredAds : (selectedVideo.requiredAds || 3);
                            const isFree = partRequired === 0;
                            const partUrl = p.videoUrl || selectedVideo.videoUrl;
                            setUnlockStatus({
                              completedAds: 0,
                              requiredAds: partRequired,
                              unlocked: isFree,
                              loading: false,
                              videoEmbedUrl: isFree ? partUrl : undefined,
                            });
                            safeFetchJson<{ completedAds: number; requiredAds: number; unlocked: boolean }>(
                              `/api/unlock/status/${selectedVideo.id}?partNumber=${p.partNumber}`
                            )
                              .then((data) => {
                                const req = typeof data.requiredAds === 'number' ? data.requiredAds : partRequired;
                                const unl = Boolean(data.unlocked) || req === 0;
                                setUnlockStatus({
                                  completedAds: data.completedAds || 0,
                                  requiredAds: req,
                                  unlocked: unl,
                                  loading: false,
                                  videoEmbedUrl: unl ? partUrl : undefined,
                                });
                              })
                              .catch(() => {});
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activePartNumber === p.partNumber
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                              : isDarkMode
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          Part {p.partNumber}
                          {p.adProvider && p.adProvider !== 'all' && (
                            <span className="ml-1 text-[9px] opacity-75">({p.adProvider})</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Post description */}
                  <div
                    className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 ${
                      isDarkMode ? 'bg-[#131b2e] border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <p>{selectedVideo.description}</p>
                  </div>
                </div>
              ) : (
                /* HOMEPAGE VIDEO GRID */
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                      <Flame className="w-4 h-4 text-pink-500 fill-pink-500" />
                      <span>Most Popular Videos (জনপ্রিয় ভিডিও সমূহ)</span>
                    </div>
                    <span className="text-xs text-slate-400">{videos.length} টি ভিডিও</span>
                  </div>

                  {/* Responsive grid: Single column on small mobile, scaling cleanly to desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {videos.map((vid) => (
                      <article
                        key={vid.id}
                        onClick={() => openVideoDetail(vid)}
                        className={`rounded-2xl border overflow-hidden shadow-xs hover:shadow-xl transition-all transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between ${
                          isDarkMode
                            ? 'bg-[#131b2e] border-slate-800 hover:border-purple-500/60'
                            : 'bg-white border-slate-200 hover:border-purple-400'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-slate-900 overflow-hidden group">
                          <img
                            src={vid.thumbnailUrl}
                            alt={vid.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-pink-600 transition-all shadow-lg">
                              <Play className="w-4 h-4 fill-white" />
                            </div>
                          </div>
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[10px] font-bold text-white tracking-wider">
                            {vid.duration}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="p-3 flex-1 flex flex-col justify-between gap-2.5">
                          <div>
                            <div className="flex items-center justify-between text-[10px] mb-1.5">
                              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-semibold">
                                {vid.category}
                              </span>
                              <span className="font-bold text-pink-400">
                                {typeof vid.requiredAds === 'number' && vid.requiredAds === 0 ? 'ফ্রি' : `🔒 ${vid.requiredAds ?? 3} Ads`}
                              </span>
                            </div>
                            <h3 className="text-xs sm:text-sm font-bold leading-snug line-clamp-2 hover:text-purple-500 transition-colors">
                              {vid.title}
                            </h3>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                            <div className="flex items-center gap-3">
                              <span>👁 {vid.views}</span>
                              <span>👍 {vid.likes}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                showToast('ভিডিও লিঙ্ক শেয়ার করা হয়েছে!');
                              }}
                              className="hover:text-pink-500 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </main>

            {/* 5. FOOTER */}
            <footer className="mt-auto bg-[#090d16] text-white py-6 px-4 sm:px-6 lg:px-8 text-center border-t border-white/10 text-xs w-full">
              <div className="flex flex-col items-center gap-2">
                <span className="font-bold text-sm">প্রিমিয়াম কালেকশন &bull; Premium Collection Platform</span>
                <p className="text-[11px] text-slate-400">
                  &#169; {new Date().getFullYear()} সর্বস্বত্ব সংরক্ষিত (All rights reserved).
                </p>
              </div>
            </footer>

            {/* 6. MOBILE FLOATING BOTTOM NAV (Active on mobile/narrow screen) */}
            <nav
              className="sm:hidden fixed bottom-3 left-4 right-4 h-12 rounded-full bg-[#0d1117]/95 backdrop-blur-md border border-white/15 shadow-2xl flex items-center justify-around z-30 transition-all"
            >
              <button
                onClick={() => setSelectedVideo(null)}
                className="flex flex-col items-center text-[10px] text-pink-400 font-semibold"
              >
                <Home className="w-4 h-4" />
                <span>হোম</span>
              </button>
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="flex flex-col items-center text-[10px] text-slate-400 hover:text-white"
              >
                <Search className="w-4 h-4" />
                <span>সার্চ</span>
              </button>
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex flex-col items-center text-[10px] text-slate-400 hover:text-white"
              >
                <Menu className="w-4 h-4" />
                <span>মেনু</span>
              </button>
            </nav>

            {/* INTERACTIVE LIVE AD MODAL */}
            {activeAd && activeAd.isOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                <div className="bg-slate-900 border-2 border-purple-500/50 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[380px]">
                  {/* Top Bar with Network Badge */}
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                          activeAd.provider.name === 'Bengal Ads'
                            ? 'bg-emerald-500 text-white'
                            : activeAd.provider.name === 'Monetag'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                            : activeAd.provider.name === 'AdsGram'
                            ? 'bg-gradient-to-r from-sky-400 to-purple-500 text-white'
                            : 'bg-teal-600 text-white'
                        }`}>
                          {activeAd.provider.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {activeAd.provider.zoneId ? `Zone #${activeAd.provider.zoneId}` : `Block #${activeAd.provider.blockId}`}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          if (activeAd.countdown > 0) {
                            if (!window.confirm('বিজ্ঞাপন শেষ হওয়ার আগেই বন্ধ করলে পুরস্কার পাবেন না। আপনি কি নিশ্চিত?')) return;
                          }
                          setActiveAd(null);
                          setUnlockStatus((prev) => ({ ...prev, loading: false }));
                        }}
                        className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-white/10"
                      >
                        ✕ বন্ধ করুন
                      </button>
                    </div>

                    {/* Creative Area */}
                    <div className="rounded-xl bg-slate-950 border border-white/10 p-5 text-center space-y-3 mb-4">
                      {activeAd.provider.name === 'Bengal Ads' && (
                        <div className="space-y-2">
                          <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                            🇧🇩 বেঙ্গল অ্যাডস প্রিমিয়াম স্পন্সরড অফার
                          </div>
                          <h4 className="font-extrabold text-sm text-white">
                            বাংলাদেশের সেরা অনলাইন শপিং ও ডিজিটাল অফার!
                          </h4>
                          <p className="text-xs text-slate-300">
                            আজই অর্ডার করুন এবং জিতে নিন আকর্ষণীয় ডিসকাউন্ট কুপন।
                          </p>
                        </div>
                      )}

                      {activeAd.provider.name === 'Monetag' && (
                        <div className="space-y-2">
                          <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">
                            ⚡ Monetag High-CPM Video Partner
                          </div>
                          <h4 className="font-extrabold text-sm text-white">
                            Ultra-Fast Streaming &amp; Cloud Downloads
                          </h4>
                          <p className="text-xs text-slate-300">
                            Install verified partner utility for unlimited speeds.
                          </p>
                        </div>
                      )}

                      {activeAd.provider.name === 'AdsGram' && (
                        <div className="space-y-2">
                          <div className="inline-block px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold">
                            💎 AdsGram Telegram &amp; Web Reward Unit
                          </div>
                          <h4 className="font-extrabold text-sm text-white">
                            Official Telegram Community &amp; Airdrop
                          </h4>
                          <p className="text-xs text-slate-300">
                            Join verified Telegram mini-app to receive reward points.
                          </p>
                        </div>
                      )}

                      {activeAd.provider.name === 'GigaPub' && (
                        <div className="space-y-2">
                          <div className="inline-block px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold">
                            🌐 GigaPub Premium Publisher Network
                          </div>
                          <h4 className="font-extrabold text-sm text-white">
                            Exclusive Games &amp; Entertainment Hub
                          </h4>
                          <p className="text-xs text-slate-300">
                            Explore top interactive entertainment experiences.
                          </p>
                        </div>
                      )}

                      {activeAd.provider.directUrl && (
                        <div className="pt-2">
                          <a
                            href={activeAd.provider.directUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-colors"
                          >
                            <span>🔗 বিজ্ঞাপনটি দেখতে এখানে চাপুন (Open Ad Link)</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          {activeAd.openedNewTab && (
                            <span className="text-[10px] text-emerald-400 block mt-1">
                              ✔ নতুন উইন্ডোতে বিজ্ঞাপন চালু হয়েছে
                            </span>
                          )}
                        </div>
                      )}

                      <div className="pt-2">
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                            style={{
                              width: `${(((activeAd.provider.countdownSeconds || 5) - activeAd.countdown) / (activeAd.provider.countdownSeconds || 5)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Controls */}
                  <div className="space-y-3">
                    <div className="text-center text-xs">
                      {activeAd.countdown > 0 ? (
                        <span className="font-semibold text-pink-400 animate-pulse">
                          ⏳ বিজ্ঞাপন শেষ হতে বাকি: {activeAd.countdown} সেকেন্ড...
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-400 flex items-center justify-center gap-1">
                          <Check className="w-4 h-4" />
                          বিজ্ঞাপন সফলভাবে দেখা সম্পন্ন হয়েছে!
                        </span>
                      )}
                    </div>

                    <button
                      onClick={handleClaimAdReward}
                      disabled={!activeAd.canClaim}
                      className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                        activeAd.canClaim
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:scale-105 cursor-pointer'
                          : 'bg-white/10 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{activeAd.canClaim ? 'পুরস্কার সংগ্রহ করুন ও আনলক এগিয়ে নিন' : 'অপেক্ষা করুন...'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TOAST POPUP */}
            {toastMessage && (
              <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold shadow-2xl animate-fade-in">
                {toastMessage}
              </div>
            )}
      </div>

      {/* Floating Discreet Admin Quick Access */}
      {onNavigateToAdmin && (
          <button
            onClick={onNavigateToAdmin}
            className="fixed bottom-4 right-4 z-40 p-2.5 rounded-full bg-purple-600/90 hover:bg-purple-600 text-white shadow-xl shadow-purple-600/30 backdrop-blur-xs transition-all hover:scale-105 flex items-center gap-1.5 text-xs font-semibold"
            title="অ্যাডমিন প্যানেল (Admin Panel)"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </button>
        )}
      </div>
    );
  };
