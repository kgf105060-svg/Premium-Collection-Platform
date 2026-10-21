import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// Helper to extract or assign client user
function getClientUser(req: any) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const ua = req.headers['user-agent'] || 'Unknown User Agent';
  return db.getOrCreateUser(ip, ua);
}

// Unified helper to calculate effective required ads based on admin settings & strategy
function getEffectiveRequiredAds(settings: any, video?: any, partNumber: number = 1): number {
  // If specific video or video part defines requiredAds during posting, respect it with highest priority!
  if (video) {
    if (video.parts && video.parts.length > 0) {
      const part = video.parts.find((p: any) => p.partNumber === partNumber);
      if (part && typeof part.requiredAds === 'number') return part.requiredAds;
    }
    if (typeof video.requiredAds === 'number') return video.requiredAds;
  }

  // Global settings fallback
  if (settings.adDistributionMode === 'single_network') {
    return Number(settings.singleNetworkAdCount) || Number(settings.defaultRequiredAds) || 4;
  }
  if (settings.adDistributionMode === 'custom_quota') {
    const allNetworks = db.getAdNetworks().filter((n) => n.enabled);
    const sumQuota = allNetworks.reduce((acc, n) => acc + (n.config?.adCount !== undefined ? Math.max(0, n.config.adCount) : 1), 0);
    return sumQuota > 0 ? sumQuota : (Number(settings.defaultRequiredAds) || 4);
  }
  return Number(settings.defaultRequiredAds) || 4;
}

// GET /api/unlock/status/:videoId?partNumber=1
router.get('/status/:videoId', (req, res) => {
  const user = getClientUser(req);
  const partNumber = parseInt(req.query.partNumber as string, 10) || 1;
  let video = db.getVideoById(req.params.videoId);
  if (!video) {
    const clean = req.params.videoId.replace(/^\/|\.html$/g, '').split('/').pop();
    if (clean) video = db.getVideoById(clean);
  }

  const defaultSettings = db.getSettings();
  const requiredAds = getEffectiveRequiredAds(defaultSettings, video, partNumber);

  const progress = db.getUnlockProgress(user.id, req.params.videoId, partNumber, requiredAds);
  const isUnlocked = progress.status === 'unlocked' || requiredAds === 0 || progress.completedAds >= requiredAds;

  res.json({
    videoId: req.params.videoId,
    partNumber,
    requiredAds: progress.requiredAds,
    completedAds: progress.completedAds,
    status: isUnlocked ? 'unlocked' : progress.status,
    unlocked: isUnlocked,
    adProvider: (video && (video.parts?.find((p: any) => p.partNumber === partNumber)?.adProvider || video.adProvider)) || 'all',
  });
});

// POST /api/unlock/start-session
router.post('/start-session', (req, res) => {
  const user = getClientUser(req);
  const { videoId, partNumber, postId, provider } = req.body;
  const vid = videoId || postId || 'sample_video';
  const partNum = parseInt(partNumber, 10) || 1;
  let video = db.getVideoById(vid);
  if (!video && postId) {
    const clean = String(postId).replace(/^\/|\.html$/g, '').split('/').pop();
    if (clean) video = db.getVideoById(clean);
  }

  // Retrieve all configured ad networks and settings
  const allNetworks = db.getAdNetworks();
  const activeNetworks = allNetworks.filter((n) => n.enabled);
  const settings = db.getSettings();

  let selectedNetwork = activeNetworks.length > 0 ? activeNetworks[0] : allNetworks[0];

  // 1. Explicit override from test parameter if supplied
  if (provider && provider !== 'auto') {
    const requested = allNetworks.find((n) => n.name.toLowerCase() === String(provider).toLowerCase());
    if (requested) {
      selectedNetwork = requested;
    }
  }
  // 2. HIGHEST POSTING PRIORITY: Use specific ad network selected during posting for this video or part!
  else if (video) {
    let targetProvider = video.adProvider;
    if (video.parts && video.parts.length > 0) {
      const part = video.parts.find((p: any) => p.partNumber === partNum);
      if (part && part.adProvider && part.adProvider !== 'all') {
        targetProvider = part.adProvider;
      }
    }

    if (targetProvider && targetProvider !== 'all') {
      // Admin specifically selected this network during posting (Monetag, Bengal Ads, GigaPub, AdsGram)
      const matched = allNetworks.find((n) => n.name.toLowerCase() === targetProvider.toLowerCase() && n.enabled)
        || allNetworks.find((n) => n.name.toLowerCase() === targetProvider.toLowerCase());
      if (matched) {
        selectedNetwork = matched;
      }
    } else {
      // Video was posted with 'all' (Auto-rotation between all 4 networks)
      const currentProgress = db.getUnlockProgress(user.id, vid, partNum, 4);
      if (activeNetworks.length > 0) {
        const rotationIndex = (currentProgress.completedAds || 0) % activeNetworks.length;
        selectedNetwork = activeNetworks[rotationIndex] || activeNetworks[0];
      }
    }
  } else if (settings.adDistributionMode === 'single_network') {
    const singleTarget = settings.singleNetworkProvider || 'Monetag';
    const singleNet = allNetworks.find((n) => n.name.toLowerCase() === singleTarget.toLowerCase() && n.enabled)
      || allNetworks.find((n) => n.name.toLowerCase() === singleTarget.toLowerCase())
      || activeNetworks[0];
    if (singleNet) selectedNetwork = singleNet;
  } else if (activeNetworks.length > 1) {
    const currentProgress = db.getUnlockProgress(user.id, vid, partNum, 4);
    const rotationIndex = (currentProgress.completedAds || 0) % activeNetworks.length;
    selectedNetwork = activeNetworks[rotationIndex] || activeNetworks[0];
  }

  const selectedProviderName = selectedNetwork?.name || 'Monetag';

  // Create session with unique token, nonce and expiration
  const session = db.createAdSession(user.id, vid, partNum, selectedProviderName);

  res.json({
    success: true,
    sessionId: session.id,
    token: session.token,
    provider: {
      id: selectedNetwork?.id,
      name: selectedNetwork?.name || 'Monetag',
      placement: selectedNetwork?.placement || 'Rewarded Ad',
      priority: selectedNetwork?.priority || 1,
      adFormat: selectedNetwork?.config?.adFormat || 'direct_link',
      directUrl: selectedNetwork?.config?.directUrl || '',
      zoneId: selectedNetwork?.config?.zoneId || '',
      blockId: selectedNetwork?.config?.blockId || '',
      scriptUrl: selectedNetwork?.config?.scriptUrl || '',
      token: selectedNetwork?.config?.token || '',
      customCode: selectedNetwork?.config?.customCode || '',
      openInNewTab: selectedNetwork?.config?.openInNewTab !== false,
      countdownSeconds: Math.min(Number(selectedNetwork?.config?.countdownSeconds) || 5, 8),
      note: selectedNetwork?.config?.note || '',
    },
    expiresAt: session.expiresAt,
    nonce: session.nonce,
  });
});

