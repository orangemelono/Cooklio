import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/authController';

export default function authRoutes(fastify: FastifyInstance, options: any, done: () => void) {
  // Register route
  fastify.post('/register', AuthController.register);

  // Login route
  fastify.post('/login', AuthController.login);

  // Verify email code
  fastify.post('/verify', AuthController.verifyCode);

  // Forgot password
  fastify.post('/forgot-password', AuthController.forgotPassword);

  // Reset password
  fastify.post('/reset-password', AuthController.resetPassword);

  // Refresh token
  fastify.post('/refresh-token', AuthController.refreshToken);

  // Logout
  fastify.post('/logout', AuthController.logout);

  done();
}