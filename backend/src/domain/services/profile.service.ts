import { prisma } from '../../db/prisma';
import { TRPCError } from '@trpc/server';
import { ERROR_MESSAGES } from '@chatup/shared/src/protocol';

export class ProfileService {
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, displayName: true, avatarUrl: true }
    });
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: ERROR_MESSAGES.USER_NOT_FOUND });
    }
    return user;
  }

  static async getProfileById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
    });
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: ERROR_MESSAGES.USER_NOT_FOUND });
    }
    return user;
  }

  static async updateProfile(userId: string, data: { displayName?: string; avatarUrl?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, username: true, displayName: true, avatarUrl: true }
    });
    return user;
  }

  static async updateUsername(userId: string, newUsername: string) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { username: newUsername },
        select: { id: true, username: true, displayName: true, avatarUrl: true }
      });
      return user;
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new TRPCError({ code: 'CONFLICT', message: ERROR_MESSAGES.USERNAME_TAKEN });
      }
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: ERROR_MESSAGES.USERNAME_UPDATE_FAILED });
    }
  }
}
