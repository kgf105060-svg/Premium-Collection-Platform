import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { db } from '../db.js';
import { requireAdminAuth, AuthenticatedRequest } from '../auth.js';

const router = Router();

// Ensure uploads directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Helper to get active Bunny credentials from settings or environment
function getBunnyConfig() {
  const settings = db.getSettings();
  const libraryId = settings.bunnyLibraryId || process.env.BUNNY_LIBRARY_ID || '780246';
  const cdnHostname = settings.bunnyCdnHostname || process.env.BUNNY_CDN_HOSTNAME || 'vz-52277185-b48.b-cdn.net';
  const pullZone = settings.bunnyPullZone || process.env.BUNNY_PULL_ZONE || 'vz-52277185-b48';
  const apiKey = settings.bunnyApiKey || process.env.BUNNY_API_KEY || '4053222b-1979-4467-b29343c450e0-581b-425c';
  const readonlyKey = settings.bunnyReadonlyKey || process.env.BUNNY_READONLY_KEY || 'b321b3cb-3216-42a8-8f6612a325d6-6dcb-4305';

  return {
    libraryId,
    cdnHostname,
    pullZone,
    apiKey,
    readonlyKey,
  };
}

// Format seconds into MM:SS
function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '03:30';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// GET /api/bunny/config (Admin only)
router.get('/config', requireAdminAuth, (_req, res) => {
  const { libraryId, cdnHostname, pullZone, apiKey, readonlyKey } = getBunnyConfig();

  const maskKey = (key?: string) =>
    key && key.length > 10 ? `${key.slice(0, 8)}...${key.slice(-4)}` : (key ? '••••••••' : '');

  res.json({
    libraryId,
    cdnHostname,
    pullZone,
    hasApiKey: Boolean(apiKey),
    maskedApiKey: maskKey(apiKey),
    maskedReadonlyKey: maskKey(readonlyKey),
    playerEmbedBase: `https://iframe.mediadelivery.net/play/${libraryId}`,
    cdnBaseUrl: `https://${cdnHostname}`,
  });
});

// PUT /api/bunny/config (Admin only)
router.put('/config', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { libraryId, cdnHostname, pullZone, apiKey, readonlyKey } = req.body;

  const update: Record<string, string> = {};
  if (libraryId) update.bunnyLibraryId = libraryId;
  if (cdnHostname) update.bunnyCdnHostname = cdnHostname;
  if (pullZone) update.bunnyPullZone = pullZone;
  if (apiKey) update.bunnyApiKey = apiKey;
  if (readonlyKey) update.bunnyReadonlyKey = readonlyKey;

  const updatedSettings = db.updateSettings(update as any);

  db.logActivity(
    req.admin!.email,
    'UPDATE_BUNNY_CONFIG',
    'Bunny Stream CDN',
    `Updated Library: ${updatedSettings.bunnyLibraryId}, CDN: ${updatedSettings.bunnyCdnHostname}, Pull Zone: ${updatedSettings.bunnyPullZone}`
  );

  res.json({ success: true, settings: updatedSettings });
});

// GET /api/bunny/test-connection (Admin only)
router.get('/test-connection', requireAdminAuth, async (_req, res) => {
  const { libraryId, apiKey, cdnHostname, pullZone } = getBunnyConfig();
  if (!libraryId || !apiKey) {
    return res.status(400).json({ success: false, error: 'Bunny Library ID বা API Key কনফিগার করা নেই' });
  }

  try {
    const apiRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}`, {
      headers: {
        AccessKey: apiKey,
        Accept: 'application/json',
      },
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return res.status(apiRes.status).json({
        success: false,
        error: `Bunny API ত্রুটি (${apiRes.status}): ${errText || 'সংযোগ ব্যর্থ'}`,
      });
    }

    const text = await apiRes.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        success: false,
        error: 'Bunny CDN সার্ভার থেকে অপ্রত্যাশিত প্রতিক্রিয়া পাওয়া গেছে।',
      });
    }

    res.json({
      success: true,
      libraryId,
      cdnHostname,
      pullZone,
      videoCount: data.videoCount ?? 0,
      collectionCount: data.collectionCount ?? 0,
      message: `Bunny Stream CDN লাইব্রেরি #${libraryId} এর সাথে সফলভাবে লাইভ সংযোগ স্থাপিত হয়েছে! (মোট ভিডিও: ${data.videoCount ?? 0})`,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Bunny CDN সার্ভারে সংযোগ করতে সমস্যা হয়েছে',
    });
  }
});

