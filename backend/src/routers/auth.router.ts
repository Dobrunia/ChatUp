import { publicProcedure, protectedProcedure, router } from '../trpc/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import argon2 from 'argon2';
import { AuthService } from '../domain/services/auth.service';
import { rateLimit } from '../middlewares/rateLimit';

function getIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    const parts = forwarded.split(',');
    return parts[parts.length - 1].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

const usernameRegex = /^[a-z]{3,20}$/;

export const authRouter = router({
  signup: publicProcedure
    .input(z.object({
      displayName: z.string().min(1).max(50),
      username: z.string().trim().toLowerCase(),
      password: z.string().min(8),
      passwordConfirm: z.string()
    }).refine(data => data.password === data.passwordConfirm, {
      message: "Passwords don't match",
      path: ["passwordConfirm"]
    }))
    .mutation(async ({ input, ctx }) => {
      rateLimit(`signup:${getIp(ctx.req)}`, 5, 15 * 60 * 1000); // 5 per 15 minutes

      if (!usernameRegex.test(input.username)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Username must be 3-20 lowercase english letters' });
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
      username: z.string().trim().toLowerCase(),
      password: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      rateLimit(`login:${input.username}:${getIp(ctx.req)}`, 10, 15 * 60 * 1000); // 10 per 15 minutes

      return AuthService.login(input.username, input.password);
    }),

  logout: protectedProcedure
    .input(z.object({ refreshToken: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      await AuthService.logout(ctx.user.userId, input.refreshToken);
      return { success: true };
    }),

  checkUsername: publicProcedure
    .input(z.object({
      username: z.string().trim().toLowerCase()
    }))
    .query(async ({ input, ctx }) => {
      rateLimit(`checkUsername:${getIp(ctx.req)}`, 20, 60 * 1000); // 20 per minute
      
      if (!usernameRegex.test(input.username)) {
        return { available: false, reason: 'Invalid format' };
      }
      const available = await AuthService.checkUsername(input.username);
      return { available };
    }),
});
