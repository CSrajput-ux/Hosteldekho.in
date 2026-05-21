// ─────────────────────────────────────────────────────────────
// Setup Exclusive Admin
// 1. Decoy: This script will delete itself after run or be cleared.
// 2. Clear all existing admins.
// 3. Setup/Update chhotu415@gmail.com with extreme security.
// ─────────────────────────────────────────────────────────────

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const MASTER_EMAIL = 'chhotu415@gmail.com';
const MASTER_PASS = 'AZ232112@s';
const SALT_ROUNDS = 12; // Extreme security level

async function start() {
  console.log('🛡️ Starting Extreme Security Setup...');

  try {
    // 1. Remove ADMIN role from EVERYONE else
    const demoted = await prisma.user.updateMany({
      where: {
        role: 'ADMIN',
        email: { not: MASTER_EMAIL }
      },
      data: { role: 'USER' }
    });
    console.log(`✅ Stripped ADMIN rights from ${demoted.count} unauthorized accounts.`);

    // 2. Create/Update the Master Admin
    const hashedPassword = await bcrypt.hash(MASTER_PASS, SALT_ROUNDS);
    
    const admin = await prisma.user.upsert({
      where: { email: MASTER_EMAIL },
      update: {
        role: 'ADMIN',
        password: hashedPassword,
        isActive: true
      },
      create: {
        email: MASTER_EMAIL,
        name: 'Master Admin',
        mobile: '0000000000', // Placeholder
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true
      }
    });

    console.log(`🚀 SUCCESS: Master Admin '${admin.email}' is now active with extreme hashing.`);
    console.log('🔒 Password stored as secure hash. Decryption is impossible.');
    
  } catch (err) {
    console.error('❌ Setup failed:', err);
  } finally {
    await prisma.$disconnect();
    console.log('👋 Setup complete. Please RELOG to use new credentials.');
  }
}

start();
