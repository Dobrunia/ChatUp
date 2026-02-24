import { protectedProcedure, router } from '../trpc/trpc';
import { z } from 'zod';
import { MessageService } from '../domain/services/message.service';

export const messageRouter = router({
  send: protectedProcedure
    .input(z.object({
      dialogId: z.string(),
      clientMessageId: z.string().uuid(),
      content: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return MessageService.sendMessage({
        dialogId: input.dialogId,
        senderId: ctx.user.userId,
        clientMessageId: input.clientMessageId,
        content: input.content,
      });
    }),

  list: protectedProcedure
    .input(z.object({
      dialogId: z.string(),
      cursorId: z.string().optional(),
      limit: z.number().min(1).max(50).default(50)
    }))
    .query(async ({ input, ctx }) => {
      return MessageService.listMessages(input.dialogId, ctx.user.userId, input.cursorId, input.limit);
    }),

  markDelivered: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return MessageService.markDelivered(input.messageId, ctx.user.userId);
    }),

  markRead: protectedProcedure
    .input(z.object({ dialogId: z.string(), messageId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return MessageService.markRead(input.dialogId, input.messageId, ctx.user.userId);
    })
});
