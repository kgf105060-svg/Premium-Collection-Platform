import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

export interface Admin {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'super_admin' | 'admin' | 'moderator';
  createdAt: string;
  lastLoginAt?: string;
}

export interface User {
  id: string;
  ip: string;
  userAgent: string;
  totalUnlocks: number;
  adViews: number;
  createdAt: string;
  status: 'active' | 'blocked';
}

export interface VideoPart {
  id: string;
  videoId: string;
  partNumber: number;
  partTitle: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: string;
  requiredAds: number;
  adProvider?: 'Bengal Ads' | 'Monetag' | 'GigaPub' | 'AdsGram' | 'all';
  status: 'active' | 'disabled';
  sortOrder: number;
}

export interface Video {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string;
  category: string;
  videoUrl: string;
  duration: string;
  status: 'published' | 'draft';
  featured: boolean;
  requiredAds: number; // 0 means use global default or free
  adProvider?: 'Bengal Ads' | 'Monetag' | 'GigaPub' | 'AdsGram' | 'all';
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  parts?: VideoPart[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
  icon?: string;
}

export interface AdNetworkConfig {
  adFormat?: 'direct_link' | 'script' | 'adsgram_sdk' | 'custom_code';
  directUrl?: string;
  zoneId?: string;
  blockId?: string;
  scriptUrl?: string;
  dataZone?: string;
  dataSdk?: string;
  sdkTag?: string;
  token?: string;
  customCode?: string;
  openInNewTab?: boolean;
  countdownSeconds?: number;
  adCount?: number;
  note?: string;
}

export interface AdNetwork {
  id: string;
  name: 'Bengal Ads' | 'Monetag' | 'GigaPub' | 'AdsGram';
  enabled: boolean;
  priority: number;
  placement: string;
  config: AdNetworkConfig;
}

export interface BannerAd {
  id: string;
  name: string;
  code: string;
  placement: 'header' | 'below_header' | 'above_video' | 'between_posts' | 'inside_post' | 'below_video' | 'footer';
  device: 'all' | 'mobile' | 'tablet' | 'desktop';
  status: 'active' | 'inactive';
  priority: number;
  createdAt: string;
}

export interface AdSession {
  id: string;
  token: string;
  userId: string;
  videoId: string;
  partNumber: number;
  provider: string;
  nonce: string;
  status: 'started' | 'completed' | 'expired' | 'failed';
  createdAt: string;
  expiresAt: string;
}

export interface UnlockProgress {
  id: string;
  userId: string;
  videoId: string;
  partNumber: number;
  requiredAds: number;
  completedAds: number;
  status: 'locked' | 'watching' | 'unlocked';
  unlockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoUnlock {
  id: string;
  userId: string;
  videoId: string;
  partNumber: number;
  unlockedAt: string;
  ip: string;
}

export interface TelegramUser {
  id: string;
  telegramId: string;
  username: string;
  firstName: string;
  joinedAt: string;
}

export interface ActivityLog {
  id: string;
  adminEmail: string;
  action: string;
  target: string;
  details: string;
  ip: string;
  timestamp: string;
}

export interface SystemSettings {
  siteName: string;
  siteSubtitle: string;
  botUsername: string;
  botToken?: string;
  botStatus: 'online' | 'standby' | 'disconnected';
  webhookStatus: 'active' | 'inactive';
  telegramChannelUrl: string;
  telegramMiniAppUrl?: string;
  contactEmail: string;
  defaultRequiredAds: number;
  primaryAdProvider: 'Bengal Ads' | 'Monetag' | 'GigaPub' | 'AdsGram';
  adDistributionMode: 'single_network' | 'custom_quota' | 'auto_rotation';
  singleNetworkProvider: 'Bengal Ads' | 'Monetag' | 'GigaPub' | 'AdsGram';
  singleNetworkAdCount: number;
  adRotationEnabled: boolean;
  maintenanceMode: boolean;
  bunnyLibraryId?: string;
  bunnyCdnHostname?: string;
  bunnyPullZone?: string;
  bunnyApiKey?: string;
  bunnyReadonlyKey?: string;
}

export interface DatabaseSchema {
  admins: Admin[];
  users: User[];
  videos: Video[];
  video_parts: VideoPart[];
  categories: Category[];
  ad_networks: AdNetwork[];
  banner_ads: BannerAd[];
  ad_sessions: AdSession[];
  unlock_progress: UnlockProgress[];
  video_unlocks: VideoUnlock[];
  telegram_users: TelegramUser[];
  activity_logs: ActivityLog[];
  settings: SystemSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default Seed Data
function getSeedData(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const adminPassword = process.env.ADMIN_PASSWORD || 'Akash@12';
  const passwordHash = bcrypt.hashSync(adminPassword, salt);
  const now = new Date().toISOString();

  return {
    admins: [
      {
        id: 'adm_1',
        email: process.env.ADMIN_EMAIL || 'kgf105060@gmail.com',
        passwordHash,
        name: 'Super Admin',
        role: 'super_admin',
        createdAt: now,
        lastLoginAt: now,
      },
    ],
    users: [
      {
        id: 'usr_guest_1',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        totalUnlocks: 4,
        adViews: 12,
        createdAt: now,
        status: 'active',
      },
      {
        id: 'usr_guest_2',
        ip: '103.145.72.19',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4)',
        totalUnlocks: 8,
        adViews: 24,
        createdAt: now,
        status: 'active',
      },
    ],
    categories: [
      { id: 'cat_all', name: 'সকল (All)', slug: 'all', count: 8, icon: '🔥' },
      { id: 'cat_trending', name: 'Trending', slug: 'Trending', count: 4, icon: '⚡' },
      { id: 'cat_viral', name: 'Viral', slug: 'Viral', count: 3, icon: '🚀' },
      { id: 'cat_bangladeshi', name: 'Bangladeshi', slug: 'Bangladeshi', count: 5, icon: '🇧🇩' },
      { id: 'cat_indian', name: 'Indian', slug: 'Indian', count: 2, icon: '🇮🇳' },
      { id: 'cat_university', name: 'University', slug: 'University', count: 3, icon: '🎓' },
      { id: 'cat_college', name: 'College', slug: 'College', count: 2, icon: '🏫' },
      { id: 'cat_tiktok', name: 'TikTok', slug: 'TikTok', count: 4, icon: '🎵' },
      { id: 'cat_news', name: 'News', slug: 'News', count: 1, icon: '📰' },
    ],
    videos: [
      {
        id: 'vid_1',
        title: 'বাংলাদেশের শীর্ষ ভাইরাল ভিডিও কালেকশন - স্পেশাল পর্ব ১',
        slug: 'bd-top-viral-video-special-part-1',
        description: 'সর্বশেষ ভাইরাল হওয়া জনপ্রিয় ক্লিপসমূহ একটি ফ্রেমে দেখুন। HD কোয়ালিটি ও আনকাট ভিডিও।',
        thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=640&q=80',
        category: 'Viral',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '04:15',
        status: 'published',
        featured: true,
        requiredAds: 3,
        views: 4820,
        likes: 540,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: now,
      },
      {
        id: 'vid_2',
        title: 'ঢাকা বিশ্ববিদ্যালয়ের কালচারাল ফেস্ট ও কনসার্ট স্পেশাল হাইলাইটস',
        slug: 'du-cultural-fest-concert-highlights',
        description: 'বিশ্ববিদ্যালয় ক্যাম্পাসের আনন্দ উৎসব ও গান পরিবেশনার সেরা মুহূর্তগুলো।',
        thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=640&q=80',
        category: 'University',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        duration: '06:30',
        status: 'published',
        featured: true,
        requiredAds: 2,
        views: 3120,
        likes: 290,
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        updatedAt: now,
      },
      {
        id: 'vid_3',
        title: 'সোশ্যাল মিডিয়া ট্রেন্ডিং শর্টস ও টিকটক মেগা সংকলন ২০২৬',
        slug: 'social-media-trending-tiktok-collection-2026',
        description: 'সপ্তাহের সেরা ট্রেন্ডিং ক্লিপস যা সারা দেশে ঝড় তুলেছে।',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=640&q=80',
        category: 'TikTok',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration: '03:48',
        status: 'published',
        featured: false,
        requiredAds: 3,
        views: 2650,
        likes: 185,
        createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
        updatedAt: now,
      },
      {
        id: 'vid_4',
        title: 'ইন্ডিয়ান ও বাংলাদেশি কমেডি ড্রামা দৃশ্য - পার্ট ২ এক্সক্লুসিভ',
        slug: 'comedy-drama-scenes-exclusive-part-2',
        description: 'হাস্যরসাত্মক সেরা ক্লিপ ও নাটকের জনপ্রিয় দৃশ্য একসাথে।',
        thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=640&q=80',
        category: 'Trending',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        duration: '05:12',
        status: 'published',
        featured: false,
        requiredAds: 4,
        views: 1940,
        likes: 142,
        createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
        updatedAt: now,
      },
    ],
    video_parts: [
      {
        id: 'part_1_1',
        videoId: 'vid_1',
        partNumber: 1,
        partTitle: 'প্রথম অংশ - প্রারম্ভিক হাইলাইটস',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '02:05',
        requiredAds: 2,
        status: 'active',
        sortOrder: 1,
      },
      {
        id: 'part_1_2',
        videoId: 'vid_1',
        partNumber: 2,
        partTitle: 'দ্বিতীয় অংশ - মেইন অ্যাকশন সিন',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        duration: '02:10',
        requiredAds: 3,
        status: 'active',
        sortOrder: 2,
      },
    ],
    ad_networks: [
      {
        id: 'net_1',
        name: 'Monetag',
        enabled: true,
        priority: 1,
        placement: 'Direct Link / Interstitial SDK',
        config: {
          adFormat: 'direct_link',
          directUrl: 'https://omg10.com/4/9272136',
          zoneId: '11699704',
          dataZone: '11699704',
          dataSdk: 'show_11699704',
          scriptUrl: '//libtl.com/sdk.js',
          sdkTag: "<script src='//libtl.com/sdk.js' data-zone='11699704' data-sdk='show_11699704'></script>",
          openInNewTab: true,
          countdownSeconds: 5,
          adCount: 2,
          note: 'Monetag high-CPM smartlink & rewarded interstitial provider (Zone 11699704)',
        },
      },
      {
        id: 'net_2',
        name: 'Bengal Ads',
        enabled: true,
        priority: 2,
        placement: 'Rewarded SmartLink / Loader',
        config: {
          adFormat: 'direct_link',
          directUrl: 'https://bengalads.net/smartlink?zone=884&source=blogger',
          zoneId: 'BG_ADS_ZONE_884',
          scriptUrl: 'https://bengalads.net/tag/loader.js',
          openInNewTab: true,
          countdownSeconds: 5,
          adCount: 1,
          note: 'Targeted Bangladeshi high-CPM rewarded ad network',
        },
      },
      {
        id: 'net_3',
        name: 'GigaPub',
        enabled: true,
        priority: 3,
        placement: 'Native Offer / Direct Link',
        config: {
          adFormat: 'direct_link',
          directUrl: 'https://gigapub.com/r/gp_49012',
          zoneId: 'GP_49012',
          token: 'gp_pub_token_99182',
          openInNewTab: true,
          countdownSeconds: 5,
          adCount: 0,
          note: 'GigaPub global publisher network with high fill-rate',
        },
      },
      {
        id: 'net_4',
        name: 'AdsGram',
        enabled: true,
        priority: 4,
        placement: 'AdsGram SDK & Web Block',
        config: {
          adFormat: 'adsgram_sdk',
          directUrl: 'https://t.me/AdsgramBot?start=reward_4821',
          blockId: '4821',
          scriptUrl: 'https://sad.adsgram.ai/js/sad.min.js',
          openInNewTab: true,
          countdownSeconds: 6,
          adCount: 1,
          note: 'Official AdsGram rewarded video SDK for Telegram and Web',
        },
      },
    ],
    banner_ads: [
      {
        id: 'ban_1',
        name: 'Header Banner 728x90',
        code: '<div style="background:linear-gradient(90deg,#4f46e5,#9333ea);color:#fff;padding:12px;border-radius:8px;font-weight:bold;text-align:center;">🔥 প্রিমিয়াম স্পনসরড অফার — আজই জয়েন করুন আমাদের টেলিগ্রাম চ্যানেলে!</div>',
        placement: 'header',
        device: 'all',
        status: 'active',
        priority: 1,
        createdAt: now,
      },
      {
        id: 'ban_2',
        name: 'Inside Post Mobile Banner',
        code: '<div style="background:#1e1b4b;border:1px solid #6366f1;color:#e0e7ff;padding:14px;border-radius:8px;text-align:center;">⚡ দ্রুত ডাউনলোড ও বাফারলেস ভিডিওর জন্য অ্যাপটি ইন্সটল করুন!</div>',
        placement: 'inside_post',
        device: 'mobile',
        status: 'active',
        priority: 2,
        createdAt: now,
      },
    ],
    ad_sessions: [],
    unlock_progress: [],
    video_unlocks: [
      {
        id: 'unl_1',
        userId: 'usr_guest_1',
        videoId: 'vid_1',
        partNumber: 1,
        unlockedAt: now,
        ip: '127.0.0.1',
      },
    ],
    telegram_users: [
      {
        id: 'tg_1',
        telegramId: '9841284',
        username: 'shanto_bd',
        firstName: 'Shanto',
        joinedAt: now,
      },
    ],
    activity_logs: [
      {
        id: 'act_1',
        adminEmail: 'admin@example.com',
        action: 'INITIALIZE',
        target: 'System Database',
        details: 'System database provisioned with default configuration & security rules.',
        ip: '127.0.0.1',
        timestamp: now,
      },
    ],
    settings: {
      siteName: 'প্রিমিয়াম কালেকশন',
      siteSubtitle: 'Premium Collection Platform',
      botUsername: process.env.BOT_USERNAME || '@Advisit_bot',
      botToken: process.env.BOT_TOKEN || '8329711123:AAG2pVo9OXB8AZYmWEzpAomKTB9sfkoGmUE',
      botStatus: 'online',
      webhookStatus: 'active',
      telegramChannelUrl: 'https://t.me/Advisit_bot',
      telegramMiniAppUrl: 'https://t.me/Advisit_bot/app',
      contactEmail: 'kgf105060@gmail.com',
      defaultRequiredAds: 4,
      primaryAdProvider: 'Monetag',
      adDistributionMode: 'single_network',
      singleNetworkProvider: 'Monetag',
      singleNetworkAdCount: 4,
      adRotationEnabled: true,
      maintenanceMode: false,
    },
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content) as DatabaseSchema;
        // Normalize ad networks to ensure all 4 networks have proper directUrl and formats
        const seed = getSeedData();
        if (parsed.settings) {
          parsed.settings.adDistributionMode = parsed.settings.adDistributionMode || 'single_network';
          parsed.settings.singleNetworkProvider = parsed.settings.singleNetworkProvider || 'Monetag';
          parsed.settings.singleNetworkAdCount = parsed.settings.singleNetworkAdCount || 4;
          parsed.settings.telegramMiniAppUrl = parsed.settings.telegramMiniAppUrl || 'https://t.me/Advisit_bot/app';
          if (!parsed.settings.botToken) {
            parsed.settings.botToken = process.env.BOT_TOKEN || '8329711123:AAG2pVo9OXB8AZYmWEzpAomKTB9sfkoGmUE';
          }
          if (!parsed.settings.botUsername || parsed.settings.botUsername === '@PremiumCollectionBot') {
            parsed.settings.botUsername = '@Advisit_bot';
          }
          if (!parsed.settings.telegramChannelUrl || parsed.settings.telegramChannelUrl === 'https://t.me/YOUR_TELEGRAM_CHANNEL') {
            parsed.settings.telegramChannelUrl = 'https://t.me/Advisit_bot';
          }
        }
        if (parsed.ad_networks && parsed.ad_networks.length > 0) {
          parsed.ad_networks = parsed.ad_networks.map((net) => {
            const seedNet = seed.ad_networks.find((s) => s.name.toLowerCase() === net.name.toLowerCase());
            if (seedNet) {
              return {
                ...net,
                config: {
                  ...seedNet.config,
                  ...net.config,
                  adFormat: net.config?.adFormat || seedNet.config.adFormat || 'direct_link',
                  directUrl: net.config?.directUrl || seedNet.config.directUrl,
                  openInNewTab: net.config?.openInNewTab !== undefined ? net.config.openInNewTab : true,
                  countdownSeconds: net.config?.countdownSeconds || seedNet.config.countdownSeconds || 5,
                  adCount: net.config?.adCount !== undefined ? net.config.adCount : (seedNet.config.adCount ?? 1),
                },
              };
            }
            return net;
          });
          // Ensure all 4 networks exist
          seed.ad_networks.forEach((sNet) => {
            if (!parsed.ad_networks.some((n) => n.name.toLowerCase() === sNet.name.toLowerCase())) {
              parsed.ad_networks.push(sNet);
            }
          });
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error reading database file, resetting to seed data:', e);
    }
    const seed = getSeedData();
    this.persist(seed);
    return seed;
  }

