import { prisma } from '../../db/prisma';
import { TRPCError } from '@trpc/server';
import { ERROR_MESSAGES, WS_EVENTS } from '@chatup/shared/src/protocol';
import { DialogService } from './dialog.service';
import { wsGateway } from '../../ws/gateway';
import { PushService } from './push.service';

export class MessageService {
  static async sendMessage(data: {
    dialogId: string;
    senderId: string;
    clientMessageId: string;
    content?: string;
  }) {
    await DialogService.assertMembership(data.dialogId, data.senderId);

    try {
      const message = await prisma.message.create({
        data: {
          dialogId: data.dialogId,
          senderId: data.senderId,
          clientMessageId: data.clientMessageId,
          content: data.content,
        }
      });

      // Update dialog updatedAt
      await prisma.dialog.update({
        where: { id: data.dialogId },
        data: { updatedAt: new Date() }
      });

      // Notify other members
      const members = await prisma.dialogMember.findMany({ where: { dialogId: data.dialogId } });
      const recipientUserIds = members.filter(m => m.userId !== data.senderId).map(m => m.userId);

      // We should deliver 'message.new' to all members including sender (for other devices),
      // but sender's current device can ignore it by clientMessageId.
      wsGateway?.emitToUsers(members.map(m => m.userId), WS_EVENTS.SERVER.NEW_MESSAGE, message);
      await PushService.notifyUsersNewMessage(recipientUserIds, {
        title: 'Новое сообщение',
        body: message.content || 'Вам отправили вложение',
        dialogId: data.dialogId,
      });

      // On per-user message.new delivery, we could auto-create Receipt.deliveredAt if done via WS ACK,
      // but typically we let the client send a 'delivered' status back. 
      // For MVP, we'll let the client call an endpoint.

      return message;
    } catch (e: any) {
      if (e.code === 'P2002') {
        // Idempotency collision
        const existingMessage = await prisma.message.findUnique({
          where: { dialogId_clientMessageId: { dialogId: data.dialogId, clientMessageId: data.clientMessageId } }
        });
        if (existingMessage) {
          return existingMessage;
        }
      }
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: ERROR_MESSAGES.MESSAGE_SEND_FAILED });
    }
  }

  static async listMessages(dialogId: string, userId: string, cursorId?: string, limit = 50) {
    await DialogService.assertMembership(dialogId, userId);

    return prisma.message.findMany({
      where: { dialogId },
      take: limit,
      ...(cursorId && { skip: 1, cursor: { id: cursorId } }),
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' } // Secondary stable sort
      ]
    });
  }

  static async markDelivered(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new TRPCError({ code: 'NOT_FOUND', message: ERROR_MESSAGES.MESSAGE_NOT_FOUND });
    
    await DialogService.assertMembership(message.dialogId, userId);

    const receipt = await prisma.receipt.upsert({
      where: { messageId_userId: { messageId, userId } },
      create: { messageId, userId, deliveredAt: new Date() },
      update: { deliveredAt: new Date() }
    });

    // Notify sender
    wsGateway?.emitToUser(message.senderId, WS_EVENTS.SERVER.DELIVERED_RECEIPT, receipt);
    return receipt;
  }

  static async markRead(dialogId: string, messageId: string, userId: string) {
    await DialogService.assertMembership(dialogId, userId);

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new TRPCError({ code: 'NOT_FOUND', message: ERROR_MESSAGES.MESSAGE_NOT_FOUND });

    const receipt = await prisma.receipt.upsert({
      where: { messageId_userId: { messageId, userId } },
      create: { messageId, userId, deliveredAt: new Date(), readAt: new Date() },
      update: { readAt: new Date() }
    });

    await prisma.dialogMember.update({
      where: { dialogId_userId: { dialogId, userId } },
      data: { lastReadMessageId: messageId, lastReadAt: new Date() }
    });

    // Notify sender
    wsGateway?.emitToUser(message.senderId, WS_EVENTS.SERVER.READ_RECEIPT, receipt);
    return receipt;
  }
}
