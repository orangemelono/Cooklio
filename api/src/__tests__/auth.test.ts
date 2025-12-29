import { describe, it, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { redisClient } from '../src/database/redis';
import { UserModel } from '../src/models/user';
import { AuthService } from '../src/services/authService';

const execAsync = promisify(exec);

describe('Authentication API', () => {
  beforeAll(async () => {
    // Start the API server
    await execAsync('cd ../api && npm run dev &');
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
  });

  afterAll(async () => {
    // Stop the API server
    await execAsync('pkill -f "tsx watch src/server.ts"');
  });

  it('should register a new user', async () => {
    const userData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'securepassword123',
      firstName: 'Test',
      lastName: 'User'
    };

    const result = await AuthService.register(userData);
    expect(result.message).toContain('User registered successfully');
  });

  it('should verify user email', async () => {
    // Get the user to get their verification code
    const user = await UserModel.findByEmail('test@example.com');
    if (!user) throw new Error('User not found');

    const result = await AuthService.verifyCode({ code: user.verification_code! });
    expect(result.message).toBe('Email verified successfully');
  });

  it('should login user', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'securepassword123'
    };

    const result = await AuthService.login(loginData);
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('should handle forgot password', async () => {
    const result = await AuthService.forgotPassword({ email: 'test@example.com' });
    expect(result.message).toContain('password reset link has been sent');
  });

  it('should reset password', async () => {
    // Get the user to get their reset code
    const user = await UserModel.findByEmail('test@example.com');
    if (!user) throw new Error('User not found');

    const result = await AuthService.resetPassword({
      code: user.password_reset_code!,
      newPassword: 'newsecurepassword123'
    });
    expect(result.message).toBe('Password reset successfully');
  });
});