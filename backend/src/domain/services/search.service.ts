import { prisma } from '../../db/prisma';

export class SearchService {
  static async searchUsers(query: string, currentUserId: string, limit = 20, usernameOnly = false) {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const blockedIds = await this.getBlockedUserIds(currentUserId);

    const searchConditions = usernameOnly
      ? [{ id: q }, { username: { startsWith: q } }]
      : [{ id: q }, { username: { startsWith: q } }, { displayName: { contains: q } }];

    return prisma.user.findMany({
      where: {
        OR: searchConditions,
        id: { notIn: [currentUserId, ...blockedIds] },
      },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
      take: limit,
    });
  }

  static async suggestUsers(currentUserId: string, limit = 2) {
    const blockedIds = await this.getBlockedUserIds(currentUserId);
    const candidates = await prisma.user.findMany({
      where: {
        id: { notIn: [currentUserId, ...blockedIds] },
      },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
      take: 50,
    });

    // Simple in-memory shuffle for MVP random suggestions.
    for (let i = candidates.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    return candidates.slice(0, limit);
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
