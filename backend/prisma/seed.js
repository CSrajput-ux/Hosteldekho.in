// ─────────────────────────────────────────────────────────────
// Prisma Seed — Sample Data for Development
// ─────────────────────────────────────────────────────────────

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Cleaning up and seeding database...');

  // Cleanup to avoid duplicates on re-run
  await prisma.otp.deleteMany();
  await prisma.kyc.deleteMany();
  await prisma.review.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.room.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.searchLog.deleteMany();

  // ── Users ─────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123456', 12);
  const ownerPassword = await bcrypt.hash('owner123456', 12);

  const admin = await prisma.user.upsert({
    where: { mobile: '9999999999' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@hosteldekho.com',
      mobile: '9999999999',
      password: adminPassword,
      role: 'ADMIN',
      gender: 'male',
      city: 'Delhi',
    },
  });

  const owner1 = await prisma.user.upsert({
    where: { mobile: '9876543210' },
    update: {},
    create: {
      name: 'Rajesh Kumar',
      email: 'rajesh@hosteldekho.com',
      mobile: '9876543210',
      password: ownerPassword,
      role: 'OWNER',
      gender: 'male',
      city: 'Bengaluru',
    },
  });

  const owner2 = await prisma.user.upsert({
    where: { mobile: '9876543211' },
    update: {},
    create: {
      name: 'Priya Sharma',
      email: 'priya@hosteldekho.com',
      mobile: '9876543211',
      password: ownerPassword,
      role: 'OWNER',
      gender: 'female',
      city: 'Delhi',
    },
  });

  const user1 = await prisma.user.upsert({
    where: { mobile: '9123456789' },
    update: {},
    create: {
      name: 'Aarav Patel',
      email: 'aarav@example.com',
      mobile: '9123456789',
      role: 'USER',
      gender: 'male',
      city: 'Bengaluru',
      occupation: 'Student',
      collegeOrCompany: 'IIT Bengaluru',
      budgetRange: '8000-15000',
      foodPreference: 'included',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { mobile: '9123456790' },
    update: {},
    create: {
      name: 'Meera Reddy',
      email: 'meera@example.com',
      mobile: '9123456790',
      role: 'USER',
      gender: 'female',
      city: 'Delhi',
      occupation: 'Professional',
      collegeOrCompany: 'Google India',
      budgetRange: '10000-20000',
    },
  });

  // ── Properties ────────────────────────────────────────
  const property1 = await prisma.property.upsert({
    where: { slug: 'nestline-coliving-blr' },
    update: {},
    create: {
      ownerId: owner1.id,
      title: 'Nestline CoLiving',
      slug: 'nestline-coliving-blr',
      description: 'Premium co-living space near tech parks in Koramangala. Modern amenities, home-like food, and a vibrant community.',
      type: 'PG',
      genderAllowed: 'UNISEX',
      address: '4th Block, Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      latitude: 12.9352,
      longitude: 77.6245,
      priceStartingFrom: 9500,
      depositAmount: 9500,
      foodIncluded: true,
      wifiIncluded: true,
      acAvailable: true,
      laundryAvailable: true,
      cctvAvailable: true,
      powerBackup: true,
      verified: true,
      isFeatured: true,
      status: 'ACTIVE',
      totalRating: 4.8,
      totalReviews: 126,
    },
  });

  const property2 = await prisma.property.upsert({
    where: { slug: 'metrostay-girls-hostel-del' },
    update: {},
    create: {
      ownerId: owner2.id,
      title: 'MetroStay Girls Hostel',
      slug: 'metrostay-girls-hostel-del',
      description: 'Safe and homely girls hostel in Lajpat Nagar with daily meals, attached washrooms, and 24/7 security.',
      type: 'GIRLS_HOSTEL',
      genderAllowed: 'GIRLS',
      address: 'Lajpat Nagar II',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110024',
      latitude: 28.5672,
      longitude: 77.2410,
      priceStartingFrom: 8200,
      depositAmount: 8200,
      foodIncluded: true,
      wifiIncluded: true,
      cctvAvailable: true,
      verified: true,
      isFeatured: true,
      status: 'ACTIVE',
      totalRating: 4.7,
      totalReviews: 89,
    },
  });

  const property3 = await prisma.property.upsert({
    where: { slug: 'studysquare-boys-hostel-pune' },
    update: {},
    create: {
      ownerId: owner1.id,
      title: 'StudySquare Boys Hostel',
      slug: 'studysquare-boys-hostel-pune',
      description: 'Quiet study-focused boys hostel in Kothrud, Pune. Ideal for engineering and medical students.',
      type: 'BOYS_HOSTEL',
      genderAllowed: 'BOYS',
      address: 'Kothrud, Near MIT College',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411038',
      latitude: 18.5074,
      longitude: 73.8077,
      priceStartingFrom: 7800,
      depositAmount: 7800,
      foodIncluded: true,
      wifiIncluded: true,
      powerBackup: true,
      verified: true,
      isFeatured: true,
      status: 'ACTIVE',
      totalRating: 4.6,
      totalReviews: 64,
    },
  });

  const property4 = await prisma.property.upsert({
    where: { slug: 'indierooms-studio-hyd' },
    update: {},
    create: {
      ownerId: owner2.id,
      title: 'IndieRooms Studio',
      slug: 'indierooms-studio-hyd',
      description: 'Private studio apartments in Hitech City, Hyderabad. Perfect for working professionals who value privacy.',
      type: 'FLAT',
      genderAllowed: 'UNISEX',
      address: 'Hitech City, Madhapur',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500081',
      latitude: 17.4435,
      longitude: 78.3772,
      priceStartingFrom: 12000,
      depositAmount: 24000,
      wifiIncluded: true,
      acAvailable: true,
      parkingAvailable: true,
      verified: true,
      isFeatured: true,
      status: 'ACTIVE',
      totalRating: 4.9,
      totalReviews: 42,
    },
  });

  // ── Rooms ─────────────────────────────────────────────
  await prisma.room.createMany({
    data: [
      { propertyId: property1.id, name: 'Triple Sharing', sharingType: 'TRIPLE_SHARING', pricePerMonth: 9500, deposit: 9500, totalBeds: 12, availableBeds: 4, hasAc: false },
      { propertyId: property1.id, name: 'Double Sharing', sharingType: 'DOUBLE_SHARING', pricePerMonth: 12500, deposit: 12500, totalBeds: 8, availableBeds: 2, hasAc: true, hasAttachedBathroom: true },
      { propertyId: property1.id, name: 'Private Room', sharingType: 'SINGLE', pricePerMonth: 18000, deposit: 18000, totalBeds: 4, availableBeds: 1, hasAc: true, hasAttachedBathroom: true, furnished: true },
      { propertyId: property2.id, name: 'Triple Sharing', sharingType: 'TRIPLE_SHARING', pricePerMonth: 8200, deposit: 8200, totalBeds: 15, availableBeds: 5, hasAc: false },
      { propertyId: property2.id, name: 'Double Sharing', sharingType: 'DOUBLE_SHARING', pricePerMonth: 11000, deposit: 11000, totalBeds: 10, availableBeds: 3, hasAc: true },
      { propertyId: property3.id, name: 'Four Sharing', sharingType: 'FOUR_SHARING', pricePerMonth: 7800, deposit: 7800, totalBeds: 20, availableBeds: 8, hasAc: false },
      { propertyId: property3.id, name: 'Double Sharing', sharingType: 'DOUBLE_SHARING', pricePerMonth: 10500, deposit: 10500, totalBeds: 10, availableBeds: 4, hasAc: true },
      { propertyId: property4.id, name: 'Studio Apartment', sharingType: 'SINGLE', pricePerMonth: 12000, deposit: 24000, totalBeds: 6, availableBeds: 2, hasAc: true, hasAttachedBathroom: true, furnished: true },
    ],
  });

  // ── Property Images ───────────────────────────────────
  await prisma.propertyImage.createMany({
    data: [
      { propertyId: property1.id, url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80', order: 0 },
      { propertyId: property1.id, url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80', order: 1 },
      { propertyId: property2.id, url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80', order: 0 },
      { propertyId: property3.id, url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80', order: 0 },
      { propertyId: property4.id, url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80', order: 0 },
    ],
  });

  // ── Reviews ───────────────────────────────────────────
  await prisma.review.createMany({
    data: [
      { userId: user1.id, propertyId: property1.id, rating: 5, comment: 'Clean rooms, quick owner replies, and food is better than most PGs nearby. Highly recommended for tech professionals.' },
      { userId: user2.id, propertyId: property1.id, rating: 5, comment: 'The verification badge helped. Photos matched the room when I visited. Great community vibes.' },
      { userId: user2.id, propertyId: property2.id, rating: 4, comment: 'Very safe and comfortable for girls. Food quality is consistent. Only downside is limited parking.' },
      { userId: user1.id, propertyId: property3.id, rating: 5, comment: 'Perfect for students. Quiet environment, good study zones, and affordable pricing.' },
    ],
  });

  // ── KYC ───────────────────────────────────────────────
  await prisma.kyc.createMany({
    data: [
      { ownerId: owner1.id, aadhaarMasked: 'XXXX-XXXX-1234', panMasked: 'ABXXXX34F', status: 'APPROVED', verifiedAt: new Date() },
      { ownerId: owner2.id, aadhaarMasked: 'XXXX-XXXX-5678', status: 'UNDER_REVIEW' },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log(`
  📋 Seed Summary:
  ─────────────────
  Admin:  admin@hosteldekho.com / admin123456 (mobile: 9999999999)
  Owner1: rajesh@hosteldekho.com / owner123456 (mobile: 9876543210)
  Owner2: priya@hosteldekho.com / owner123456 (mobile: 9876543211)
  User1:  aarav@example.com (mobile: 9123456789)
  User2:  meera@example.com (mobile: 9123456790)
  
  Properties: 4
  Rooms: 8
  Reviews: 4
  KYC records: 2
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
