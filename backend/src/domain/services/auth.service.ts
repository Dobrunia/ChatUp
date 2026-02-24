import argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { ERROR_MESSAGES } from '@chatup/shared/src/protocol';
import { prisma } from '../../db/prisma';
import { signAccessToken, signRefreshToken } from '../../auth/jwt';
import { TRPCError } from '@trpc/server';
import { logger } from '../../utils/logger';

function isDbConnectivityError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  return ['P1001', 'P1002', 'P1008', 'P1017'].includes(error.code);
}

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
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new TRPCError({ code: 'CONFLICT', message: ERROR_MESSAGES.USERNAME_TAKEN });
        }
        if (error.code === 'P2000') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: ERROR_MESSAGES.FIELD_VALUE_TOO_LONG });
        }
      }
      if (isDbConnectivityError(error)) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: ERROR_MESSAGES.DB_UNAVAILABLE });
      }

      logger.error({ event: 'Signup failed unexpectedly', username }, error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: ERROR_MESSAGES.SIGNUP_FAILED });
    }
  }

  static async login(username: string, passwordPlain: string) {
    try {
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: ERROR_MESSAGES.INVALID_CREDENTIALS });
      }

      const valid = await argon2.verify(user.passwordHash, passwordPlain);
      if (!valid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: ERROR_MESSAGES.INVALID_CREDENTIALS });
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
    } catch (error: unknown) {
      if (error instanceof TRPCError) throw error;
      if (isDbConnectivityError(error)) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: ERROR_MESSAGES.DB_UNAVAILABLE });
      }
      logger.error({ event: 'Login failed unexpectedly', username }, error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: ERROR_MESSAGES.LOGIN_FAILED });
    }
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
