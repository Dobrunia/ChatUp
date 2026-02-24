import { protectedProcedure, router } from '../trpc/trpc';
import { z } from 'zod';
import { ProfileService } from '../domain/services/profile.service';
import { rateLimit } from '../middlewares/rateLimit';

const usernameRegex = /^[a-z]{3,20}$/;

export const profileRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return ProfileService.getProfile(ctx.user.userId);
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      displayName: z.string().min(1).max(50).optional(),
      avatarUrl: z.string().url().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      return ProfileService.updateProfile(ctx.user.userId, input);
    }),

  updateUsername: protectedProcedure
    .input(z.object({
      username: z.string().trim().toLowerCase()
    }))
    .mutation(async ({ input, ctx }) => {
      rateLimit(`updateUsername:${ctx.user.userId}`, 5, 60 * 60 * 1000); // 5 times per hour
      
      if (!usernameRegex.test(input.username)) {
        throw new Error('Username must be 3-20 lowercase english letters');
      }

      return ProfileService.updateUsername(ctx.user.userId, input.username);
    }),
});
