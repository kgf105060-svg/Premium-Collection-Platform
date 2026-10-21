import { Router } from 'express';
import { db } from '../db.js';
import { requireAdminAuth, AuthenticatedRequest } from '../auth.js';

const router = Router();

// GET /api/telegram/config (Admin only)
router.get('/config', requireAdminAuth, (_req, res) => {
  const settings = db.getSettings();
  const token = settings.botToken || process.env.BOT_TOKEN || '';
  const maskedToken = token && token.length > 12 
    ? `${token.slice(0, 10)}...${token.slice(-6)}` 
    : (token ? '••••••••' : '');

  res.json({
    botUsername: settings.botUsername || '@Advisit_bot',
    botStatus: settings.botStatus || 'online',
    webhookStatus: settings.webhookStatus || 'active',
    telegramChannelUrl: settings.telegramChannelUrl || 'https://t.me/Advisit_bot',
    telegramMiniAppUrl: settings.telegramMiniAppUrl || 'https://t.me/Advisit_bot/app',
    botToken: token,
    maskedBotToken: maskedToken,
    hasTokenConfigured: Boolean(token && token !== 'REPLACE_WITH_TELEGRAM_BOT_TOKEN'),
  });
});

// PUT /api/telegram/config (Admin only)
router.put('/config', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { botUsername, botToken, telegramChannelUrl, telegramMiniAppUrl, botStatus, webhookStatus } = req.body;
  if (botToken) {
    process.env.BOT_TOKEN = botToken;
  }
  if (botUsername) {
    process.env.BOT_USERNAME = botUsername;
  }

  const updated = db.updateSettings({
    ...(botUsername && { botUsername }),
    ...(botToken && { botToken }),
    ...(telegramChannelUrl && { telegramChannelUrl }),
    ...(telegramMiniAppUrl && { telegramMiniAppUrl }),
    ...(botStatus && { botStatus }),
    ...(webhookStatus && { webhookStatus }),
  });

  db.logActivity(
    req.admin!.email,
    'UPDATE_TELEGRAM_CONFIG',
    'Telegram Settings',
    `Updated username: ${updated.botUsername}, Token: ${updated.botToken ? 'Set' : 'Unchanged'}, Status: ${updated.botStatus}`
  );

  res.json({ success: true, settings: updated });
});

// GET /api/telegram/test-live-bot (Real Telegram Bot API getMe verification)
router.get('/test-live-bot', requireAdminAuth, async (_req, res) => {
  const settings = db.getSettings();
  const token = settings.botToken || process.env.BOT_TOKEN || '8329711123:AAG2pVo9OXB8AZYmWEzpAomKTB9sfkoGmUE';
  if (!token) {
    return res.status(400).json({ success: false, error: 'বট টোকেন কনফিগার করা নেই' });
  }

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const text = await tgRes.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        success: false,
        error: 'টেলিগ্রাম সার্ভার থেকে অপ্রত্যাশিত প্রতিক্রিয়া পাওয়া গেছে।',
      });
    }

    if (data.ok) {
      db.updateSettings({ botStatus: 'online' });
      res.json({
        success: true,
        bot: data.result,
        message: `টেলিগ্রাম বটের সাথে সফলভাবে লাইভ সংযোগ স্থাপিত হয়েছে (@${data.result.username})`,
      });
    } else {
      res.status(400).json({
        success: false,
        error: data.description || 'টেলিগ্রাম এপিআই সংযোগ ব্যর্থ হয়েছে',
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'নেটওয়ার্ক সংযোগ ত্রুটি' });
  }
});

// POST /api/telegram/simulate-command (Test bot command interaction for Admin)
router.post('/simulate-command', requireAdminAuth, (req, res) => {
  const { command } = req.body;
  const settings = db.getSettings();

  let replyText = '';
  switch (command) {
    case '/start':
      replyText = `স্বাগতম ${settings.siteName} অফিসিয়াল টেলিগ্রাম বটে! 🎬\n\nএখানে আপনি প্রতিদিনের সকল ট্রেন্ডিং ও ভাইরাল ভিডিও সরাসরি দেখতে পারবেন।\nকমান্ড তালিকা দেখতে /help টাইপ করুন।`;
      break;
    case '/videos':
      const videos = db.getVideos({ status: 'published' }).slice(0, 3);
      replyText = `🔥 আজকের শীর্ষ ভিডিও সমূহ:\n` +
        videos.map((v, i) => `${i + 1}. ${v.title} (${v.duration})\n🔗 ${settings.telegramChannelUrl}`).join('\n\n');
      break;
    case '/help':
      replyText = `📌 উপলব্ধ বট কমান্ডসমূহ:\n/start - বট চালু করুন\n/videos - সর্বশেষ ভাইরাল ভিডিও দেখুন\n/help - সাহায্য ও যোগাযোগ নির্দেশিকা\n\nসাপোর্ট: ${settings.contactEmail}`;
      break;
    default:
      replyText = `অজানা কমান্ড। অনুগ্রহ করে /help লিখে দেখুন।`;
      break;
  }

  res.json({
    success: true,
    command,
    response: replyText,
    timestamp: new Date().toISOString(),
  });
});

// POST /api/telegram/webhook (Telegram Webhook receiver)
router.post('/webhook', (req, res) => {
  // Always return 200 OK to Telegram servers
  const body = req.body;
  if (body?.message) {
    const from = body.message.from;
    if (from && from.id) {
      // Record Telegram user activity
      const existing = db.schema.telegram_users.find((u) => u.telegramId === String(from.id));
      if (!existing) {
        db.schema.telegram_users.push({
          id: `tg_${Date.now()}`,
          telegramId: String(from.id),
          username: from.username || '',
          firstName: from.first_name || '',
          joinedAt: new Date().toISOString(),
        });
        db.save();
      }
    }
  }
  res.status(200).send('OK');
});

export default router;
