import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/authService';
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyCodeRequest
} from '../types/auth';

export class AuthController {
  static async register(request: FastifyRequest<{ Body: RegisterRequest }>, reply: FastifyReply) {
    try {
      const result = await AuthService.register(request.body);
      reply.code(201).send(result);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  }

  static async login(request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) {
    try {
      const result = await AuthService.login(request.body);
      reply.code(200).send(result);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  }

  static async verifyCode(request: FastifyRequest<{ Body: VerifyCodeRequest }>, reply: FastifyReply) {
    try {
      const result = await AuthService.verifyCode(request.body);
      reply.code(200).send(result);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  }

  static async forgotPassword(request: FastifyRequest<{ Body: ForgotPasswordRequest }>, reply: FastifyReply) {
    try {
      const result = await AuthService.forgotPassword(request.body);
      reply.code(200).send(result);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  }

  static async resetPassword(request: FastifyRequest<{ Body: ResetPasswordRequest }>, reply: FastifyReply) {
    try {
      const result = await AuthService.resetPassword(request.body);
      reply.code(200).send(result);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  }

  static async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    try {
      const refreshToken = request.headers.authorization?.split(' ')[1];
      if (!refreshToken) {
        return reply.code(401).send({ error: 'Refresh token required' });
      }

      const result = await AuthService.refreshToken(refreshToken);
      if (!result) {
        return reply.code(401).send({ error: 'Invalid refresh token' });
      }

      reply.code(200).send(result);
    } catch (error: any) {
      reply.code(500).send({ error: error.message });
    }
  }

  static async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      // @ts-ignore - userId is added by authentication middleware in a real app
      const userId = request.userId;
      const refreshToken = request.headers.authorization?.split(' ')[1];
      
      if (!refreshToken) {
        return reply.code(401).send({ error: 'Refresh token required' });
      }

      await AuthService.logout(userId, refreshToken);
      reply.code(200).send({ message: 'Logged out successfully' });
    } catch (error: any) {
      reply.code(500).send({ error: error.message });
    }
  }
}