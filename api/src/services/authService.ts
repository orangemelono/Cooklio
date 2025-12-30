import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { redisClient } from '../database/redis';
import { UserModel, User, CreateUserInput } from '../models/user';
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyCodeRequest,
  LoginResponse,
  RegisterResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  VerifyCodeResponse
} from '../types/auth';
import pool from '../database/connection';

// Import nodemailer using require for compatibility
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_key';

export class AuthService {
  static async register(userData: RegisterRequest): Promise<RegisterResponse> {
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const existingUsername = await UserModel.findByUsername(userData.username);
    if (existingUsername) {
      throw new Error('Username already taken');
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Create user
    const createUserInput: CreateUserInput = {
      ...userData,
      password: hashedPassword
    };

    const user = await UserModel.create(createUserInput);

    // Generate verification code
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Store verification code in database
    await UserModel.setVerificationCode(user.id, verificationCode);

    // Store verification code in Redis with expiration (15 minutes)
    await redisClient.setEx(`verification_code:${verificationCode}`, 900, user.id.toString());

    // Send verification email
    await this.sendVerificationEmail(user.email, verificationCode, user.first_name || user.username);

    return {
      message: 'User registered successfully. Please verify your email using the code sent to your email.',
      userId: user.id
    };
  }

  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Find user by email
    const user = await UserModel.findByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is verified
    if (!user.is_verified) {
      throw new Error('Please verify your email before logging in');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token in database
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

    const refreshTokenQuery = `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
    `;
    await pool.query(refreshTokenQuery, [user.id, refreshToken, refreshTokenExpiry]);

    // Cache user data in Redis
    await redisClient.setEx(`user:${user.id}`, 3600, JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name
    }));

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name
      },
      accessToken,
      refreshToken
    };
  }

  static async verifyCode(request: VerifyCodeRequest): Promise<VerifyCodeResponse> {
    // First check if code exists in Redis
    const userIdFromRedis = await redisClient.get(`verification_code:${request.code}`);

    if (!userIdFromRedis) {
      // If not in Redis, try database (for backward compatibility)
      const user = await UserModel.verifyUser(request.code);
      if (!user) {
        throw new Error('Invalid or expired verification code');
      }
      return {
        message: 'Email verified successfully'
      };
    }

    // If code exists in Redis, verify the user and delete the code
    const userId = parseInt(userIdFromRedis);
    const user = await UserModel.findById(userId);

    if (!user || user.verification_code !== request.code) {
      // Invalid code
      await redisClient.del(`verification_code:${request.code}`);
      throw new Error('Invalid verification code');
    }

    // Update user as verified
    await UserModel.update(userId, { is_verified: true, verification_code: null });

    // Delete the verification code from Redis
    await redisClient.del(`verification_code:${request.code}`);

    return {
      message: 'Email verified successfully'
    };
  }

  static async forgotPassword(request: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const user = await UserModel.findByEmail(request.email);
    if (!user) {
      // Don't reveal if email exists to prevent enumeration
      return {
        message: 'If the email exists, a password reset link has been sent'
      };
    }

    // Generate password reset code
    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Store reset code in database
    await UserModel.setPasswordResetCode(user.id, resetCode);

    // Store reset code in Redis with expiration (15 minutes)
    await redisClient.setEx(`reset_code:${resetCode}`, 900, user.id.toString());

    // Send password reset email
    await this.sendPasswordResetEmail(user.email, resetCode, user.first_name || user.username);

    return {
      message: 'If the email exists, a password reset link has been sent'
    };
  }

  static async resetPassword(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    // First check if code exists in Redis
    const userIdFromRedis = await redisClient.get(`reset_code:${request.code}`);

    let user: User | null = null;
    let userId: number | null = null;

    if (userIdFromRedis) {
      // If code exists in Redis, use it
      userId = parseInt(userIdFromRedis);
      user = await UserModel.findById(userId);

      if (!user || user.password_reset_code !== request.code) {
        // Invalid code
        await redisClient.del(`reset_code:${request.code}`);
        throw new Error('Invalid reset code');
      }
    } else {
      // If not in Redis, try database (for backward compatibility)
      user = await UserModel.verifyPasswordResetCode(request.code);
      if (!user) {
        throw new Error('Invalid or expired reset code');
      }
      userId = user.id;
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(request.newPassword, saltRounds);

    // Update user's password
    await UserModel.update(userId, { password_hash: hashedPassword });

    // Clear the reset code from database
    await UserModel.clearPasswordResetCode(userId);

    // Delete the reset code from Redis if it exists
    await redisClient.del(`reset_code:${request.code}`);

    return {
      message: 'Password reset successfully'
    };
  }

  static async refreshToken(refreshToken: string): Promise<{ accessToken: string } | null> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: number };

      // Check if refresh token exists in database
      const tokenCheckQuery = `
        SELECT * FROM refresh_tokens
        WHERE token = $1 AND user_id = $2 AND expires_at > NOW()
      `;
      const tokenResult = await pool.query(tokenCheckQuery, [refreshToken, decoded.userId]);

      if (tokenResult.rows.length === 0) {
        return null;
      }

      // Generate new access token
      // Try to get user from cache first
      const cachedUser = await redisClient.get(`user:${decoded.userId}`);
      let user;

      if (cachedUser) {
        user = JSON.parse(cachedUser);
      } else {
        user = await UserModel.findById(decoded.userId);
        if (user) {
          // Cache the user data
          await redisClient.setEx(`user:${user.id}`, 3600, JSON.stringify({
            id: user.id,
            email: user.email,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name
          }));
        }
      }

      if (!user) {
        return null;
      }

      const newAccessToken = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      return { accessToken: newAccessToken };
    } catch (error) {
      return null;
    }
  }

  static async logout(userId: number, refreshToken: string): Promise<void> {
    // Remove refresh token from database
    const deleteQuery = 'DELETE FROM refresh_tokens WHERE user_id = $1 AND token = $2';
    await pool.query(deleteQuery, [userId, refreshToken]);

    // Invalidate user cache
    await redisClient.del(`user:${userId}`);
  }

  private static createTransporter() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  static async sendVerificationEmail(email: string, code: string, name: string): Promise<void> {
    const transporter = this.createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Cooklio, ${name}!</h2>
          <p>Thank you for registering. Please use the following verification code to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 24px; font-weight: bold; background-color: #f0f0f0; padding: 10px 20px; border-radius: 5px; letter-spacing: 3px;">
              ${code}
            </span>
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't create an account with us, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">This is an automated email from Cooklio. Please do not reply to this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  }

  static async sendPasswordResetEmail(email: string, code: string, name: string): Promise<void> {
    const transporter = this.createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>You requested to reset your password. Please use the following code to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 24px; font-weight: bold; background-color: #f0f0f0; padding: 10px 20px; border-radius: 5px; letter-spacing: 3px;">
              ${code}
            </span>
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">This is an automated email from Cooklio. Please do not reply to this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  }
}