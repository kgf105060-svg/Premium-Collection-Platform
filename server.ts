import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './server/routes/authRoutes.js';
import videoRoutes from './server/routes/videoRoutes.js';
import unlockRoutes from './server/routes/unlockRoutes.js';
import adRoutes from './server/routes/adRoutes.js';
import analyticsRoutes from './server/routes/analyticsRoutes.js';
import telegramRoutes from './server/routes/telegramRoutes.js';
import settingsRoutes from './server/routes/settingsRoutes.js';
import themeRoutes from './server/routes/themeRoutes.js';
import bunnyRoutes from './server/routes/bunnyRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();

  // CORS Middleware for Blogger integration
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Body parsers with high payload limit for media uploads, base64 thumbnails and backups
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Static uploads directory
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/videos', videoRoutes);
  app.use('/api/unlock', unlockRoutes);
  app.use('/api/ads', adRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/telegram', telegramRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/theme', themeRoutes);
  app.use('/api/bunny', bunnyRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Ensure ALL unmatched /api and /api/* calls return JSON error, NEVER fall through to HTML
  app.all(['/api', '/api/*'], (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.originalUrl || req.path} not found` });
  });

  // Global Error Handler (for payload size errors or malformed json)
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    if (err && (err.type === 'entity.too.large' || err.status === 413)) {
      return res.status(413).json({
        error: 'Payload Too Large: আপলোড করা ফাইলের সাইজ খুব বড় (সর্বোচ্চ ৫০ মেগাবাইট অনুমোদিত)। অনুগ্রহ করে ছোট ফাইল ব্যবহার করুন।',
      });
    }
    if (err) {
      console.error('Express server error:', err);
      return res.status(err.status || 500).json({
        error: err.message || 'সার্ভার প্রক্রিয়াকরণে সমস্যা হয়েছে।',
      });
    }
    next();
  });

  if (!isProduction) {
    // Vite Dev Server middleware mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
