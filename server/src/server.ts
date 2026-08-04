/* ===================================================================
   SPACE UTILIZERS — Backend Email API Server (Express)
   Works on: localhost, VPS, Hostinger, AWS, GCP, Azure, any Node host

   Routes:
   - GET  /api/health   -> health check
   - POST /api/contact  -> contact form submission
   =================================================================== */

import * as dotenv from 'dotenv';
dotenv.config();

import express = require('express');
import cors = require('cors');
import helmetModule = require('helmet');
import rateLimitModule = require('express-rate-limit');
import { Request, Response, NextFunction } from 'express';
import { handleContactRequest, ContactRequest } from './contact-handler';

const helmet = (helmetModule as any).default || helmetModule;
const rateLimit = (rateLimitModule as any).default || rateLimitModule;

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

app.use(helmet());

const allowedOrigins: string[] = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  allowedOrigins.push(
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
  );
}

app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      const hostname = origin ? new URL(origin).hostname : '';
      if (
        hostname.endsWith('spaceutilizers.com') ||
        hostname.endsWith('vercel.app') ||
        hostname.endsWith('netlify.app')
      ) {
        return callback(null, true);
      }
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(null, false);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'X-Requested-With'],
    credentials: false,
    maxAge: 86400,
  })
);

app.use(express.json({ limit: '100kb' }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[REQ] ${req.method} ${req.path} — ${req.ip}`);
  next();
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many submissions from this IP. Please try again after 15 minutes.',
  },
  keyGenerator: (req: Request): string => {
    const fwd = req.headers['x-forwarded-for'];
    if (typeof fwd === 'string' && fwd) {
      const first = fwd.split(',')[0];
      if (first) return first.trim();
    }
    return (req.ip as string) || 'unknown';
  },
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/contact', contactLimiter, async (req: Request, res: Response) => {
  const body: ContactRequest = req.body || {};
  const result = await handleContactRequest(body, {
    headers: req.headers as Record<string, string | string[] | undefined>,
    ip: req.ip as string,
    protocol: req.protocol,
  });
  res.status(result.statusCode).json(result.body);
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Not found.' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[SERVER] Unhandled error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error.',
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║   SPACE UTILIZERS — Backend Email API Server                ║
║   Status:     ONLINE                                        ║
║   Port:       ${PORT.toString().padEnd(44)}║
║   Endpoints:                                               ║
║     GET  /api/health   -> health check                     ║
║     POST /api/contact  -> contact form submission          ║
╚══════════════════════════════════════════════════════════════╝
`);
  });
}

export default app;
