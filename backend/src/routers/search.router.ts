import { protectedProcedure, router } from '../trpc/trpc';
import { z } from 'zod';
import { SearchService } from '../domain/services/search.service';

export const searchRouter = router({
  users: protectedProcedure
    .input(z.object({
      query: z.string(),
      limit: z.number().min(1).max(50).default(20)
    }))
    .query(async ({ input, ctx }) => {
      return SearchService.searchUsers(input.query, ctx.user.userId, input.limit);
    }),

  blockUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await SearchService.blockUser(ctx.user.userId, input.userId);
      return { success: true };
    }),

  unblockUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await SearchService.unblockUser(ctx.user.userId, input.userId);
      return { success: true };
    })
});
