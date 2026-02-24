import { prisma } from '../../db/prisma';
import { TRPCError } from '@trpc/server';
import { SearchService } from './search.service';

export class DialogService {
  static async assertMembership(dialogId: string, userId: string) {
    const member = await prisma.dialogMember.findUnique({
      where: { dialogId_userId: { dialogId, userId } }
    });
    if (!member) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a member of this dialog' });
    }
    return member;
  }

  static async getOrCreateDirectDialog(userId1: string, userId2: string) {
    if (userId1 === userId2) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot create dialog with self' });
    }

    if (await SearchService.isBlocked(userId1, userId2)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Blocked by user' });
    }

    // Direct dialogs usually have exactly these two members. 
    // In MVP, a dialog with 2 members is a direct dialog.
    const sharedDialogs = await prisma.dialogMember.groupBy({
      by: ['dialogId'],
      where: { userId: { in: [userId1, userId2] } },
      having: {
        dialogId: {
          _count: {
            equals: 2
          }
        }
      }
    });

    // Check if these exact two users share a dialog
    for (const group of sharedDialogs) {
      const members = await prisma.dialogMember.findMany({ where: { dialogId: group.dialogId } });
      const memberIds = members.map(m => m.userId);
      if (memberIds.includes(userId1) && memberIds.includes(userId2) && memberIds.length === 2) {
        return group.dialogId;
      }
    }

    // Create new
    const newDialog = await prisma.dialog.create({
      data: {
        members: {
          create: [
            { userId: userId1 },
            { userId: userId2 }
          ]
        }
      }
    });

    return newDialog.id;
  }

  static async listDialogs(userId: string, limit = 20) {
    const dialogMembers = await prisma.dialogMember.findMany({
      where: { userId },
      include: {
        dialog: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1
            },
            members: {
              where: { userId: { not: userId } },
              include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } }
            }
          }
        }
      }
    });

    // Compute unread badges and sort by last message time
    const result = dialogMembers.map(dm => {
      const lastMessage = dm.dialog.messages[0] || null;
      // unread computation: in real life we count messages after lastReadAt. MVP approximation
      // Since it's an expensive count, we might just leave a boolean or do a simple count.
      const unreadCount = 0; // MVP placeholder, proper count needs separate query or view

      const otherUser = dm.dialog.members[0]?.user;

      return {
        id: dm.dialogId,
        title: otherUser?.displayName || 'Unknown',
        avatarUrl: otherUser?.avatarUrl || null,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          createdAt: lastMessage.createdAt
        } : null,
        unreadCount,
        updatedAt: lastMessage ? lastMessage.createdAt : dm.dialog.updatedAt
      };
    });

    result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return result.slice(0, limit);
  }
}
