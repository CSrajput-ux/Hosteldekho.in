# HostelDekho Backend

Production-ready backend for [HostelDekho](https://hosteldekho.com) — India's hostel, PG, and room discovery platform.

## Tech Stack

| Layer        | Technology                |
| ------------ | ------------------------- |
| Runtime      | Node.js ≥ 18              |
| Framework    | Express.js                |
| Database     | PostgreSQL                |
| ORM          | Prisma                    |
| Cache        | Redis (ioredis)           |
| Auth         | JWT + bcrypt              |
| Validation   | Joi                       |
| File Upload  | Multer + Cloudinary       |
| Payments     | Razorpay                  |
| Real-time    | Socket.IO                 |
| Rate Limit   | express-rate-limit        |
| Jobs         | node-cron                 |
| Logging      | Winston + Morgan          |

## Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL ≥ 14
- Redis ≥ 7

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.example .env
# Edit .env with your real credentials

# 3. Generate Prisma client
npx prisma generate

# 4. Run database migrations
npx prisma migrate dev --name init

# 5. Seed the database (optional)
npx prisma db seed

# 6. Start development server
npm run dev
```

### Available Scripts

| Command               | Description                    |
| --------------------- | ------------------------------ |
| `npm run dev`         | Start dev server with nodemon  |
| `npm start`           | Start production server        |
| `npm test`            | Run test suite                 |
| `npm run prisma:studio` | Open Prisma Studio GUI      |

## API Overview

| Module       | Base Route              | Description                    |
| ------------ | ----------------------- | ------------------------------ |
| Auth         | `/api/auth`             | Login, signup, OTP, Google     |
| Users        | `/api/users`            | Profile, preferences           |
| Properties   | `/api/properties`       | CRUD, images, featured         |
| Search       | `/api/search`           | Filters, map pins, geo-search  |
| Bookings     | `/api/bookings`         | Booking flow                   |
| Payments     | `/api/payments`         | Razorpay integration           |
| Owner        | `/api/owner`            | Owner dashboard                |
| KYC          | `/api/kyc`              | Document verification          |
| Reviews      | `/api/reviews`          | Ratings & reviews              |
| Chat         | `/api/chats`            | Real-time messaging            |
| Wishlist     | `/api/wishlist`         | Save/unsave properties         |
| Admin        | `/api/admin`            | Moderation tools               |

## Folder Structure

```
src/
├── app.js              # Express app setup
├── server.js           # HTTP + Socket.IO server
├── config/             # Database, Redis, Cloudinary, Razorpay configs
├── routes/             # Route definitions
├── controllers/        # Request handlers
├── services/           # Business logic
├── middlewares/         # Auth, validation, error handling
├── validators/         # Joi schemas
├── utils/              # Helpers (pagination, slug, distance, etc.)
├── jobs/               # Scheduled background tasks
├── sockets/            # Socket.IO event handlers
└── constants/          # Enums and status constants
```

## License

ISC © HostelDekho
