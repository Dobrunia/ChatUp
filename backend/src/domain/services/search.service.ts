import { prisma } from '../../db/prisma';

export class SearchService {
  static async searchUsers(query: string, currentUserId: string, limit = 20) {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const blockedIds = await this.getBlockedUserIds(currentUserId);

    return prisma.user.findMany({
      where: {
        OR: [
          { id: q },
          { username: { startsWith: q } }
        ],
        id: { notIn: [currentUserId, ...blockedIds] },
      },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
      take: limit,
    });
  }

  private static async getBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    });
    const ids = new Set<string>();
    for (const b of blocks) {
      if (b.blockerId !== userId) ids.add(b.blockerId);
      if (b.blockedId !== userId) ids.add(b.blockedId);
    }
    return [...ids];
  }

  static async blockUser(blockerId: string, blockedId: string) {
    return prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });
  }

  static async unblockUser(blockerId: string, blockedId: string) {
    return prisma.block.delete({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
  }

  static async isBlocked(userId1: string, userId2: string) {
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId1, blockedId: userId2 },
          { blockerId: userId2, blockedId: userId1 }
        ]
      }
    });
    return !!block;
  }
}
