import { Router } from 'express';
import { db } from '../db.js';
import { requireAdminAuth, AuthenticatedRequest } from '../auth.js';

const router = Router();

// GET /api/settings (Public or Admin)
router.get('/', (_req, res) => {
  const s = db.getSettings();
  res.json({
    siteName: s.siteName,
    siteSubtitle: s.siteSubtitle,
    botUsername: s.botUsername,
    botStatus: s.botStatus,
    webhookStatus: s.webhookStatus,
    telegramChannelUrl: s.telegramChannelUrl,
    telegramMiniAppUrl: s.telegramMiniAppUrl || '',
    contactEmail: s.contactEmail,
    defaultRequiredAds: s.defaultRequiredAds,
    primaryAdProvider: s.primaryAdProvider,
    adDistributionMode: s.adDistributionMode || 'single_network',
    singleNetworkProvider: s.singleNetworkProvider || 'Monetag',
    singleNetworkAdCount: s.singleNetworkAdCount || 3,
    adRotationEnabled: s.adRotationEnabled,
    maintenanceMode: s.maintenanceMode,
  });
});

// PUT /api/settings (Admin only)
router.put('/', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const allowedKeys = [
    'siteName',
    'siteSubtitle',
    'botUsername',
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

  const updates: any = {};
  for (const key of allowedKeys) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  const updated = db.updateSettings(updates);
  db.logActivity(req.admin!.email, 'UPDATE_SETTINGS', 'System Settings', 'Updated general system settings');

  res.json({ success: true, settings: updated });
});

// GET /api/settings/export (Admin only)
router.get('/export', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const includeExtras = req.query.includeExtras !== 'false';
  const config = db.getFullSystemConfiguration(includeExtras);
  db.logActivity(req.admin!.email, 'EXPORT_SETTINGS', 'System Settings', 'Exported system configuration JSON file');

  if (req.query.download === 'true') {
    const filename = `system-config-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
  }

  res.json(config);
});

// POST /api/settings/import (Admin only)
router.post('/import', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'অবৈধ কনফিগারেশন ডাটা বা ফাইলের ফরম্যাট সঠিক নয়।' });
    }

    const result = db.importSystemConfiguration(payload);
    db.logActivity(
      req.admin!.email,
      'IMPORT_SETTINGS',
      'System Settings',
      `Imported configuration: Settings=${result.importedSummary.settingsUpdated}, Networks=${result.importedSummary.adNetworksUpdated}, Banners=${result.importedSummary.bannersUpdated}`
    );

    res.json({
      success: true,
      message: 'সিস্টেম কনফিগারেশন সফলভাবে ইমপোর্ট ও প্রয়োগ করা হয়েছে!',
      settings: result.settings,
      summary: result.importedSummary,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'কনফিগারেশন ইমপোর্ট করতে ব্যর্থ হয়েছে।' });
  }
});

export default router;
