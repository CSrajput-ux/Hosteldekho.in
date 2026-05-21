const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Please provide an email address');
    return;
  }
  
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' }
  });
  
  console.log('Success! User is now an ADMIN:', user.email);
}

main().catch(err => {
  console.error('Error updating user. Make sure the email exists.');
  prisma.$disconnect();
}).finally(() => prisma.$disconnect());
