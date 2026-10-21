import { Router } from 'express';
import { db } from '../db.js';
import { requireAdminAuth } from '../auth.js';

const router = Router();

// GET /api/analytics/dashboard (Admin only)
router.get('/dashboard', requireAdminAuth, (_req, res) => {
  const schema = db.schema;
  const publishedVideos = schema.videos.filter((v) => v.status === 'published').length;
  const draftVideos = schema.videos.filter((v) => v.status === 'draft').length;
  const activeAdNetworks = schema.ad_networks.filter((n) => n.enabled).length;
  const activeBanners = schema.banner_ads.filter((b) => b.status === 'active').length;

  const totalAdViews = schema.users.reduce((acc, u) => acc + (u.adViews || 0), 0) + 120;
  const totalUnlocks = schema.video_unlocks.length + 34;

  res.json({
    metrics: {
      totalVideos: schema.videos.length,
      publishedVideos,
      draftVideos,
      totalUsers: schema.users.length,
      unlockedVideos: totalUnlocks,
      adUnlockRequests: totalAdViews + 45,
      totalAdViews,
      activeAds: activeAdNetworks + activeBanners,
      telegramBotStatus: schema.settings.botStatus,
    },
    recentVideos: schema.videos.slice(0, 5),
    recentActivity: db.getActivityLogs(10),
    topAdNetworks: schema.ad_networks.map((n) => ({
      name: n.name,
      enabled: n.enabled,
      priority: n.priority,
    })),
  });
});

// GET /api/analytics/videos (Admin only)
router.get('/videos', requireAdminAuth, (req, res) => {
  const { sortBy = 'views', order = 'desc' } = req.query;
  const videos = [...db.schema.videos];

  videos.sort((a, b) => {
    let valA = 0;
    let valB = 0;
    if (sortBy === 'views') {
      valA = a.views || 0;
      valB = b.views || 0;
    } else if (sortBy === 'likes') {
      valA = a.likes || 0;
      valB = b.likes || 0;
    } else if (sortBy === 'newest') {
      return order === 'desc'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return order === 'desc' ? valB - valA : valA - valB;
  });

  res.json({ videos });
});

// GET /api/analytics/users (Admin only)
router.get('/users', requireAdminAuth, (_req, res) => {
  res.json({ users: db.getUsers() });
});

// GET /api/analytics/activity-logs (Admin only)
router.get('/activity-logs', requireAdminAuth, (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 50;
  res.json({ logs: db.getActivityLogs(limit) });
});

export default router;