  private persist(data: DatabaseSchema) {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public save() {
    this.persist(this.data);
  }

  public get schema(): DatabaseSchema {
    return this.data;
  }

  // Admin Operations
  public findAdminByEmail(email: string): Admin | undefined {
    return this.data.admins.find((a) => a.email.toLowerCase() === email.toLowerCase());
  }

  public updateAdmin(id: string, updates: Partial<Admin>): Admin | undefined {
    const admin = this.data.admins.find((a) => a.id === id);
    if (!admin) return undefined;
    Object.assign(admin, updates);
    this.save();
    return admin;
  }

  // Videos CRUD
  public getVideos(filter?: { category?: string; status?: 'published' | 'draft'; search?: string }): Video[] {
    let list = [...this.data.videos];
    if (filter?.category && filter.category !== 'all' && filter.category !== 'সকল (All)') {
      list = list.filter((v) => v.category.toLowerCase() === filter.category!.toLowerCase());
    }
    if (filter?.status) {
      list = list.filter((v) => v.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((v) => v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q));
    }
    // Attach parts
    return list.map((v) => ({
      ...v,
      parts: this.data.video_parts.filter((p) => p.videoId === v.id).sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  }

  public getVideoById(id: string): Video | undefined {
    const video = this.data.videos.find((v) => v.id === id || v.slug === id);
    if (!video) return undefined;
    return {
      ...video,
      parts: this.data.video_parts.filter((p) => p.videoId === video.id).sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }

  public createVideo(video: Omit<Video, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes'>): Video {
    const newVideo: Video = {
      ...video,
      id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      views: 0,
      likes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.videos.unshift(newVideo);
    this.save();
    return newVideo;
  }

  public updateVideo(id: string, updates: Partial<Video>): Video | undefined {
    const video = this.data.videos.find((v) => v.id === id);
    if (!video) return undefined;
    Object.assign(video, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return this.getVideoById(id);
  }

  public deleteVideo(id: string): boolean {
    const idx = this.data.videos.findIndex((v) => v.id === id);
    if (idx === -1) return false;
    this.data.videos.splice(idx, 1);
    this.data.video_parts = this.data.video_parts.filter((p) => p.videoId !== id);
    this.save();
    return true;
  }

  // Video Parts
  public addVideoPart(part: Omit<VideoPart, 'id'>): VideoPart {
    const newPart: VideoPart = {
      ...part,
      id: `part_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.data.video_parts.push(newPart);
    this.save();
    return newPart;
  }

  public updateVideoPart(id: string, updates: Partial<VideoPart>): VideoPart | undefined {
    const part = this.data.video_parts.find((p) => p.id === id);
    if (!part) return undefined;
    Object.assign(part, updates);
    this.save();
    return part;
  }

  public deleteVideoPart(id: string): boolean {
    const idx = this.data.video_parts.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.data.video_parts.splice(idx, 1);
    this.save();
    return true;
  }

  // Categories CRUD
  public getCategories(): Category[] {
    return this.data.categories;
  }

  public addCategory(name: string, icon?: string): Category {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      name,
      slug,
      count: 0,
      icon: icon || '📁',
    };
    this.data.categories.push(newCat);
    this.save();
    return newCat;
  }

  // Ad Networks
  public getAdNetworks(): AdNetwork[] {
    return [...this.data.ad_networks].sort((a, b) => a.priority - b.priority);
  }

  public updateAdNetwork(id: string, updates: Partial<AdNetwork>): AdNetwork | undefined {
    const net = this.data.ad_networks.find((n) => n.id === id);
    if (!net) return undefined;
    if (updates.config) {
      net.config = { ...net.config, ...updates.config };
      delete updates.config;
    }
    Object.assign(net, updates);
    this.save();
    return net;
  }

  // Banner Ads
  public getBanners(): BannerAd[] {
    return [...this.data.banner_ads].sort((a, b) => a.priority - b.priority);
  }

  public createBanner(banner: Omit<BannerAd, 'id' | 'createdAt'>): BannerAd {
    const newBanner: BannerAd = {
      ...banner,
      id: `ban_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.banner_ads.push(newBanner);
    this.save();
    return newBanner;
  }

  public updateBanner(id: string, updates: Partial<BannerAd>): BannerAd | undefined {
    const ban = this.data.banner_ads.find((b) => b.id === id);
    if (!ban) return undefined;
    Object.assign(ban, updates);
    this.save();
    return ban;
  }

  public deleteBanner(id: string): boolean {
    const idx = this.data.banner_ads.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    this.data.banner_ads.splice(idx, 1);
    this.save();
    return true;
  }

  // Ad Sessions & Server-Side Unlock
  public createAdSession(userId: string, videoId: string, partNumber: number, provider: string): AdSession {
    const session: AdSession = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      token: `tok_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`,
      userId,
      videoId,
      partNumber,
      provider,
      nonce: Math.random().toString(36).substring(2, 10),
      status: 'started',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes expiration
    };
    this.data.ad_sessions.push(session);
    // Keep max 1000 sessions in memory
    if (this.data.ad_sessions.length > 1000) {
      this.data.ad_sessions.splice(0, 200);
    }
    this.save();
    return session;
  }

  public getAdSession(id: string, token: string): AdSession | undefined {
    return this.data.ad_sessions.find((s) => s.id === id && s.token === token);
  }

  public completeAdSession(id: string): boolean {
    const session = this.data.ad_sessions.find((s) => s.id === id);
    if (!session || session.status !== 'started') return false;
    // Check expiry
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      session.status = 'expired';
      this.save();
      return false;
    }
    session.status = 'completed';
    this.save();
    return true;
  }

  public getUnlockProgress(userId: string, videoId: string, partNumber: number, requiredAds: number): UnlockProgress {
    let progress = this.data.unlock_progress.find(
      (p) => p.userId === userId && p.videoId === videoId && p.partNumber === partNumber
    );
    if (!progress) {
      progress = {
        id: `prog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId,
        videoId,
        partNumber,
        requiredAds,
        completedAds: 0,
        status: 'locked',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.unlock_progress.push(progress);
      this.save();
    }
    return progress;
  }

  public incrementUnlockProgress(userId: string, videoId: string, partNumber: number, requiredAds: number): { progress: UnlockProgress; unlocked: boolean } {
    const progress = this.getUnlockProgress(userId, videoId, partNumber, requiredAds);
    progress.completedAds = Math.min(requiredAds, progress.completedAds + 1);
    progress.updatedAt = new Date().toISOString();

    const unlocked = progress.completedAds >= requiredAds;
    if (unlocked) {
      progress.status = 'unlocked';
      progress.unlockedAt = new Date().toISOString();

      // Record unlock
      this.data.video_unlocks.push({
        id: `unl_${Date.now()}`,
        userId,
        videoId,
        partNumber,
        unlockedAt: new Date().toISOString(),
        ip: 'client',
      });
    } else {
      progress.status = 'watching';
    }

    // Update user stats
    const user = this.data.users.find((u) => u.id === userId);
    if (user) {
      user.adViews++;
      if (unlocked) user.totalUnlocks++;
    }

    this.save();
    return { progress, unlocked };
  }

  // Users
  public getOrCreateUser(ip: string, userAgent: string): User {
    let user = this.data.users.find((u) => u.ip === ip);
    if (!user) {
      user = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ip,
        userAgent,
        totalUnlocks: 0,
        adViews: 0,
        createdAt: new Date().toISOString(),
        status: 'active',
      };
      this.data.users.push(user);
      this.save();
    }
    return user;
  }

  public getUsers(): User[] {
    return this.data.users;
  }

  // Activity Logs
  public logActivity(adminEmail: string, action: string, target: string, details: string, ip = '127.0.0.1') {
    const entry: ActivityLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      adminEmail,
      action,
      target,
      details,
      ip,
      timestamp: new Date().toISOString(),
    };
    this.data.activity_logs.unshift(entry);
    if (this.data.activity_logs.length > 500) {
      this.data.activity_logs.pop();
    }
    this.save();
  }

  public getActivityLogs(limit = 50): ActivityLog[] {
    return this.data.activity_logs.slice(0, limit);
  }

  // Settings
  public getSettings(): SystemSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    Object.assign(this.data.settings, updates);
    this.save();
    return this.data.settings;
  }

  // System Configuration Export & Import
  public getFullSystemConfiguration(includeExtras = true) {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appName: 'Premium Collection Mini App & Blogger Theme',
      type: 'system_configuration',
      settings: { ...this.data.settings },
      ...(includeExtras
        ? {
            adNetworks: [...this.data.ad_networks],
            categories: [...this.data.categories],
            bannerAds: [...this.data.banner_ads],
          }
        : {}),
    };
  }

  public importSystemConfiguration(payload: any): {
    settings: SystemSettings;
    importedSummary: {
      settingsUpdated: boolean;
      adNetworksUpdated: number;
      categoriesAdded: number;
      bannersUpdated: number;
    };
  } {
    const summary = {
      settingsUpdated: false,
      adNetworksUpdated: 0,
      categoriesAdded: 0,
      bannersUpdated: 0,
    };

    if (!payload || typeof payload !== 'object') {
      throw new Error('অবৈধ কনফিগারেশন ডাটা');
    }

    // Extract settings if nested in payload.settings or top-level payload
    const settingsCandidate = payload.settings || (payload.siteName ? payload : null);
    if (settingsCandidate && typeof settingsCandidate === 'object') {
      const allowedKeys: (keyof SystemSettings)[] = [
        'siteName',
        'siteSubtitle',
        'botUsername',
        'botToken',
        'botStatus',
        'webhookStatus',
        'telegramChannelUrl',
        'telegramMiniAppUrl',
        'contactEmail',
        'defaultRequiredAds',
        'primaryAdProvider',
        'adDistributionMode',
        'singleNetworkProvider',
        'singleNetworkAdCount',
        'adRotationEnabled',
        'maintenanceMode',
      ];
      for (const key of allowedKeys) {
        if (settingsCandidate[key] !== undefined) {
          (this.data.settings as any)[key] = settingsCandidate[key];
        }
      }
      summary.settingsUpdated = true;
    }

    // Import ad networks if included
    if (Array.isArray(payload.adNetworks)) {
      for (const importedNet of payload.adNetworks) {
        if (!importedNet || !importedNet.name) continue;
        const existing = this.data.ad_networks.find(
          (n) => n.id === importedNet.id || n.name.toLowerCase() === importedNet.name.toLowerCase()
        );
        if (existing) {
          if (importedNet.config) {
            existing.config = { ...existing.config, ...importedNet.config };
          }
          if (importedNet.enabled !== undefined) existing.enabled = Boolean(importedNet.enabled);
          if (importedNet.priority !== undefined) existing.priority = Number(importedNet.priority);
          if (importedNet.placement) existing.placement = importedNet.placement;
          summary.adNetworksUpdated++;
        }
      }
    }

    // Import categories if included
    if (Array.isArray(payload.categories)) {
      for (const importedCat of payload.categories) {
        if (!importedCat || !importedCat.name) continue;
        const exists = this.data.categories.some(
          (c) => c.slug === importedCat.slug || c.name.toLowerCase() === importedCat.name.toLowerCase()
        );
        if (!exists) {
          this.data.categories.push({
            id: importedCat.id || `cat_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            name: importedCat.name,
            slug: importedCat.slug || importedCat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            count: Number(importedCat.count) || 0,
            icon: importedCat.icon || '📁',
          });
          summary.categoriesAdded++;
        }
      }
    }

    // Import banners if included
    if (Array.isArray(payload.bannerAds)) {
      for (const importedBan of payload.bannerAds) {
        if (!importedBan || !importedBan.code) continue;
        const existing = this.data.banner_ads.find((b) => b.id === importedBan.id);
        if (existing) {
          Object.assign(existing, importedBan);
          summary.bannersUpdated++;
        } else {
          this.data.banner_ads.push({
            id: importedBan.id || `ban_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            name: importedBan.name || 'Imported Banner',
            code: importedBan.code,
            placement: importedBan.placement || 'header',
            device: importedBan.device || 'all',
            status: importedBan.status || 'active',
            priority: Number(importedBan.priority) || 1,
            createdAt: importedBan.createdAt || new Date().toISOString(),
          });
          summary.bannersUpdated++;
        }
      }
    }

    this.save();
    return {
      settings: this.data.settings,
      importedSummary: summary,
    };
  }
}

export const db = new Database();