// GET /api/bunny/videos (List all videos stored in Bunny Stream)
router.get('/videos', async (req, res) => {
  const { libraryId, apiKey, cdnHostname } = getBunnyConfig();
  const page = parseInt(req.query.page as string, 10) || 1;
  const itemsPerPage = parseInt(req.query.itemsPerPage as string, 10) || 100;

  try {
    const apiRes = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos?page=${page}&itemsPerPage=${itemsPerPage}`,
      {
        headers: {
          AccessKey: apiKey,
          Accept: 'application/json',
        },
      }
    );

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return res.status(apiRes.status).json({
        error: `Bunny API Error: ${errText}`,
        items: [],
        totalItems: 0,
      });
    }

    const text = await apiRes.text();
    let data: any = { items: [] };
    try {
      data = JSON.parse(text);
    } catch {
      return res.json({ items: [], totalItems: 0, libraryId, cdnHostname });
    }
    const items = (data.items || []).map((v: any) => {
      const guid = v.guid;
      const directPlayUrl = `https://iframe.mediadelivery.net/play/${libraryId}/${guid}`;
      const hlsUrl = `https://${cdnHostname}/${guid}/playlist.m3u8`;
      const fallbackThumb = `https://${cdnHostname}/${guid}/thumbnail.jpg`;
      const previewUrl = `https://${cdnHostname}/${guid}/preview.webp`;
      const mp4Url = v.hasMP4Fallback ? `https://${cdnHostname}/${guid}/play_720p.mp4` : undefined;

      return {
        id: `bunny_${guid}`,
        guid,
        title: v.title || 'Bunny Stream Video',
        type: 'video' as const,
        url: directPlayUrl,
        directPlayUrl,
        hlsUrl,
        mp4Url,
        thumbnailUrl: v.thumbnailUrl || fallbackThumb,
        previewUrl,
        duration: formatDuration(v.length),
        lengthSeconds: v.length,
        status: v.status, // 0: Created, 1: Uploaded, 2: Processing, 3: Transcoding, 4: Finished, 5: Error
        statusLabel:
          v.status === 4 ? 'Ready' : v.status === 3 ? 'Transcoding' : v.status === 2 ? 'Processing' : 'Uploaded',
        resolutions: v.availableResolutions || '360p,720p,1080p',
        views: v.views || 0,
        source: 'bunny' as const,
        dateUploaded: v.dateUploaded,
      };
    });

    res.json({
      success: true,
      items,
      totalItems: data.totalItems ?? items.length,
      libraryId,
      cdnHostname,
    });
  } catch (err: any) {
    res.status(500).json({
      error: err.message || 'Bunny ভিডিও তালিকা লোড করতে ব্যর্থ',
      items: [],
      totalItems: 0,
    });
  }
});

// POST /api/bunny/create-upload-session (Creates video in Bunny Stream and returns direct upload URL, bypassing Cloud Run 32MB payload limit)
router.post('/create-upload-session', async (req, res) => {
  const { libraryId, apiKey, cdnHostname } = getBunnyConfig();
  const { title, filename } = req.body;
  const videoTitle = title || filename || `Video_${Date.now()}`;

  try {
    const createRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
      method: 'POST',
      headers: {
        AccessKey: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: videoTitle }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      return res.status(createRes.status).json({
        error: `Bunny তে ভিডিও তৈরি করতে ব্যর্থ: ${errText}`,
      });
    }

    const createText = await createRes.text();
    let createdVideo: any;
    try {
      createdVideo = JSON.parse(createText);
    } catch {
      return res.status(502).json({ error: 'Bunny API থেকে অবৈধ রেসপন্স পাওয়া গেছে' });
    }

    const guid = createdVideo?.guid;
    if (!guid) {
      return res.status(500).json({ error: 'Bunny Stream থেকে ভিডিও GUID পাওয়া যায়নি' });
    }

    const directPlayUrl = `https://iframe.mediadelivery.net/play/${libraryId}/${guid}`;
    const hlsUrl = `https://${cdnHostname}/${guid}/playlist.m3u8`;
    const thumbnailUrl = `https://${cdnHostname}/${guid}/thumbnail.jpg`;
    const previewUrl = `https://${cdnHostname}/${guid}/preview.webp`;
    const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`;

    res.json({
      success: true,
      guid,
      libraryId,
      apiKey,
      cdnHostname,
      uploadUrl,
      video: {
        id: `bunny_${guid}`,
        guid,
        title: videoTitle,
        type: 'video',
        url: directPlayUrl,
        directPlayUrl,
        hlsUrl,
        thumbnailUrl,
        previewUrl,
        duration: '03:45',
        source: 'bunny',
        libraryId,
        cdnHostname,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'আপলোড সেশন তৈরি করতে সমস্যা হয়েছে' });
  }
});

// POST /api/bunny/upload-video (Upload video to Bunny Stream Library 780246)
router.post('/upload-video', async (req, res) => {
  const { libraryId, apiKey, cdnHostname } = getBunnyConfig();
  const { title, videoData, filename } = req.body;

  if (!videoData) {
    return res.status(400).json({ error: 'ভিডিও ফাইল বা ডেটা প্রদান করা হয়নি (Missing video data)' });
  }

  const videoTitle = title || filename || `Video_${Date.now()}`;

  try {
    // 1. Create Video Object in Bunny Stream
    const createRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
      method: 'POST',
      headers: {
        AccessKey: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: videoTitle }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      return res.status(createRes.status).json({
        error: `Bunny তে ভিডিও তৈরি করতে ব্যর্থ: ${errText}`,
      });
    }

    const createText = await createRes.text();
    let createdVideo: any;
    try {
      createdVideo = JSON.parse(createText);
    } catch {
      return res.status(502).json({ error: 'Bunny API থেকে অবৈধ রেসপন্স পাওয়া গেছে' });
    }
    const guid = createdVideo?.guid;

    // 2. Prepare Binary Buffer
    let buffer: Buffer;
    if (typeof videoData === 'string' && videoData.startsWith('data:')) {
      const commaIdx = videoData.indexOf(',');
      const base64Data = commaIdx !== -1 ? videoData.slice(commaIdx + 1) : videoData;
      buffer = Buffer.from(base64Data, 'base64');
    } else if (typeof videoData === 'string') {
      buffer = Buffer.from(videoData, 'base64');
    } else {
      buffer = Buffer.from(videoData);
    }

    // 3. Upload Binary File to Bunny Stream
    const uploadRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`, {
      method: 'PUT',
      headers: {
        AccessKey: apiKey,
        'Content-Type': 'application/octet-stream',
      },
      body: new Uint8Array(buffer),
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return res.status(uploadRes.status).json({
        error: `Bunny Stream আপলোড ব্যর্থ: ${errText}`,
      });
    }

    const directPlayUrl = `https://iframe.mediadelivery.net/play/${libraryId}/${guid}`;
    const hlsUrl = `https://${cdnHostname}/${guid}/playlist.m3u8`;
    const thumbnailUrl = `https://${cdnHostname}/${guid}/thumbnail.jpg`;
    const previewUrl = `https://${cdnHostname}/${guid}/preview.webp`;

    res.json({
      success: true,
      message: 'ভিডিও সফলভাবে Bunny Stream CDN এ আপলোড হয়েছে!',
      video: {
        id: `bunny_${guid}`,
        guid,
        title: videoTitle,
        type: 'video',
        url: directPlayUrl,
        directPlayUrl,
        hlsUrl,
        thumbnailUrl,
        previewUrl,
        duration: '03:45',
        source: 'bunny',
        libraryId,
        cdnHostname,
      },
    });
  } catch (err: any) {
    console.error('Bunny upload error:', err);
    res.status(500).json({ error: err.message || 'ভিডিও আপলোড প্রক্রিয়াকরণে সমস্যা হয়েছে' });
  }
});

