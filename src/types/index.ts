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
  requiredAds: number;
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

export interface MediaItem {
  id: string;
  title: string;
  type: 'video' | 'image';
  url: string;
  thumbnailUrl?: string;
  duration?: string;
  category?: string;
  source: 'preset' | 'upload' | 'external' | 'bunny';
  guid?: string;
  hlsUrl?: string;
  previewUrl?: string;
  resolutions?: string;
  views?: number;
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

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
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

export interface DashboardMetrics {
  totalVideos: number;
  publishedVideos: number;
  draftVideos: number;
  totalUsers: number;
  unlockedVideos: number;
  adUnlockRequests: number;
  totalAdViews: number;
  activeAds: number;
  telegramBotStatus: string;
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
