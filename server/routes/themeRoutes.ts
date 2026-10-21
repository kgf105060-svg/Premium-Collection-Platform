import { Router } from 'express';
import { db } from '../db.js';
import { generateBloggerXml, ThemeConfig } from '../themeTemplate.js';

const router = Router();

// GET /api/theme/xml (Returns raw XML or JSON)
router.get('/xml', (req, res) => {
  const settings = db.getSettings();
  const format = req.query.format;
  const detectedUrl = `${req.protocol}://${req.get('host')}`;
  const apiUrl = (req.query.apiUrl as string) || process.env.APP_URL || detectedUrl;

  const config: ThemeConfig = {
    siteName: settings.siteName,
    siteSubtitle: settings.siteSubtitle,
    telegramUrl: settings.telegramChannelUrl,
    contactEmail: settings.contactEmail,
    apiBaseUrl: apiUrl,
    primaryColor: '#6366f1',
    defaultRequiredAds: settings.defaultRequiredAds,
  };

  const xmlContent = generateBloggerXml(config, db.getAdNetworks(), db.getBanners());

  if (format === 'json') {
    return res.json({
      xml: xmlContent,
      length: xmlContent.length,
      siteName: config.siteName,
      defaultRequiredAds: config.defaultRequiredAds,
      apiBaseUrl: apiUrl,
    });
  }

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.send(xmlContent);
});

// GET /api/theme/download (Downloads .xml file directly for Blogger Restore -> Upload)
router.get('/download', (req, res) => {
  const settings = db.getSettings();
  const detectedUrl = `${req.protocol}://${req.get('host')}`;
  const apiUrl = (req.query.apiUrl as string) || process.env.APP_URL || detectedUrl;

  const config: ThemeConfig = {
    siteName: settings.siteName,
    siteSubtitle: settings.siteSubtitle,
    telegramUrl: settings.telegramChannelUrl,
    contactEmail: settings.contactEmail,
    apiBaseUrl: apiUrl,
    primaryColor: '#6366f1',
    defaultRequiredAds: settings.defaultRequiredAds,
  };

  const xmlContent = generateBloggerXml(config, db.getAdNetworks(), db.getBanners());
  const filename = `premium-collection-blogger-theme-${new Date().toISOString().slice(0, 10)}.xml`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.send(xmlContent);
});

export default router;
