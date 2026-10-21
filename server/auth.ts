import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { db, Admin } from './db.js';

const SESSION_SECRET = process.env.SESSION_SECRET || 'premium_collection_super_secret_jwt_key_2026';
const TOKEN_EXPIRY_HOURS = 24;

// Simple in-memory session store & brute-force rate limiter
interface SessionData {
  adminId: string;
  email: string;
  role: string;
  expiresAt: number;
}

const activeSessions = new Map<string, SessionData>();

// Brute-force tracker
interface RateLimitEntry {
  attempts: number;
  lockoutUntil: number;
}
const loginAttempts = new Map<string, RateLimitEntry>();

export function checkLoginRateLimit(ip: string): { allowed: boolean; remainingLockoutSeconds?: number } {
  const entry = loginAttempts.get(ip);
  if (!entry) return { allowed: true };

  const now = Date.now();
  if (entry.lockoutUntil > now) {
    const remaining = Math.ceil((entry.lockoutUntil - now) / 1000);
    return { allowed: false, remainingLockoutSeconds: remaining };
  }

  if (entry.lockoutUntil <= now && entry.attempts >= 5) {
    // Reset after lockout passed
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLogin(ip: string) {
  const entry = loginAttempts.get(ip) || { attempts: 0, lockoutUntil: 0 };
  entry.attempts += 1;
  if (entry.attempts >= 5) {
    entry.lockoutUntil = Date.now() + 5 * 60 * 1000; // 5 min lockout
  }
  loginAttempts.set(ip, entry);
}

export function resetLoginAttempts(ip: string) {
  loginAttempts.delete(ip);
}

// Generate Secure Session Token
export function createSessionToken(admin: Admin): string {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${admin.id}:${randomBytes}`)
    .digest('hex');
  const token = `${admin.id}.${randomBytes}.${signature}`;

  activeSessions.set(token, {
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
    expiresAt: Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
  });

  return token;
}

export function verifySessionToken(token: string): SessionData | null {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return session;
}

export function revokeSessionToken(token: string) {
  activeSessions.delete(token);
}

// Express Auth Middleware
export interface AuthenticatedRequest extends Request {
  admin?: SessionData;
}

export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers['x-admin-token']) {
    token = req.headers['x-admin-token'] as string;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const session = verifySessionToken(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }

  req.admin = session;
  next();
}
