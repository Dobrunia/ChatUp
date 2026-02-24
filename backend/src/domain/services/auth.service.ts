import argon2 from 'argon2';
import { prisma } from '../../db/prisma';
import { signAccessToken, signRefreshToken } from '../../auth/jwt';
import { TRPCError } from '@trpc/server';

export class AuthService {
  static async signup(data: { displayName: string; username: string; passwordHash: string }) {
    const { displayName, username, passwordHash } = data;
    try {
      const user = await prisma.user.create({
        data: {
          displayName,
          username,
          passwordHash,
        }
      });
      
      const accessToken = signAccessToken({ userId: user.id });
      const refreshToken = signRefreshToken({ userId: user.id });
      
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + 30); // 30 days

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: expDate
        }
      });

      return { accessToken, refreshToken, user: { id: user.id, username: user.username, displayName: user.displayName } };
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new TRPCError({ code: 'CONFLICT', message: 'Username already taken' });
      }
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create user' });
    }
  }

  static async login(username: string, passwordPlain: string) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    const valid = await argon2.verify(user.passwordHash, passwordPlain);
    if (!valid) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    const accessToken = signAccessToken({ userId: user.id });
    const refreshToken = signRefreshToken({ userId: user.id });
    
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 30);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: expDate
      }
    });

    return { accessToken, refreshToken, user: { id: user.id, username: user.username, displayName: user.displayName } };
  }

  static async logout(userId: string, refreshTokenStr?: string) {
    if (refreshTokenStr) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshTokenStr, userId }
      });
    }
  }

  static async checkUsername(username: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { username } });
    return !user;
  }
}
