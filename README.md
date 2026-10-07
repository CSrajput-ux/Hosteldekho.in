# 🏠 HostelDekho

### Find Your Perfect Stay — One Click Away

> **“Apka perfect hostel, bas ek click door.”**

**HostelDekho** is a full-stack accommodation discovery and booking platform designed for students, professionals, and property owners to discover, compare, list, verify, and book **hostels, PGs, rooms, flats, and co-living spaces**.

The platform combines property discovery, personalized recommendations, secure authentication, owner onboarding, KYC verification, online payments, reviews, wishlist management, real-time communication, and administrative moderation into a single ecosystem.

---

## 🌐 Project Overview

Finding reliable accommodation near a college, office, metro station, or preferred location is often difficult because information is scattered across different platforms.

HostelDekho addresses this problem by providing a centralized platform where users can:

- Search hostels, PGs, rooms and flats
- Filter properties by city, type and preferences
- View property details and available rooms
- Save favourite properties
- Book accommodation
- Make online payments
- Chat with owners
- Submit and manage reviews
- Receive personalized property recommendations

Property owners can:

- Create and manage property listings
- Upload property images
- Add rooms and pricing
- Manage availability
- Submit KYC information
- Track their listings
- Manage bookings

Administrators can:

- Manage users
- Review KYC submissions
- Approve/reject properties
- Manage featured properties
- Monitor bookings and platform activity
- View platform statistics
- Maintain system configuration
- Review audit activity

---

# ✨ Key Features

## 👨‍🎓 User Features

### 🔐 Authentication
- Mobile OTP authentication
- Email/password authentication
- Google authentication through Firebase
- JWT-based authorization
- Refresh token support
- Secure logout flow
- Role-based access control

### 🔎 Property Discovery
- Property search
- City-based filtering
- Property-type filtering
- Featured properties
- Verified properties
- Category browsing
- Room availability
- Price information
- Amenities information
- Rating and review information

### 🏡 Property Details
Users can view:

- Property name
- Address
- Location
- Property type
- Gender preference
- Pricing
- Deposit
- Available rooms
- Available beds
- Amenities
- Images
- Ratings
- Reviews
- Verification status

### ❤️ Wishlist
Users can save properties and access them later through their wishlist.

### 📅 Booking
Users can:

- Select a property
- Select a room
- Choose move-in date
- Select duration
- View rent and deposit
- Review payable amount
- Create bookings
- Cancel bookings
- Track booking status

### 💳 Online Payments
The backend supports Razorpay integration for:

- Payment order creation
- Payment verification
- Webhooks
- Payment status tracking
- Refund handling

### ⭐ Reviews & Ratings
Users can submit reviews and ratings for properties after their stay/interaction.

### 💬 Real-Time Chat
HostelDekho includes Socket.IO-based communication infrastructure for real-time user-owner messaging.

### 🤖 Personalized Recommendations
The backend contains a recommendation engine that ranks properties using factors such as:

- Budget compatibility
- City/location match
- Property rating
- Verification status
- Gender compatibility
- Food preference
- Popularity
- Availability
- Previous wishlist activity
- Previous bookings

---

# 🏢 Owner Features

Property owners can:

### ➕ List a Property
Create accommodation listings with:

- Property title
- Description
- Address
- City
- State
- Pincode
- Property type
- Gender eligibility
- Starting price
- Deposit amount
- Amenities
- Coordinates
- Images

### 🛏️ Room Management

Owners can manage:

- Room types
- Sharing configuration
- Monthly price
- Deposit
- Total beds
- Available beds
- AC availability
- Attached bathroom
- Furnishing status
- Room images

### 📸 Property Images
Property images can be uploaded and managed through the backend with Cloudinary integration.

### 📍 Location Verification
The frontend integrates address geocoding through OpenStreetMap/Nominatim and allows property locations to be verified visually through Google Maps.

### 🪪 KYC Verification

The platform supports:

- Aadhaar submission
- Selfie submission
- PAN submission
- Property proof submission
- KYC status tracking
- Admin KYC approval/rejection

---

# 🛡️ Admin Features

HostelDekho includes a dedicated administrative management layer.

### Admin Dashboard

Administrators can monitor:

- Total users
- Active properties
- Pending properties
- Confirmed bookings
- Captured revenue
- Recent platform activity

### User Management

Admins can:

- View users
- Filter users by role
- Block users
- Activate users
- Review account activity

### Property Moderation

Admins can:

- View properties
- Review pending listings
- Approve properties
- Reject properties
- Pause active properties
- Feature/unfeature properties

### KYC Moderation

Admins can:

- View pending KYC submissions
- Approve KYC
- Reject KYC
- Record audit activity
- Trigger owner notifications

### Audit Logs

Administrative actions are recorded through an audit logging system for important moderation and configuration operations.

---

# 🧠 Architecture

