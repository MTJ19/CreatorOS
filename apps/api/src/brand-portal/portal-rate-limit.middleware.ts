import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Simple in-memory sliding-window rate limiter for public portal routes.
// For production, replace with Redis-backed rate limiting via @nestjs/throttler store.

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 30;  // per IP per window

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const ipMap = new Map<string, RateLimitEntry>();

// Prune stale entries every 5 minutes to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of ipMap.entries()) {
    if (now - entry.windowStart > WINDOW_MS * 2) {
      ipMap.delete(key);
    }
  }
}, 5 * 60_000);

@Injectable()
export class PortalRateLimitMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const now = Date.now();
    const entry = ipMap.get(ip);

    if (!entry || now - entry.windowStart > WINDOW_MS) {
      // Start a new window
      ipMap.set(ip, { count: 1, windowStart: now });
      return next();
    }

    entry.count += 1;

    if (entry.count > MAX_REQUESTS) {
      res.setHeader('Retry-After', Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000).toString());
      return res.status(429).json({
        statusCode: 429,
        message: 'Too many requests to the portal. Please try again in a moment.',
        error: 'Too Many Requests',
      });
    }

    return next();
  }
}
