// Simple test script to verify functionality
import { redisClient } from './src/database/redis';
import { UserModel } from './src/models/user';
import { AuthService } from './src/services/authService';

async function testAuthFlow() {
  console.log('Starting authentication flow test...');

  try {
    // Connect to Redis
    await redisClient.connect();
    console.log('✓ Connected to Redis');

    // Test registration
    console.log('\n--- Testing Registration ---');
    const registerData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'securepassword123',
      firstName: 'Test',
      lastName: 'User'
    };

    const registerResult = await AuthService.register(registerData);
    console.log('✓ Registration successful:', registerResult);

    // Get the user to get their verification code
    const user = await UserModel.findByEmail('test@example.com');
    if (!user) throw new Error('User not found after registration');
    
    console.log('Verification code:', user.verification_code);

    // Test verification
    console.log('\n--- Testing Email Verification ---');
    const verifyResult = await AuthService.verifyCode({ code: user.verification_code! });
    console.log('✓ Verification successful:', verifyResult);

    // Test login
    console.log('\n--- Testing Login ---');
    const loginResult = await AuthService.login({
      email: 'test@example.com',
      password: 'securepassword123'
    });
    console.log('✓ Login successful, access token:', loginResult.accessToken.substring(0, 20) + '...');

    // Test forgot password
    console.log('\n--- Testing Forgot Password ---');
    const forgotResult = await AuthService.forgotPassword({ email: 'test@example.com' });
    console.log('✓ Forgot password request successful:', forgotResult);

    // Get the reset code
    const userAfterForgot = await UserModel.findByEmail('test@example.com');
    if (!userAfterForgot) throw new Error('User not found after forgot password');
    
    console.log('Reset code:', userAfterForgot.password_reset_code);

    // Test reset password
    console.log('\n--- Testing Reset Password ---');
    const resetResult = await AuthService.resetPassword({
      code: userAfterForgot.password_reset_code!,
      newPassword: 'newsecurepassword123'
    });
    console.log('✓ Password reset successful:', resetResult);

    // Test login with new password
    console.log('\n--- Testing Login with New Password ---');
    const newLoginResult = await AuthService.login({
      email: 'test@example.com',
      password: 'newsecurepassword123'
    });
    console.log('✓ Login with new password successful:', newLoginResult.accessToken.substring(0, 20) + '...');

    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await redisClient.quit();
  }
}

// Run the test
testAuthFlow();