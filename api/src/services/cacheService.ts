import { redisClient } from '../database/redis';
import { User } from '../models/user';

export class CacheService {
  static async cacheUser(user: User): Promise<void> {
    await redisClient.setEx(`user:${user.id}`, 3600, JSON.stringify(user)); // Cache for 1 hour
  }

  static async getCachedUser(userId: number): Promise<User | null> {
    const cachedUser = await redisClient.get(`user:${userId}`);
    if (cachedUser) {
      return JSON.parse(cachedUser) as User;
    }
    return null;
  }

  static async invalidateUserCache(userId: number): Promise<void> {
    await redisClient.del(`user:${userId}`);
  }

  static async cacheToken(userId: number, token: string, expiry: number): Promise<void> {
    await redisClient.setEx(`token:${token}`, expiry, userId.toString());
  }

  static async validateToken(token: string): Promise<number | null> {
    const userId = await redisClient.get(`token:${token}`);
    return userId ? parseInt(userId) : null;
  }

  static async invalidateToken(token: string): Promise<void> {
    await redisClient.del(`token:${token}`);
  }
}