// ─────────────────────────────────────────────────────────────
// HostelDekho — Development Server (No Database Required)
// Serves the API with mock data for local development
// ─────────────────────────────────────────────────────────────

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const path = require('path');

const app = express();

// ── Middleware ───────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ── Mock Data ───────────────────────────────────────────
const mockProperties = [
  {
    id: 'prop_1',
    ownerId: 'owner_1',
    title: 'Nestline CoLiving',
    slug: 'nestline-coliving-blr',
    description: 'Premium co-living space near tech parks in Koramangala.',
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
    verified: true,
    status: 'ACTIVE',
    featured: true,
    totalRating: 4.8,
    totalReviews: 126,
    images: [{ url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80' }],
    rooms: [
      { id: 'room_1', name: 'Triple Sharing', sharingType: 'TRIPLE_SHARING', pricePerMonth: 9500, deposit: 9500, totalBeds: 12, availableBeds: 4, hasAc: false },
      { id: 'room_2', name: 'Double Sharing', sharingType: 'DOUBLE_SHARING', pricePerMonth: 12500, deposit: 12500, totalBeds: 8, availableBeds: 2, hasAc: true },
      { id: 'room_3', name: 'Private Room', sharingType: 'SINGLE', pricePerMonth: 18000, deposit: 18000, totalBeds: 4, availableBeds: 1, hasAc: true },
    ],
    tag: 'Verified',
    best: 'Near tech parks',
  },
  {
    id: 'prop_2',
    ownerId: 'owner_2',
    title: 'MetroStay Girls Hostel',
    slug: 'metrostay-girls-hostel-del',
    description: 'Safe and homely girls hostel in Lajpat Nagar.',
    type: 'GIRLS_HOSTEL',
    genderAllowed: 'GIRLS',
    address: 'Lajpat Nagar II',
    city: 'Delhi',
    state: 'Delhi',
    latitude: 28.5672,
    longitude: 77.2410,
    priceStartingFrom: 8200,
    depositAmount: 8200,
    foodIncluded: true,
    wifiIncluded: true,
    verified: true,
    status: 'ACTIVE',
    featured: true,
    totalRating: 4.7,
    totalReviews: 89,
    images: [{ url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80' }],
    rooms: [
      { id: 'room_4', name: 'Triple Sharing', sharingType: 'TRIPLE_SHARING', pricePerMonth: 8200, deposit: 8200, totalBeds: 15, availableBeds: 5 },
      { id: 'room_5', name: 'Double Sharing', sharingType: 'DOUBLE_SHARING', pricePerMonth: 11000, deposit: 11000, totalBeds: 10, availableBeds: 3 },
    ],
    tag: 'Popular',
    best: 'Meals included',
  },
  {
    id: 'prop_3',
    ownerId: 'owner_1',
    title: 'StudySquare Boys Hostel',
    slug: 'studysquare-boys-hostel-pune',
    description: 'Quiet study-focused boys hostel in Kothrud, Pune.',
    type: 'BOYS_HOSTEL',
    genderAllowed: 'BOYS',
    address: 'Kothrud, Near MIT College',
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5074,
    longitude: 73.8077,
    priceStartingFrom: 7800,
    depositAmount: 7800,
    foodIncluded: true,
    wifiIncluded: true,
    verified: true,
    status: 'ACTIVE',
    featured: true,
    totalRating: 4.6,
    totalReviews: 64,
    images: [{ url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80' }],
    rooms: [
      { id: 'room_6', name: 'Four Sharing', sharingType: 'FOUR_SHARING', pricePerMonth: 7800, deposit: 7800, totalBeds: 20, availableBeds: 8 },
    ],
    tag: 'Verified',
    best: 'Quiet study zones',
  },
  {
    id: 'prop_4',
    ownerId: 'owner_2',
    title: 'IndieRooms Studio',
    slug: 'indierooms-studio-hyd',
    description: 'Private studio apartments in Hitech City, Hyderabad.',
    type: 'FLAT',
    genderAllowed: 'UNISEX',
    address: 'Hitech City, Madhapur',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.4435,
    longitude: 78.3772,
    priceStartingFrom: 12000,
    depositAmount: 24000,
    wifiIncluded: true,
    acAvailable: true,
    verified: true,
    status: 'ACTIVE',
    featured: true,
    totalRating: 4.9,
    totalReviews: 42,
    images: [{ url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80' }],
    rooms: [
      { id: 'room_7', name: 'Studio Apartment', sharingType: 'SINGLE', pricePerMonth: 12000, deposit: 24000, totalBeds: 6, availableBeds: 2, hasAc: true },
    ],
    tag: 'Best for you',
    best: 'Private room',
  },
];

const mockUsers = new Map([
  ['9999999999', {
    id: 'admin_dev',
    name: 'Admin',
    email: 'admin@hosteldekho.com',
    mobile: '9999999999',
    password: 'admin123456',
    role: 'ADMIN',
    createdAt: new Date(),
  }],
]);
const mockBookings = [];
const mockWishlist = new Map();

// ── Helpers ─────────────────────────────────────────────
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'hosteldekho_dev_access_secret_2026';

const generateToken = (user) => jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
const publicUser = ({ password: _password, ...user }) => user;
const userCreatedProperties = () => mockProperties.filter((property) => !/^prop_\d+$/.test(property.id));

const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const success = (res, code, message, data, meta) => {
  const response = { success: true, message, data };
  if (meta) response.meta = meta;
  res.status(code).json(response);
};

// ─────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  success(res, 200, 'HostelDekho API is running (dev mode)', {
    timestamp: new Date().toISOString(),
    environment: 'development',
    mode: 'mock-data (no database)',
    modules: ['auth', 'properties', 'search', 'bookings', 'payments', 'owner', 'kyc', 'reviews', 'chat', 'wishlist', 'admin', 'recommendations'],
  });
});

// ─────────────────────────────────────────────────────────
// AUTH MODULE
// ─────────────────────────────────────────────────────────
app.post('/api/auth/signup', (req, res) => {
  const { name, mobile, email, role } = req.body;
  if (!name || !mobile) return res.status(400).json({ success: false, message: 'Name and mobile are required' });

  if (mockUsers.has(mobile)) return res.status(409).json({ success: false, message: 'Mobile already registered' });

  const user = { id: `user_${Date.now()}`, name, mobile, email, role: role || 'USER', createdAt: new Date() };
  mockUsers.set(mobile, user);

  const accessToken = generateToken(user);
  success(res, 201, 'Account created', { user: publicUser(user), accessToken, refreshToken: `refresh_${user.id}` });
});

app.post('/api/auth/login', (req, res) => {
  const { mobile, email, password } = req.body;
  const user = [...mockUsers.values()].find((u) => u.mobile === mobile || u.email === email);
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  if (user.password && user.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const accessToken = generateToken(user);
  success(res, 200, 'Login successful', { user: publicUser(user), accessToken, refreshToken: `refresh_${user.id}` });
});

app.post('/api/auth/send-otp', (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ success: false, message: 'Mobile is required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`📱 OTP for ${mobile}: ${otp}`);

  success(res, 200, 'OTP sent', { expiresIn: '5 minutes', devOtp: otp });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { mobile } = req.body;
  let user = [...mockUsers.values()].find((u) => u.mobile === mobile);

  if (!user) {
    user = { id: `user_${Date.now()}`, name: 'User', mobile, role: 'USER', createdAt: new Date() };
    mockUsers.set(mobile, user);
  }

  const accessToken = generateToken(user);
  success(res, 200, 'OTP verified', { user, accessToken, refreshToken: `refresh_${user.id}` });
});

app.post('/api/auth/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ success: false, message: 'Google ID token is required' });
  }

  let decodedToken;
  try {
    const admin = require('./config/firebase');
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid Google ID token' });
  }

  const { uid, email, name, picture } = decodedToken;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Google account email is required' });
  }

  let user = [...mockUsers.values()].find((u) => u.email === email);
  if (!user) {
    const mobile = `google_${uid || Date.now()}`;
    user = {
      id: `google_${uid || Date.now()}`,
      name: name || 'Google User',
      email,
      mobile,
      profileImage: picture,
      role: 'USER',
      createdAt: new Date(),
    };
    mockUsers.set(mobile, user);
  }

  success(res, 200, 'Google login successful', {
    user: publicUser(user),
    accessToken: generateToken(user),
    refreshToken: `refresh_${user.id}`,
  });
});

app.post('/api/auth/logout', authMiddleware, (_req, res) => {
  success(res, 200, 'Logged out');
});

app.post('/api/auth/refresh-token', (req, res) => {
  success(res, 200, 'Token refreshed', {
    accessToken: jwt.sign({ id: 'user_dev', role: 'USER' }, JWT_SECRET, { expiresIn: '24h' }),
    refreshToken: `refresh_new_${Date.now()}`,
  });
});

// ─────────────────────────────────────────────────────────
// USER MODULE
// ─────────────────────────────────────────────────────────
app.get('/api/users/me', authMiddleware, (req, res) => {
  success(res, 200, 'User profile', {
    id: req.user.id, name: 'Dev User', email: 'dev@hosteldekho.com',
    mobile: '9876543210', role: req.user.role, gender: 'male',
    city: 'Bengaluru', occupation: 'Developer', createdAt: new Date(),
  });
});

app.put('/api/users/me', authMiddleware, (req, res) => {
  success(res, 200, 'Profile updated', { ...req.body, id: req.user.id });
});

app.get('/api/users/me/bookings', authMiddleware, (_req, res) => {
  success(res, 200, 'My bookings', mockBookings);
});

app.get('/api/users/me/wishlist', authMiddleware, (req, res) => {
  const items = mockWishlist.get(req.user.id) || [];
  const wishlistProperties = items.map((id) => mockProperties.find((p) => p.id === id)).filter(Boolean);
  success(res, 200, 'My wishlist', wishlistProperties);
});

app.put('/api/users/me/preferences', authMiddleware, (req, res) => {
  success(res, 200, 'Preferences updated', req.body);
});

app.delete('/api/users/me', authMiddleware, (req, res) => {
  success(res, 200, 'Account deactivated');
});

// ─────────────────────────────────────────────────────────
// PROPERTY MODULE
// ─────────────────────────────────────────────────────────
app.get('/api/properties/featured', (_req, res) => {
  success(res, 200, 'Featured properties', mockProperties.filter((p) => p.featured));
});

app.get('/api/properties/categories', (_req, res) => {
  const categories = [
    { type: 'PG', count: 142 },
    { type: 'BOYS_HOSTEL', count: 98 },
    { type: 'GIRLS_HOSTEL', count: 76 },
    { type: 'FLAT', count: 54 },
    { type: 'COLIVING', count: 38 },
    { type: 'ROOM', count: 22 },
  ];
  success(res, 200, 'Categories', categories);
});

app.get('/api/properties', (req, res) => {
  let results = [...mockProperties];
  if (req.query.city) results = results.filter((p) => p.city.toLowerCase().includes(req.query.city.toLowerCase()));
  if (req.query.type) results = results.filter((p) => p.type === req.query.type);

  success(res, 200, 'Properties', results, { page: 1, limit: 20, total: results.length, totalPages: 1 });
});

app.get('/api/properties/:id', (req, res) => {
  const property = mockProperties.find((p) => p.id === req.params.id || p.slug === req.params.id);
  if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

  success(res, 200, 'Property details', {
    ...property,
    owner: { id: property.ownerId, name: 'Rajesh Kumar', mobile: '9876543210' },
    reviews: [
      { id: 'rev_1', rating: 5, comment: 'Clean rooms, great food.', user: { name: 'Aarav' } },
      { id: 'rev_2', rating: 5, comment: 'Photos matched the room.', user: { name: 'Meera' } },
    ],
  });
});

app.post('/api/properties', authMiddleware, (req, res) => {
  const property = { id: `prop_${Date.now()}`, ownerId: req.user.id, ...req.body, slug: `${req.body.title?.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`, status: 'PENDING', createdAt: new Date() };
  mockProperties.push(property);
  success(res, 201, 'Property created', property);
});

app.put('/api/properties/:id', authMiddleware, (req, res) => {
  const idx = mockProperties.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
  mockProperties[idx] = { ...mockProperties[idx], ...req.body };
  success(res, 200, 'Property updated', mockProperties[idx]);
});

app.delete('/api/properties/:id', authMiddleware, (req, res) => {
  success(res, 200, 'Property deleted');
});

// Rooms
app.get('/api/properties/:propertyId/rooms', (req, res) => {
  const property = mockProperties.find((p) => p.id === req.params.propertyId);
  success(res, 200, 'Rooms', property?.rooms || []);
});

app.post('/api/properties/:propertyId/rooms', authMiddleware, (req, res) => {
  success(res, 201, 'Room created', { id: `room_${Date.now()}`, propertyId: req.params.propertyId, ...req.body });
});

// ─────────────────────────────────────────────────────────
// SEARCH MODULE
// ─────────────────────────────────────────────────────────
app.get('/api/search/properties', (req, res) => {
  let results = [...mockProperties];
  const { location, minPrice, maxPrice, gender, type, sort } = req.query;

  if (location) results = results.filter((p) => p.city.toLowerCase().includes(location.toLowerCase()));
  if (minPrice) results = results.filter((p) => p.priceStartingFrom >= parseInt(minPrice));
  if (maxPrice) results = results.filter((p) => p.priceStartingFrom <= parseInt(maxPrice));
  if (gender) results = results.filter((p) => p.genderAllowed === gender.toUpperCase() || p.genderAllowed === 'UNISEX');
  if (type) results = results.filter((p) => p.type === type);

  if (sort === 'price_low_to_high') results.sort((a, b) => a.priceStartingFrom - b.priceStartingFrom);
  if (sort === 'price_high_to_low') results.sort((a, b) => b.priceStartingFrom - a.priceStartingFrom);
  if (sort === 'rating') results.sort((a, b) => b.totalRating - a.totalRating);

  const mapPins = results.filter((p) => p.latitude).map((p) => ({
    id: p.id, lat: p.latitude, lng: p.longitude, price: p.priceStartingFrom, title: p.title,
  }));

  success(res, 200, 'Search results', { results, pagination: { page: 1, limit: 20, total: results.length }, mapPins });
});

app.get('/api/search/map-pins', (req, res) => {
  const pins = mockProperties.filter((p) => p.latitude).map((p) => ({
    id: p.id, lat: p.latitude, lng: p.longitude, price: p.priceStartingFrom, title: p.title,
  }));
  success(res, 200, 'Map pins', pins);
});

app.get('/api/filters/options', (_req, res) => {
  success(res, 200, 'Filter options', {
    types: ['PG', 'BOYS_HOSTEL', 'GIRLS_HOSTEL', 'FLAT', 'ROOM', 'COLIVING'],
    cities: ['Bengaluru', 'Delhi', 'Mumbai', 'Pune', 'Hyderabad', 'Chennai'],
    priceRange: { min: 5000, max: 25000 },
  });
});

// ─────────────────────────────────────────────────────────
// BOOKING MODULE
// ─────────────────────────────────────────────────────────
app.post('/api/bookings', authMiddleware, (req, res) => {
  const { propertyId, roomId, moveInDate, durationMonths } = req.body;
  const property = mockProperties.find((p) => p.id === propertyId);
  if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

  const room = property.rooms?.find((r) => r.id === roomId);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

  const booking = {
    id: `booking_${Date.now()}`, userId: req.user.id, propertyId, roomId,
    moveInDate, durationMonths, monthlyRent: room.pricePerMonth,
    depositAmount: room.deposit, platformFee: Math.round(room.pricePerMonth * 0.05),
    totalPayable: room.pricePerMonth + room.deposit + Math.round(room.pricePerMonth * 0.05),
    status: 'PENDING_PAYMENT', createdAt: new Date(),
    property: { title: property.title, city: property.city },
    room: { name: room.name, sharingType: room.sharingType },
  };

  mockBookings.push(booking);
  success(res, 201, 'Booking created', booking);
});

app.get('/api/bookings/my-bookings', authMiddleware, (req, res) => {
  const myBookings = mockBookings.filter((b) => b.userId === req.user.id);
  success(res, 200, 'My bookings', myBookings);
});

app.get('/api/bookings/:id', authMiddleware, (req, res) => {
  const booking = mockBookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Not found' });
  success(res, 200, 'Booking details', booking);
});

app.patch('/api/bookings/:id/cancel', authMiddleware, (req, res) => {
  const booking = mockBookings.find((b) => b.id === req.params.id);
  if (booking) booking.status = 'CANCELLED';
  success(res, 200, 'Booking cancelled', booking);
});

app.patch('/api/bookings/:id/confirm', authMiddleware, (req, res) => {
  const booking = mockBookings.find((b) => b.id === req.params.id);
  if (booking) booking.status = 'CONFIRMED';
  success(res, 200, 'Booking confirmed', booking);
});

// ─────────────────────────────────────────────────────────
// PAYMENT MODULE
// ─────────────────────────────────────────────────────────
app.post('/api/payments/create-order', authMiddleware, (req, res) => {
  const booking = mockBookings.find((b) => b.id === req.body.bookingId);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  success(res, 201, 'Payment order created (mock)', {
    orderId: `order_mock_${Date.now()}`, amount: booking.totalPayable,
    currency: 'INR', bookingId: booking.id, keyId: 'rzp_test_mock',
  });
});

app.post('/api/payments/verify', authMiddleware, (_req, res) => {
  success(res, 200, 'Payment verified (mock)', { message: 'Payment verified and booking confirmed' });
});

app.post('/api/payments/webhook/razorpay', (_req, res) => {
  success(res, 200, 'Webhook processed', { message: 'Webhook received' });
});

app.get('/api/payments/:bookingId', authMiddleware, (req, res) => {
  success(res, 200, 'Payment details', {
    bookingId: req.params.bookingId, status: 'CAPTURED', amount: 19000, currency: 'INR',
  });
});

app.post('/api/payments/refund', authMiddleware, (_req, res) => {
  success(res, 200, 'Refund initiated (mock)', { refundId: `refund_mock_${Date.now()}` });
});

// ─────────────────────────────────────────────────────────
// OWNER MODULE
// ─────────────────────────────────────────────────────────
app.get('/api/owner/dashboard', authMiddleware, (_req, res) => {
  success(res, 200, 'Owner dashboard', {
    totalProperties: 4, activeListings: 3, pendingKyc: 'APPROVED',
    totalBookings: 18, monthlyRevenue: 342000, unreadMessages: 3,
  });
});

app.get('/api/owner/properties', authMiddleware, (_req, res) => {
  success(res, 200, 'Owner properties', mockProperties.slice(0, 2));
});

app.get('/api/owner/bookings', authMiddleware, (_req, res) => {
  success(res, 200, 'Owner bookings', mockBookings);
});

app.get('/api/owner/earnings', authMiddleware, (_req, res) => {
  success(res, 200, 'Earnings', { totalEarnings: 342000, payments: [] });
});

app.get('/api/owner/leads', authMiddleware, (_req, res) => {
  success(res, 200, 'Leads', []);
});

// ─────────────────────────────────────────────────────────
// KYC MODULE
// ─────────────────────────────────────────────────────────
app.post('/api/kyc/aadhaar', authMiddleware, (req, res) => {
  success(res, 200, 'Aadhaar submitted', { aadhaarMasked: 'XXXX-XXXX-1234', status: 'UNDER_REVIEW' });
});

app.post('/api/kyc/pan', authMiddleware, (req, res) => {
  success(res, 200, 'PAN submitted', { panMasked: 'ABXXXX34F', status: 'UNDER_REVIEW' });
});

app.post('/api/kyc/property-proof', authMiddleware, (_req, res) => {
  success(res, 200, 'Property proof submitted', { status: 'UNDER_REVIEW' });
});

app.get('/api/kyc/status', authMiddleware, (_req, res) => {
  success(res, 200, 'KYC status', {
    status: 'APPROVED', steps: { aadhaar: true, pan: true, propertyProof: true, selfie: true },
  });
});

// ─────────────────────────────────────────────────────────
// WISHLIST MODULE
// ─────────────────────────────────────────────────────────
app.post('/api/wishlist/:propertyId', authMiddleware, (req, res) => {
  const items = mockWishlist.get(req.user.id) || [];
  if (!items.includes(req.params.propertyId)) items.push(req.params.propertyId);
  mockWishlist.set(req.user.id, items);
  success(res, 201, 'Added to wishlist');
});

app.delete('/api/wishlist/:propertyId', authMiddleware, (req, res) => {
  const items = (mockWishlist.get(req.user.id) || []).filter((id) => id !== req.params.propertyId);
  mockWishlist.set(req.user.id, items);
  success(res, 200, 'Removed from wishlist');
});

app.get('/api/wishlist', authMiddleware, (req, res) => {
  const items = mockWishlist.get(req.user.id) || [];
  const properties = items.map((id) => mockProperties.find((p) => p.id === id)).filter(Boolean);
  success(res, 200, 'Wishlist', properties);
});

// ─────────────────────────────────────────────────────────
// REVIEW MODULE
// ─────────────────────────────────────────────────────────
app.get('/api/reviews/property/:id', (_req, res) => {
  success(res, 200, 'Reviews', [
    { id: 'rev_1', rating: 5, comment: 'Clean rooms, great food, quick owner replies.', user: { name: 'Aarav Patel' }, createdAt: new Date() },
    { id: 'rev_2', rating: 5, comment: 'Photos matched, verification badge helped.', user: { name: 'Meera Reddy' }, createdAt: new Date() },
    { id: 'rev_3', rating: 4, comment: 'Good value for money, WiFi could be faster.', user: { name: 'Rohit Sharma' }, createdAt: new Date() },
  ]);
});

app.post('/api/reviews', authMiddleware, (req, res) => {
  success(res, 201, 'Review submitted', { id: `rev_${Date.now()}`, ...req.body, userId: req.user.id });
});

// ─────────────────────────────────────────────────────────
// CHAT MODULE
// ─────────────────────────────────────────────────────────
app.get('/api/chats', authMiddleware, (_req, res) => {
  success(res, 200, 'Chats', [
    { id: 'chat_1', property: { title: 'Nestline CoLiving' }, lastMessage: 'Is food included on weekends?', lastMessageAt: new Date() },
  ]);
});

app.post('/api/chats', authMiddleware, (req, res) => {
  success(res, 201, 'Chat created', { id: `chat_${Date.now()}`, ...req.body });
});

app.get('/api/chats/:chatId/messages', authMiddleware, (_req, res) => {
  success(res, 200, 'Messages', [
    { id: 'msg_1', content: 'Is food included on weekends?', sender: { name: 'Aarav' }, createdAt: new Date() },
    { id: 'msg_2', content: 'Yes, breakfast and dinner every day.', sender: { name: 'Owner' }, createdAt: new Date() },
  ]);
});

app.post('/api/chats/:chatId/messages', authMiddleware, (req, res) => {
  success(res, 201, 'Message sent', { id: `msg_${Date.now()}`, content: req.body.content, senderId: req.user.id });
});

// ─────────────────────────────────────────────────────────
// RECOMMENDATIONS
// ─────────────────────────────────────────────────────────
app.get('/api/recommendations', authMiddleware, (_req, res) => {
  success(res, 200, 'Recommendations', mockProperties.sort(() => Math.random() - 0.5).slice(0, 3));
});

// ─────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────
app.get('/api/stats/trust', (_req, res) => {
  const properties = userCreatedProperties();
  const confirmedBookings = mockBookings.filter((booking) => booking.status === 'CONFIRMED').length;
  const totalReviews = properties.reduce((sum, property) => sum + Number(property.totalReviews || 0), 0);

  success(res, 200, 'Trust stats', {
    verifiedProperties: properties.filter((property) => property.verified).length,
    happyUsers: [...mockUsers.values()].filter((user) => user.role !== 'ADMIN').length,
    confirmedBookings,
    totalReviews,
  });
});

// ─────────────────────────────────────────────────────────
// ADMIN MODULE
// ─────────────────────────────────────────────────────────
app.get('/api/admin/stats', authMiddleware, (_req, res) => {
  const properties = userCreatedProperties();
  const confirmedBookings = mockBookings.filter((booking) => booking.status === 'CONFIRMED').length;
  const totalRevenue = mockBookings
    .filter((booking) => booking.status === 'CONFIRMED')
    .reduce((sum, booking) => sum + Number(booking.amount || booking.totalAmount || 0), 0);

  success(res, 200, 'Platform stats', {
    totalUsers: mockUsers.size,
    activeProperties: properties.filter((property) => property.status === 'ACTIVE').length,
    confirmedBookings,
    totalRevenue,
    recentActivity: [],
  });
});

app.get('/api/admin/users', authMiddleware, (_req, res) => {
  success(res, 200, 'Users', [...mockUsers.values()].map(publicUser));
});

app.get('/api/admin/kyc/pending', authMiddleware, (_req, res) => {
  success(res, 200, 'Pending KYC', []);
});

app.get('/api/admin/properties/pending', authMiddleware, (_req, res) => {
  success(res, 200, 'Pending properties', []);
});

// ── 404 handler ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ── Start server ────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║    🏠 HostelDekho Backend (Dev Mode)             ║
  ║                                                  ║
  ║    Mode   : Mock Data (no database required)     ║
  ║    Port   : ${PORT}                                 ║
  ║    API    : http://localhost:${PORT}/api              ║
  ║    Health : http://localhost:${PORT}/api/health       ║
  ║                                                  ║
  ║    All 13 modules running with mock data ✓       ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
  `);
});

module.exports = server;