```text
                        ┌──────────────────────┐
                        │      User / Owner     │
                        │     Admin Interface   │
                        └──────────┬───────────┘
                                   │
                                   ▼
                    ┌────────────────────────────┐
                    │      HostelDekho UI        │
                    │   HTML + CSS + JavaScript  │
                    │        Vite Frontend       │
                    └────────────┬───────────────┘
                                 │
                                 │ REST API
                                 ▼
                    ┌────────────────────────────┐
                    │       Express Backend      │
                    │      Node.js ≥ 18          │
                    └────────────┬───────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
        ┌──────────┐       ┌──────────┐      ┌──────────┐
        │ Prisma   │       │  Redis   │      │Cloudinary│
        │ Database │       │  Cache   │      │  Images  │
        └────┬─────┘       └──────────┘      └──────────┘
             │
             ▼
        ┌───────────────┐
        │    MongoDB    │
        └───────────────┘

External Integrations
────────────────────────────────────────
Firebase Authentication
Razorpay Payments
OpenStreetMap / Nominatim
Google Maps
Socket.IO
Email Services
```

---

# 🛠️ Tech Stack

## Frontend

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Responsive UI and styling |
| JavaScript ES Modules | Frontend logic |
| Vite | Development/build tooling |
| Firebase Authentication | Google authentication |
| Fetch API | Backend communication |

## Backend

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | REST API |
| Prisma | Database ORM |
| MongoDB | Primary database |
| Redis / ioredis | Caching |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Joi | Request validation |
| Multer | File uploads |
| Cloudinary | Image storage |
| Razorpay | Payments |
| Socket.IO | Real-time communication |
| Node-Cron | Background jobs |
| Nodemailer | Email notifications |
| Winston | Application logging |
| Morgan | HTTP request logging |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |

## Testing

- Jest
- Supertest

---

# 📁 Project Structure

```text
Hosteldekho.in/
│
├── frontend/
│   ├── app.js
│   ├── firebase.js
│   ├── index.html
│   ├── styles.css
│   ├── package.json
│   └── package-lock.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── cloudinary.js
│   │   │   ├── database.js
│   │   │   ├── env.js
│   │   │   ├── firebase.js
│   │   │   ├── razorpay.js
│   │   │   └── redis.js
│   │   │
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── jobs/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── sockets/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   ├── server.js
│   │   └── server.dev.js
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   │
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── booking.test.js
│   │   ├── payment.test.js
│   │   └── property.test.js
│   │
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── LICENSE
└── .gitignore
```

---

# 🔐 Security Architecture

The backend includes multiple security-oriented layers:

- JWT authentication
- Role-based authorization
- Password hashing with bcrypt
- Joi input validation
- API rate limiting
- Helmet security headers
- Authentication middleware
- Role middleware
- Error handling middleware
- Upload validation middleware
- Audit logging
- Protected administrative operations

---

# 🔄 API Modules

The backend exposes the following major API modules:

| Module | Route | Purpose |
|---|---|---|
| Authentication | `/api/auth` | Login, signup, OTP, Google auth |
| Users | `/api/users` | User profile and preferences |
| Properties | `/api/properties` | Property management |
| Search | `/api/search` | Search and filters |
| Bookings | `/api/bookings` | Booking lifecycle |
| Payments | `/api/payments` | Razorpay integration |
| Owner | `/api/owner` | Owner dashboard |
| KYC | `/api/kyc` | Verification workflow |
| Reviews | `/api/reviews` | Ratings and reviews |
| Chat | `/api/chats` | Messaging |
| Wishlist | `/api/wishlist` | Saved properties |
| Admin | `/api/admin` | Platform moderation |

---

# 🗃️ Core Database Entities

The Prisma schema models the main platform entities including:

```text
User
│
├── Properties
├── Bookings
├── Wishlist
├── Reviews
├── Messages
├── Chats
├── Notifications
├── KYC Documents
├── OTP Records
└── Audit Logs

Property
│
├── Rooms
├── Images
├── Bookings
├── Reviews
├── Wishlist Entries
└── Chats

Booking
│
└── Payment
```

Important business states include:

### Property Status

```text
PENDING
ACTIVE
REJECTED
PAUSED
DELETED
```

### Booking Status

```text
PENDING_PAYMENT
CONFIRMED
CANCELLED
EXPIRED
CHECKED_IN
COMPLETED
```

### Payment Status

```text
CREATED
AUTHORIZED
CAPTURED
FAILED
REFUNDED
```

### KYC Status

```text
PENDING
UNDER_REVIEW
APPROVED
REJECTED
```

---

# ⚙️ Local Development Setup

## 1. Clone the repository

```bash
git clone https://github.com/CSrajput-ux/Hosteldekho.in.git

cd Hosteldekho.in
```

---

## 2. Setup Backend

```bash
cd backend

npm install
```

Create environment configuration:

```bash
cp .env.example .env
```

Configure the required database, authentication, storage, payment, Redis and email credentials.

Generate Prisma client:

```bash
npx prisma generate
```

Run the database setup/migrations appropriate to your environment:

```bash
npx prisma migrate dev
```

Optional seed:

```bash
npx prisma db seed
```

Start backend:

```bash
npm run dev
```

---

## 3. Setup Frontend

Open another terminal:

```bash
cd frontend

npm install
```

Start Vite:

```bash
npm run dev
```

Frontend development server:

```text
http://localhost:3000
```

---

# 🧪 Testing

