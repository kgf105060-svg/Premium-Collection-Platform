import { Router } from 'express';
import { db } from '../db.js';
import { requireAdminAuth, AuthenticatedRequest } from '../auth.js';

const router = Router();

// Helper to format video URL for client consumption (streams data URLs efficiently)
function formatVideoForResponse(video: any) {
  const clone = { ...video };
  if (clone.videoUrl && clone.videoUrl.startsWith('data:video/')) {
    clone.videoUrl = `/api/videos/${clone.id}/stream`;
  }
  if (clone.parts && clone.parts.length > 0) {
    clone.parts = clone.parts.map((p: any) => {
      if (p.videoUrl && p.videoUrl.startsWith('data:video/')) {
        return { ...p, videoUrl: `/api/videos/${clone.id}/parts/${p.id}/stream` };
      }
      return p;
    });
  }
  return clone;
}

// GET /api/videos (Public & Admin)
router.get('/', (req, res) => {
  const { category, status, search } = req.query;
  const videos = db.getVideos({
    category: category as string,
    status: status as 'published' | 'draft' | undefined,
    search: search as string,
  });

  const formatted = videos.map(formatVideoForResponse);
  res.json({ videos: formatted, total: formatted.length });
});

// GET /api/videos/:id/stream (High-performance byte-range streaming for data URLs)
router.get('/:id/stream', (req, res) => {
  const video = db.getVideoById(req.params.id);
  if (!video || !video.videoUrl) {
    return res.status(404).send('Video not found');
  }

  if (video.videoUrl.startsWith('data:video/')) {
    const matches = video.videoUrl.match(/^data:([A-Za-z0-9\-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).send('Invalid video format');
    }
    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const totalSize = buffer.length;

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });
      res.end(buffer.subarray(start, end + 1));
    } else {
      res.writeHead(200, {
        'Content-Length': totalSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      });
      res.end(buffer);
    }
    return;
  }

  // If standard external URL, redirect
  res.redirect(video.videoUrl);
});

// GET /api/videos/:id/parts/:partId/stream (Streaming for multipart data URLs)
router.get('/:id/parts/:partId/stream', (req, res) => {
  const video = db.getVideoById(req.params.id);
  if (!video) return res.status(404).send('Video not found');
  const part = video.parts?.find((p) => p.id === req.params.partId);
  if (!part || !part.videoUrl) return res.status(404).send('Part not found');

  if (part.videoUrl.startsWith('data:video/')) {
    const matches = part.videoUrl.match(/^data:([A-Za-z0-9\-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).send('Invalid video format');
    }
    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const totalSize = buffer.length;

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });
      res.end(buffer.subarray(start, end + 1));
    } else {
      res.writeHead(200, {
        'Content-Length': totalSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      });
      res.end(buffer);
    }
    return;
  }

  res.redirect(part.videoUrl);
});

// GET /api/videos/:id
router.get('/:id', (req, res) => {
  const video = db.getVideoById(req.params.id);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  // Increment view count non-blocking
  db.updateVideo(video.id, { views: (video.views || 0) + 1 });

  res.json({ video: formatVideoForResponse(video) });
});

// POST /api/videos (Admin only)
router.post('/', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { title, description, thumbnailUrl, category, videoUrl, duration, status, featured, requiredAds, adProvider } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'ভিডিওর শিরোনাম আবশ্যক (Title is required)' });
  }

  const slug = title
    .toLowerCase()
    .replace(/[^\w\u0980-\u09FF-]+/g, '-')
    .replace(/^-+|-+$/g, '') || `video-${Date.now()}`;

  const defaultSettings = db.getSettings();

  const newVideo = db.createVideo({
    title,
    slug,
    description: description || '',
    thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=640&q=80',
    category: category || 'Trending',
    videoUrl: videoUrl || '',
    duration: duration || '03:30',
    status: status || 'published',
    featured: Boolean(featured),
    requiredAds: typeof requiredAds === 'number' ? requiredAds : (defaultSettings.singleNetworkAdCount || defaultSettings.defaultRequiredAds || 4),
    adProvider: adProvider || 'all',
  });

  db.logActivity(
    req.admin!.email,
    'CREATE_VIDEO',
    `Video: ${newVideo.title}`,
    `Created video ID: ${newVideo.id}`
  );

  res.status(201).json({ video: newVideo });
});

// PUT /api/videos/:id (Admin only)
router.put('/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const updated = db.updateVideo(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Video not found' });
  }

  db.logActivity(
    req.admin!.email,
    'UPDATE_VIDEO',
    `Video: ${updated.title}`,
    `Updated video properties`
  );

  res.json({ video: updated });
});

// DELETE /api/videos/:id (Admin only)
router.delete('/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const video = db.getVideoById(req.params.id);
  const success = db.deleteVideo(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Video not found' });
  }

  db.logActivity(
    req.admin!.email,
    'DELETE_VIDEO',
    `Video: ${video?.title || req.params.id}`,
    `Deleted video and associated parts`
  );

  res.json({ success: true, message: 'Video deleted' });
});

// POST /api/videos/:id/parts (Add video part)
router.post('/:id/parts', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const video = db.getVideoById(req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });

  const { partTitle, title, videoUrl, duration, requiredAds, adProvider } = req.body;
  const currentPartsCount = video.parts ? video.parts.length : 0;

  const newPart = db.addVideoPart({
    videoId: video.id,
    partNumber: currentPartsCount + 1,
    partTitle: partTitle || title || `ভিডিও অংশ ${currentPartsCount + 1}`,
    videoUrl: videoUrl || video.videoUrl,
    duration: duration || '02:45',
    requiredAds: typeof requiredAds === 'number' ? requiredAds : video.requiredAds,
    adProvider: adProvider || video.adProvider || 'all',
    status: 'active',
    sortOrder: currentPartsCount + 1,
  });

  db.logActivity(req.admin!.email, 'ADD_VIDEO_PART', `Video: ${video.title}`, `Added Part ${newPart.partNumber}`);

  res.status(201).json({ part: newPart });
});

// PUT /api/videos/:id/parts/:partId
router.put('/:id/parts/:partId', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const updatedPart = db.updateVideoPart(req.params.partId, req.body);
  if (!updatedPart) return res.status(404).json({ error: 'Video part not found' });

  db.logActivity(req.admin!.email, 'UPDATE_VIDEO_PART', `Part: ${updatedPart.partTitle}`, `Updated part properties`);
  res.json({ part: updatedPart });
});

// DELETE /api/videos/:id/parts/:partId
router.delete('/:id/parts/:partId', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const success = db.deleteVideoPart(req.params.partId);
  if (!success) return res.status(404).json({ error: 'Part not found' });

  db.logActivity(req.admin!.email, 'DELETE_VIDEO_PART', `Part ID: ${req.params.partId}`, `Deleted part`);
  res.json({ success: true });
});

// GET /api/videos/meta/categories
router.get('/meta/categories', (_req, res) => {
  res.json({ categories: db.getCategories() });
});

export default router;
