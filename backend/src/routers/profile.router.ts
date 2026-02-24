import { protectedProcedure, router } from '../trpc/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { ProfileService } from '../domain/services/profile.service';
import { rateLimit } from '../middlewares/rateLimit';
import { RATE_LIMITS } from '../config/constants';
import { USERNAME_VALIDATION_MESSAGE, isValidUsername, normalizeUsername } from '@chatup/shared/src/protocol';

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
      username: z.string().transform(normalizeUsername)
    }))
    .mutation(async ({ input, ctx }) => {
      rateLimit(`updateUsername:${ctx.user.userId}`, RATE_LIMITS.UPDATE_USERNAME.limit, RATE_LIMITS.UPDATE_USERNAME.windowMs);
      
      if (!isValidUsername(input.username)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: USERNAME_VALIDATION_MESSAGE });
      }

      return ProfileService.updateUsername(ctx.user.userId, input.username);
    }),
});
