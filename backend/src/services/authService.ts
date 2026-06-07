// src/services/authService.ts — Authentication Business Logic

import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { generateToken } from '../utils/jwtHelper';
import { createError } from '../middlewares/errorHandler';
import { User, UserPublic } from '../models/User';

export const authService = {
  /**
   * Validate credentials and return a JWT token + user info.
   */
  login: async (username: string, password: string) => {
    // 1. Find user by username
    const result = await query<User>(
      `SELECT id, username, role, is_active AS "isActive",
              password_hash AS "passwordHash",
              created_at AS "createdAt", updated_at AS "updatedAt",
              admin_name AS "adminName", shop_name AS "shopName",
              contact_phone AS "contactPhone", address, gstin
       FROM users WHERE username = $1 AND is_active = true`,
      [username.toLowerCase()]
    );

    const user = result.rows[0];
    if (!user) {
      throw createError('Invalid username or password', 401);
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw createError('Invalid username or password', 401);
    }

    // 3. Generate JWT
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const userPublic: UserPublic = {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt ?? new Date(),
      adminName: user.adminName,
      shopName: user.shopName,
      contactPhone: user.contactPhone,
      address: user.address,
      gstin: user.gstin,
    };

    return { token, user: userPublic, expiresIn: 7 * 24 * 60 * 60 }; // 7 days in seconds
  },

  /**
   * Get user by ID (for /auth/me endpoint).
   */
  getById: async (userId: number): Promise<UserPublic> => {
    const result = await query<User>(
      `SELECT id, username, role,
              created_at AS "createdAt",
              admin_name AS "adminName", shop_name AS "shopName",
              contact_phone AS "contactPhone", address, gstin
       FROM users WHERE id = $1 AND is_active = true`,
      [userId]
    );

    if (!result.rows[0]) {
      throw createError('User not found', 404);
    }

    return result.rows[0] as unknown as UserPublic;
  },

  /**
   * Update profile fields
   */
  updateProfile: async (
    userId: number,
    data: { adminName: string; shopName: string; contactPhone: string; address: string; gstin: string }
  ): Promise<UserPublic> => {
    const result = await query<User>(
      `UPDATE users
       SET admin_name = $1,
           shop_name = $2,
           contact_phone = $3,
           address = $4,
           gstin = $5,
           updated_at = NOW()
       WHERE id = $6 AND is_active = true
       RETURNING id, username, role, created_at AS "createdAt",
                 admin_name AS "adminName", shop_name AS "shopName",
                 contact_phone AS "contactPhone", address, gstin`,
      [data.adminName, data.shopName, data.contactPhone, data.address, data.gstin, userId]
    );

    if (!result.rows[0]) {
      throw createError('User not found or inactive', 404);
    }

    return result.rows[0] as unknown as UserPublic;
  },

  /**
   * Change password
   */
  changePassword: async (
    userId: number,
    oldPassword: string,
    newPassword: string
  ): Promise<void> => {
    // 1. Get user password hash
    const result = await query<User>(
      `SELECT password_hash AS "passwordHash"
       FROM users WHERE id = $1 AND is_active = true`,
      [userId]
    );

    const user = result.rows[0];
    if (!user) {
      throw createError('User not found', 404);
    }

    // 2. Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw createError('Incorrect old password', 400);
    }

    // 3. Hash new password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // 4. Save new password hash
    await query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newHash, userId]
    );
  },
};
