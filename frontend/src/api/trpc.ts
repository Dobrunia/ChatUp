import { createTRPCProxyClient, httpBatchLink, TRPCLink } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import superjson from 'superjson';
import type { AppRouter } from '../../../backend/src/routers';
import { handleGlobalError } from '../utils/errorHandler';
import { config } from '../config';

// Custom link to intercept errors globally
const errorHandlingLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        next(value) {
          observer.next(value);
        },
        error(err) {
          // Send all errors to our single frontend error handler
          handleGlobalError(err);
          observer.error(err);
        },
        complete() {
          observer.complete();
        },
      });
      return unsubscribe;
    });
  };
};

// Create the tRPC client
export const trpc = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    errorHandlingLink,
    httpBatchLink({
      url: config.api.url,
      headers() {
        const token = localStorage.getItem('token');
        if (token) {
          return {
            authorization: `Bearer ${token}`,
          };
        }
        return {};
      },
    }),
  ],
});

