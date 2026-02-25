import { prisma } from '../../db/prisma';
import { TRPCError } from '@trpc/server';
import { ERROR_MESSAGES } from '@chatup/shared/src/protocol';
import { SearchService } from './search.service';

export class DialogService {
  static async assertMembership(dialogId: string, userId: string) {
    const member = await prisma.dialogMember.findUnique({
      where: { dialogId_userId: { dialogId, userId } }
    });
    if (!member) {
      throw new TRPCError({ code: 'FORBIDDEN', message: ERROR_MESSAGES.DIALOG_MEMBERSHIP_REQUIRED });
    }
    return member;
  }

  static async getOrCreateDirectDialog(userId1: string, userId2: string) {
    if (userId1 === userId2) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: ERROR_MESSAGES.DIALOG_SELF_FORBIDDEN });
    }

    if (await SearchService.isBlocked(userId1, userId2)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: ERROR_MESSAGES.DIALOG_BLOCKED });
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
    const result = await Promise.all(dialogMembers.map(async (dm) => {
      const lastMessage = dm.dialog.messages[0] || null;
      let lastMessageReadByOthers: boolean | null = null;
      const unreadCount = await prisma.message.count({
        where: {
          dialogId: dm.dialogId,
          senderId: { not: userId },
          ...(dm.lastReadAt ? { createdAt: { gt: dm.lastReadAt } } : {})
        }
      });

      if (lastMessage?.senderId === userId) {
        const readReceipt = await prisma.receipt.findFirst({
          where: {
            messageId: lastMessage.id,
            userId: { not: userId },
            readAt: { not: null },
          },
          select: { messageId: true },
        });
        lastMessageReadByOthers = !!readReceipt;
      }

      const otherUser = dm.dialog.members[0]?.user;

      return {
        id: dm.dialogId,
        title: otherUser?.displayName || 'Unknown',
        avatarUrl: otherUser?.avatarUrl || null,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          senderId: lastMessage.senderId,
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          readByOthers: lastMessageReadByOthers,
        } : null,
        unreadCount,
        updatedAt: lastMessage ? lastMessage.createdAt : dm.dialog.updatedAt
      };
    }));

    result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return result.slice(0, limit);
  }
}
