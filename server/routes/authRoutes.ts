import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import {
  createSessionToken,
  revokeSessionToken,
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  requireAdminAuth,
  AuthenticatedRequest,
} from '../auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  if (!email || !password) {
    return res.status(400).json({ error: 'ইমেল এবং পাসওয়ার্ড আবশ্যক (Email and password required).' });
  }

  // Rate Limiting & Brute-force check
  const rateLimit = checkLoginRateLimit(ip);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `অনেক বেশি ব্যর্থ চেষ্টা! অনুগ্রহ করে ${rateLimit.remainingLockoutSeconds} সেকেন্ড অপেক্ষা করুন। (Too many attempts. Locked out for ${rateLimit.remainingLockoutSeconds}s.)`,
    });
  }

  const admin = db.findAdminByEmail(email);
  if (!admin) {
    recordFailedLogin(ip);
    return res.status(401).json({ error: 'ভুল ইমেল বা পাসওয়ার্ড (Invalid credentials).' });
  }

  const isPasswordValid = bcrypt.compareSync(password, admin.passwordHash);
  if (!isPasswordValid) {
    recordFailedLogin(ip);
    db.logActivity(email, 'LOGIN_FAILED', 'Auth', `Failed login attempt from IP: ${ip}`, ip);
    return res.status(401).json({ error: 'ভুল ইমেল বা পাসওয়ার্ড (Invalid credentials).' });
  }

  // Success
  resetLoginAttempts(ip);
  db.updateAdmin(admin.id, { lastLoginAt: new Date().toISOString() });
  const token = createSessionToken(admin);

  db.logActivity(admin.email, 'LOGIN_SUCCESS', 'Auth', `Admin logged in successfully`, ip);

  res.json({
    success: true,
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  });
});

// POST /api/auth/logout
router.post('/logout', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.headers['x-admin-token'] as string);
  if (token) revokeSessionToken(token);

  if (req.admin) {
    db.logActivity(req.admin.email, 'LOGOUT', 'Auth', 'Admin logged out');
  }

  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const admin = db.findAdminByEmail(req.admin!.email);
  if (!admin) {
    return res.status(404).json({ error: 'Admin not found' });
  }
  res.json({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });
});

export default router;
