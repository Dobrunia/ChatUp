import { prisma } from '../../db/prisma';

export class SearchService {
  static async searchUsers(query: string, currentUserId: string, limit = 20) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    
    // Exact internal ID or fuzzy @username
    return prisma.user.findMany({
      where: {
        OR: [
          { id: q },
          { username: { startsWith: q } }
        ],
        id: { not: currentUserId }, // Exclude self
        // Ensure not blocked by the user we are finding, or we haven't blocked them
        // For MVP: Let's just exclude users we have blocked or who blocked us if possible
        // But simpler: just fetch and filter or do it in query
      },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
      take: limit,
    });
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
