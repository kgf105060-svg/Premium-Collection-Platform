import { Router } from 'express';
import { db } from '../db.js';
import { requireAdminAuth, AuthenticatedRequest } from '../auth.js';

const router = Router();

// GET /api/ads/public-config (For Blogger Theme & Frontend)
router.get('/public-config', (_req, res) => {
  const networks = db.getAdNetworks().filter((n) => n.enabled);
  const banners = db.getBanners().filter((b) => b.status === 'active');
  const settings = db.getSettings();

  res.json({
    activeNetworks: networks.map((n) => ({
      name: n.name,
      priority: n.priority,
      placement: n.placement,
      config: {
        adFormat: n.config?.adFormat || 'direct_link',
        directUrl: n.config?.directUrl || '',
        zoneId: n.config?.zoneId || '',
        blockId: n.config?.blockId || '',
        scriptUrl: n.config?.scriptUrl || '',
        token: n.config?.token || '',
        customCode: n.config?.customCode || '',
        openInNewTab: n.config?.openInNewTab !== false,
        countdownSeconds: n.config?.countdownSeconds || 5,
        adCount: n.config?.adCount !== undefined ? n.config.adCount : 1,
      },
    })),
    banners: banners.map((b) => ({
      id: b.id,
      placement: b.placement,
      device: b.device,
      code: b.code,
    })),
    defaultRequiredAds: settings.defaultRequiredAds,
    adRotationEnabled: settings.adRotationEnabled,
    adDistributionMode: settings.adDistributionMode || 'single_network',
    singleNetworkProvider: settings.singleNetworkProvider || 'Monetag',
    singleNetworkAdCount: settings.singleNetworkAdCount || 4,
  });
});

// POST /api/ads/distribution (Admin only - set single network / custom quotas)
router.post('/distribution', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { adDistributionMode, singleNetworkProvider, singleNetworkAdCount, networkCounts } = req.body;

  const updates: any = {};
  if (adDistributionMode) updates.adDistributionMode = adDistributionMode;
  if (singleNetworkProvider) updates.singleNetworkProvider = singleNetworkProvider;
  if (singleNetworkAdCount) {
    updates.singleNetworkAdCount = Number(singleNetworkAdCount);
    updates.defaultRequiredAds = Number(singleNetworkAdCount);
  }

  const updatedSettings = db.updateSettings(updates);

  // If per-network counts provided (e.g. { Monetag: 2, 'Bengal Ads': 1, AdsGram: 1, GigaPub: 0 })
  if (networkCounts && typeof networkCounts === 'object') {
    const allNets = db.getAdNetworks();
    for (const [netName, count] of Object.entries(networkCounts)) {
      const match = allNets.find((n) => n.name.toLowerCase() === netName.toLowerCase());
      if (match) {
        db.updateAdNetwork(match.id, {
          config: {
            ...match.config,
            adCount: Number(count),
          },
        });
      }
    }
  }

  db.logActivity(
    req.admin!.email,
    'UPDATE_AD_DISTRIBUTION',
    `Mode: ${updates.adDistributionMode || 'single_network'}`,
    `Single: ${updates.singleNetworkProvider || ''}, Required: ${updates.singleNetworkAdCount || 4}`
  );

  res.json({
    success: true,
    settings: updatedSettings,
    networks: db.getAdNetworks(),
  });
});

// GET /api/ads/networks (Admin only)
router.get('/networks', requireAdminAuth, (_req, res) => {
  res.json({ networks: db.getAdNetworks() });
});

// PUT /api/ads/networks/:id (Admin only)
router.put('/networks/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const updated = db.updateAdNetwork(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Ad network not found' });

  db.logActivity(
    req.admin!.email,
    'UPDATE_AD_NETWORK',
    `Network: ${updated.name}`,
    `Updated network status/priority/config`
  );

  res.json({ network: updated });
});

// GET /api/ads/banners (Admin only)
router.get('/banners', requireAdminAuth, (_req, res) => {
  res.json({ banners: db.getBanners() });
});

// POST /api/ads/banners (Admin only)
router.post('/banners', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { name, code, placement, device, status, priority } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: 'ব্যানারের নাম এবং কোড আবশ্যক' });
  }

  const newBanner = db.createBanner({
    name,
    code,
    placement: placement || 'header',
    device: device || 'all',
    status: status || 'active',
    priority: Number(priority) || 1,
  });

  db.logActivity(req.admin!.email, 'CREATE_BANNER', `Banner: ${newBanner.name}`, `Placement: ${newBanner.placement}`);
  res.status(201).json({ banner: newBanner });
});

// PUT /api/ads/banners/:id (Admin only)
router.put('/banners/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const updated = db.updateBanner(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Banner not found' });

  db.logActivity(req.admin!.email, 'UPDATE_BANNER', `Banner: ${updated.name}`, `Updated status/code`);
  res.json({ banner: updated });
});

// DELETE /api/ads/banners/:id (Admin only)
router.delete('/banners/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const success = db.deleteBanner(req.params.id);
  if (!success) return res.status(404).json({ error: 'Banner not found' });

  db.logActivity(req.admin!.email, 'DELETE_BANNER', `Banner ID: ${req.params.id}`, `Deleted banner`);
  res.json({ success: true });
});

export default router;