// POST /api/unlock/verify-ad
router.post('/verify-ad', (req, res) => {
  const user = getClientUser(req);
  const { sessionId, token, videoId, partNumber, postId } = req.body;

  if (!sessionId || !token) {
    return res.status(400).json({ error: 'Session credentials missing' });
  }

  const session = db.getAdSession(sessionId, token);
  if (!session) {
    return res.status(403).json({ error: 'Invalid or non-existent ad session (অবৈধ সেশন)' });
  }

  if (session.status === 'completed') {
    return res.status(400).json({ error: 'Ad session already used (বিজ্ঞাপন পূর্বে সম্পন্ন হয়েছে)' });
  }

  if (session.status === 'expired' || new Date(session.expiresAt).getTime() < Date.now()) {
    return res.status(410).json({ error: 'Ad session has expired (সেশনের মেয়াদ শেষ)' });
  }

  // Anti-cheat timing verification: ensure ad was not "completed" in 0 milliseconds
  const timeElapsedMs = Date.now() - new Date(session.createdAt).getTime();
  if (timeElapsedMs < 500) {
    return res.status(429).json({ error: 'Suspiciously fast completion. Verification failed.' });
  }

  // Mark session completed
  db.completeAdSession(sessionId);

  const vid = videoId || session.videoId || postId || 'sample_video';
  const partNum = parseInt(partNumber || session.partNumber, 10) || 1;

  // Determine required ads using unified strategy
  const defaultSettings = db.getSettings();
  const video = db.getVideoById(vid);
  const requiredAds = getEffectiveRequiredAds(defaultSettings, video, partNum);

  let resolvedVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  if (video) {
    resolvedVideoUrl = video.videoUrl || resolvedVideoUrl;
    if (video.parts && video.parts.length > 0) {
      const part = video.parts.find((p) => p.partNumber === partNum);
      if (part && part.videoUrl) {
        resolvedVideoUrl = part.videoUrl;
        if (resolvedVideoUrl.startsWith('data:video/')) {
          resolvedVideoUrl = `/api/videos/${vid}/parts/${part.id}/stream`;
        }
      }
    } else if (resolvedVideoUrl.startsWith('data:video/')) {
      resolvedVideoUrl = `/api/videos/${vid}/stream`;
    }
  }

  const result = db.incrementUnlockProgress(user.id, vid, partNum, requiredAds);

  res.json({
    success: true,
    completedAds: result.progress.completedAds,
    requiredAds: result.progress.requiredAds,
    unlocked: result.unlocked,
    videoEmbedUrl: result.unlocked ? resolvedVideoUrl : null,
    message: result.unlocked ? 'ভিডিও আনলক সম্পন্ন হয়েছে!' : 'বিজ্ঞাপন সম্পন্ন হয়েছে। পরবর্তী বিজ্ঞাপন দেখুন।',
  });
});

export default router;
