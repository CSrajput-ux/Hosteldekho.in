// ─────────────────────────────────────────────────────────────
// Config — Prisma Database Client (Singleton)
// ─────────────────────────────────────────────────────────────

const { PrismaClient } = require('@prisma/client');
const env = require('./env');

let prisma;

if (env.isProduction) {
  prisma = new PrismaClient({
    log: ['error'],
  });
} else {
  // Reuse client in dev to avoid exhausting connections on hot-reload
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
