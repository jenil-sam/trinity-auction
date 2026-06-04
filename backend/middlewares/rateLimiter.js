const rateLimiters = new Map();

export default function rateLimiter(options = {}) {
  const { windowMs = 60 * 1000, max = 10 } = options;

  return (req, res, next) => {
    try {
      const key = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      const entry = rateLimiters.get(key) || { count: 0, start: now };

      if (now - entry.start > windowMs) {
        // reset
        entry.count = 0;
        entry.start = now;
      }

      entry.count += 1;
      rateLimiters.set(key, entry);

      if (entry.count > max) {
        res.status(429).json({ error: 'Too many requests, slow down.' });
        return;
      }

      next();
    } catch (err) {
      next();
    }
  };
}
