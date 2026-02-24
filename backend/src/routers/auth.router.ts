import { publicProcedure, protectedProcedure, router } from '../trpc/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import argon2 from 'argon2';
import { AuthService } from '../domain/services/auth.service';
import { rateLimit } from '../middlewares/rateLimit';
import { RATE_LIMITS } from '../config/constants';
import {
  ERROR_MESSAGES,
  LIMITS,
  USERNAME_VALIDATION_MESSAGE,
  isValidUsername,
  normalizeUsername,
} from '@chatup/shared/src/protocol';

function getIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    const parts = forwarded.split(',');
    return parts.at(-1)?.trim() || 'unknown';
  }
  return req.socket?.remoteAddress || 'unknown';
}

export const authRouter = router({
  signup: publicProcedure
    .input(z.object({
      displayName: z.string().min(1).max(50),
      username: z.string().transform(normalizeUsername),
      password: z.string().min(LIMITS.PASSWORD_MIN_LENGTH),
      passwordConfirm: z.string()
    }).refine(data => data.password === data.passwordConfirm, {
      message: ERROR_MESSAGES.PASSWORDS_DONT_MATCH,
      path: ["passwordConfirm"]
    }))
    .mutation(async ({ input, ctx }) => {
      rateLimit(`signup:${getIp(ctx.req)}`, RATE_LIMITS.SIGNUP.limit, RATE_LIMITS.SIGNUP.windowMs);

      if (!isValidUsername(input.username)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: USERNAME_VALIDATION_MESSAGE });
      }

      const passwordHash = await argon2.hash(input.password);
      return AuthService.signup({
        displayName: input.displayName,
        username: input.username,
        passwordHash,
      });
    }),

  login: publicProcedure
    .input(z.object({
      username: z.string().transform(normalizeUsername),
      password: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      rateLimit(`login:${input.username}:${getIp(ctx.req)}`, RATE_LIMITS.LOGIN.limit, RATE_LIMITS.LOGIN.windowMs);

      return AuthService.login(input.username, input.password);
    }),

  logout: protectedProcedure
    .input(z.object({ refreshToken: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      await AuthService.logout(ctx.user.userId, input.refreshToken);
      return { success: true };
    }),

  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return AuthService.refreshAccessToken(input.refreshToken);
    }),

  checkUsername: publicProcedure
    .input(z.object({
      username: z.string().transform(normalizeUsername)
    }))
    .query(async ({ input, ctx }) => {
      rateLimit(`checkUsername:${getIp(ctx.req)}`, RATE_LIMITS.CHECK_USERNAME.limit, RATE_LIMITS.CHECK_USERNAME.windowMs);
      
      if (!isValidUsername(input.username)) {
        return { available: false, reason: 'Invalid format' };
      }
      const available = await AuthService.checkUsername(input.username);
      return { available };
    }),
});
