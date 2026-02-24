import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import superjson from 'superjson';
import { ERROR_MESSAGES } from '@chatup/shared/src/protocol';
import { verifyAccessToken } from '../auth/jwt';
import { logger } from '../utils/logger';

export const createContext = ({ req, res }: CreateExpressContextOptions) => {
  const token = req.headers.authorization?.split(' ')[1];
  let user = null;

  if (token) {
    try {
      user = verifyAccessToken(token);
    } catch (e: unknown) {
      logger.warn({
        event: 'Invalid access token in context',
        reason: e instanceof Error ? e.message : 'unknown_error',
        ip: req.socket?.remoteAddress || 'unknown',
      });
    }
  }

  return { req, res, user };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error, ctx, path, type }) {
    // Single place for error formatting & logging
    const expectedClientErrorCodes = new Set([
      'BAD_REQUEST',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
      'CONFLICT',
      'PAYLOAD_TOO_LARGE',
      'TOO_MANY_REQUESTS',
    ]);
    const isExpectedClientError = expectedClientErrorCodes.has(error.code);
    const logPayload = {
      event: `[tRPC Error] ${type} ${path}`,
      code: error.code,
      message: error.message,
      userId: ctx?.user?.userId,
    };
    if (isExpectedClientError) {
      logger.warn(logPayload);
    } else {
      logger.error(logPayload, error);
    }

    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause?.name === 'ZodError' ? error.cause : null,
        meta: error.cause && error.cause.name !== 'ZodError' ? error.cause.message : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: ERROR_MESSAGES.AUTH_REQUIRED });
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