Backend tests are included for major modules.

Run:

```bash
cd backend
npm test
```

Available test areas include:

```text
Authentication
Booking
Payment
Property
```

---

# 📦 Backend Scripts

```bash
npm run dev
```

Starts the development server using Nodemon.

```bash
npm start
```

Starts the backend using Node.js.

```bash
npm test
```

Runs the Jest test suite.

```bash
npm run lint
```

Runs ESLint.

```bash
npm run prisma:generate
```

Generates Prisma Client.

```bash
npm run prisma:seed
```

Seeds development data.

```bash
npm run prisma:studio
```

Opens Prisma Studio.

---

# 🔌 Integrations

## Firebase

Used for:

- Google Sign-In
- Frontend authentication
- Backend token verification

## Razorpay

Used for:

- Payment orders
- Payment verification
- Webhooks
- Refund processing

## Cloudinary

Used for:

- Property images
- Uploaded media
- Cloud-hosted image assets

## Redis

Used for backend caching and supporting scalable application infrastructure.

## Socket.IO

Used for real-time messaging between users and property owners.

## OpenStreetMap / Nominatim

Used by the frontend for address search and geocoding during property listing.

---

# 🚀 Product Workflow

### User Journey

```text
Open HostelDekho
      ↓
Search destination
      ↓
Apply filters
      ↓
Browse properties
      ↓
Open property details
      ↓
Check rooms & amenities
      ↓
Login / Signup
      ↓
Wishlist / Chat / Book
      ↓
Create payment order
      ↓
Complete Razorpay payment
      ↓
Booking confirmation
```

### Owner Journey

```text
Login
  ↓
Owner Dashboard
  ↓
Start Property Listing
  ↓
Enter Property Information
  ↓
Verify Location
  ↓
Upload Images
  ↓
Submit KYC
  ↓
Property Review
  ↓
Admin Approval
  ↓
Property Goes Live
  ↓
Manage Rooms & Availability
```

### Admin Journey

```text
Admin Login
     ↓
Dashboard
     ↓
Review Users / Properties / KYC
     ↓
Approve / Reject
     ↓
Monitor Platform
     ↓
View Revenue & Booking Stats
     ↓
Audit Platform Activity
```

---

# 📊 Recommendation Engine

HostelDekho contains an MVP recommendation engine that calculates a score for active properties.

The scoring model considers:

```text
Budget Match
      +
City Match
      +
Rating
      +
Verification
      +
Gender Compatibility
      +
Food Preference
      +
Popularity
      +
Room Availability
      -
Already Wishlisted
      -
Already Booked
```

Properties are then ranked according to the final score.

This architecture leaves room for future ML-based recommendation improvements.

---

# 🎯 Future Improvements

Possible next-stage improvements include:

- Advanced ML recommendations
- Map-based interactive discovery
- Better location/routing intelligence
- AI-powered hostel comparison
- Smart rent prediction
- Fraud detection
- Automated KYC verification
- Advanced analytics dashboard
- Push notifications
- Mobile applications
- Multi-city expansion
- Elasticsearch/OpenSearch based search
- Production-grade observability
- CI/CD pipelines
- Automated deployment
- Role-specific analytics
- Recommendation feedback learning

---

# 🧑‍💻 Development Philosophy

The project follows a modular backend architecture:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Database / External Services
```

This separation helps keep business logic independent from HTTP routing and makes the application easier to test, maintain and extend.

---

# 📌 Important Configuration Notes

Before production deployment, make sure environment variables and external integrations are configured correctly.

The frontend currently references the backend development API through:

```text
http://localhost:5000/api
```

For production deployment, this should be replaced with the deployed backend API URL.

Google authentication requires Firebase configuration.

Razorpay requires valid API credentials.

Cloudinary requires valid cloud credentials.

Redis and the database must be reachable from the backend environment.

Never commit:

```text
.env
Firebase service-account credentials
Razorpay secrets
Cloudinary API secrets
JWT secrets
Database credentials
```

---

# 🧭 Roadmap

```text
✅ Property Discovery
✅ Authentication
✅ OTP Login
✅ Google Authentication
✅ Property Listing
✅ Room Management
✅ Booking System
✅ Wishlist
✅ Reviews
✅ KYC Workflow
✅ Razorpay Integration
✅ Owner Dashboard
✅ Admin Dashboard
✅ Real-Time Chat Infrastructure
✅ Recommendation Engine
✅ Automated Backend Tests

🚧 Advanced AI Recommendations
🚧 Production Deployment
🚧 Advanced Maps
🚧 Mobile Applications
🚧 Advanced Analytics
```

---

# 📜 License

This project is distributed under the **MIT License**.

See the `LICENSE` file for details.

---

# 👨‍💻 Author

### CSrajput-ux

GitHub:

[https://github.com/CSrajput-ux](https://github.com/CSrajput-ux)

Project:

[https://github.com/CSrajput-ux/Hosteldekho.in](https://github.com/CSrajput-ux/Hosteldekho.in)

---

# ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.

---

## HostelDekho

**Discover. Verify. Book. Move In.**

> Making student and professional accommodation discovery simpler, safer and smarter.
