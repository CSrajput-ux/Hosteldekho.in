// ─────────────────────────────────────────────────────────────
// Service — Authentication
// Handles signup, login, password hashing, Google OAuth
// ─────────────────────────────────────────────────────────────

const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const ApiError = require('../utils/apiError');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/generateToken');

const SALT_ROUNDS = 12;

class AuthService {
  /**
   * Register a new user
   */
  async signup({ name, email, mobile, password, role, gender }) {
    // Check if mobile already exists
    const existingUser = await prisma.user.findUnique({ where: { mobile } });
    if (existingUser) {
      throw ApiError.conflict('Mobile number is already registered');
    }

    // Check if email already exists (if provided)
    if (email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        throw ApiError.conflict('Email is already registered');
      }
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        mobile,
        password: hashedPassword,
        role: role || 'USER',
        gender,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        createdAt: true,
      },
    });

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    return { user, accessToken, refreshToken };
  }

  /**
   * Login with email + password
   */
  async loginWithPassword({ email, mobile, password }) {
    const where = email ? { email } : { mobile };
    const user = await prisma.user.findUnique({ where });

    if (!user) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    if (!user.password) {
      throw ApiError.badRequest('This account uses OTP login. Please use Send OTP.');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login / register via verified OTP
   * If user doesn't exist, create with role USER
   */
  async loginWithOtp(mobile, name = 'User') {
    let user = await prisma.user.findUnique({ where: { mobile } });

    if (!user) {
      // Auto-register on first OTP login
      user = await prisma.user.create({
        data: { name, mobile, role: 'USER' },
      });
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Google OAuth login / signup via Firebase ID Token
   */
  async googleLogin({ idToken }) {
    if (!idToken) {
      throw ApiError.badRequest('Google ID Token is required');
    }

    let decodedToken;
    try {
      const admin = require('../config/firebase');
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      throw ApiError.unauthorized('Invalid Google ID Token');
    }

    const { email, name, picture } = decodedToken;
    
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Auto-register via Google
      user = await prisma.user.create({
        data: {
          name: name || 'Google User',
          email,
          mobile: `google_${Date.now()}`, // Placeholder mobile
          profileImage: picture,
          role: 'USER',
        },
      });
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using a valid refresh token
   */
  async refreshAccessToken(token) {
    try {
      const decoded = verifyRefreshToken(token);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw ApiError.unauthorized('Invalid refresh token');
      }

      const accessToken = generateAccessToken({ id: user.id, role: user.role });
      const refreshToken = generateRefreshToken({ id: user.id });

      return { accessToken, refreshToken };
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
  }
}

module.exports = new AuthService();
