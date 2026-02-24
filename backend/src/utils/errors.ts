// Single place for domain errors definition
import { TRPCError } from '@trpc/server';
import { TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc';

export function throwAppError(
  code: TRPC_ERROR_CODE_KEY,
  message: string,
  meta?: Record<string, any>
): never {
  throw new TRPCError({
    code,
    message,
    // Add extra info to the cause, which can be picked up by the error formatter
    cause: meta ? new Error(JSON.stringify(meta)) : undefined,
  });
}
