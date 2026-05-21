// ─────────────────────────────────────────────────────────────
// Config — Redis Client
// ─────────────────────────────────────────────────────────────

const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

let redis = null;

try {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
    lazyConnect: true,
  });

  redis.on('connect', () => {
    logger.info('✅ Redis connected');
  });

  redis.on('error', (err) => {
    logger.warn('⚠️  Redis connection error (running without cache):', err.message);
  });
} catch (err) {
  logger.warn('⚠️  Redis not available, running without cache');
  redis = null;
}

module.exports = redis;