// POST /api/bunny/upload-photo (Upload image/thumbnail to permanent server media storage)
router.post('/upload-photo', (req, res) => {
  const { title, imageData, filename } = req.body;

  if (!imageData) {
    return res.status(400).json({ error: 'ছবি বা থাম্বনেইল ফাইল প্রদান করা হয়নি' });
  }

  try {
    let buffer: Buffer;
    let ext = 'jpg';

    if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      const matches = imageData.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        ext = matches[1].replace('jpeg', 'jpg');
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        const commaIdx = imageData.indexOf(',');
        buffer = Buffer.from(imageData.slice(commaIdx + 1), 'base64');
      }
    } else {
      buffer = Buffer.from(imageData, 'base64');
    }

    const uniqueName = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueName);
    fs.writeFileSync(filePath, buffer);

    const detectedUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${detectedUrl}/uploads/${uniqueName}`;

    res.json({
      success: true,
      message: 'ছবি সফলভাবে মিডিয়া স্টোরেজে আপলোড হয়েছে',
      media: {
        id: `img_${Date.now()}`,
        title: title || filename || 'গ্যালারি ছবি',
        type: 'image',
        url: fileUrl,
        source: 'upload',
      },
    });
  } catch (err: any) {
    console.error('Photo upload error:', err);
    res.status(500).json({ error: err.message || 'ছবি সংরক্ষণে সমস্যা হয়েছে' });
  }
});

// DELETE /api/bunny/videos/:guid (Delete video from Bunny Stream Library)
router.delete('/videos/:guid', requireAdminAuth, async (req: AuthenticatedRequest, res) => {
  const { libraryId, apiKey } = getBunnyConfig();
  const guid = req.params.guid;

  try {
    const delRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`, {
      method: 'DELETE',
      headers: { AccessKey: apiKey },
    });

    const delText = await delRes.text();
    let data: any = {};
    try {
      data = JSON.parse(delText);
    } catch {
      data = { raw: delText };
    }
    db.logActivity(
      req.admin!.email,
      'DELETE_BUNNY_VIDEO',
      'Bunny Stream',
      `Deleted video guid: ${guid} from Library ${libraryId}`
    );

    res.json({ success: true, message: 'ভিডিও Bunny Stream থেকে ডিলিট করা হয়েছে', data });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'ভিডিও ডিলিট করতে ব্যর্থ' });
  }
});

export default router;
