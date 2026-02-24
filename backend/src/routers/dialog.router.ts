import { protectedProcedure, router } from '../trpc/trpc';
import { z } from 'zod';
import { DialogService } from '../domain/services/dialog.service';

export const dialogRouter = router({
  getOrCreateDirect: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const dialogId = await DialogService.getOrCreateDirectDialog(ctx.user.userId, input.userId);
      return { dialogId };
    }),

  list: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ input, ctx }) => {
      return DialogService.listDialogs(ctx.user.userId, input?.limit);
    })
});
