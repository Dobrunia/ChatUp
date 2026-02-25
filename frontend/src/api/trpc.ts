import { createTRPCProxyClient, httpBatchLink, TRPCLink } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import superjson from 'superjson';
import type { AppRouter } from '../../../backend/src/routers';
import { handleGlobalError } from '../utils/errorHandler';
import { config } from '../config';
import { db } from '../db';
import { wsClient } from '../ws/client';

const REFRESH_TOKEN_KEY = 'refreshToken';
let refreshPromise: Promise<string | null> | null = null;
let unauthorizedHandling = false;

function getTokenExpMs(token: string): number | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const parsed = JSON.parse(atob(payload.replaceAll('-', '+').replaceAll('_', '/'))) as { exp?: number };
    if (typeof parsed.exp !== 'number') return null;
    return parsed.exp * 1000;
  } catch {
    return null;
  }
}

function isTokenFreshEnough(token: string): boolean {
  const expMs = getTokenExpMs(token);
  if (!expMs) return false;
  // Refresh token proactively if access token expires within 15 seconds.
  return expMs - Date.now() > 15_000;
}

async function clearLocalSession() {
  wsClient.disconnect();
  localStorage.removeItem('token');
  await db.appMeta.delete(REFRESH_TOKEN_KEY);
}

async function handleUnauthorizedSession() {
  if (unauthorizedHandling) return;
  unauthorizedHandling = true;
  try {
    await clearLocalSession();
    if (globalThis.location.pathname !== '/welcome') {
      globalThis.location.replace('/welcome');
    }
  } finally {
    unauthorizedHandling = false;
  }
}

const refreshClient = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: config.api.url,
      headers: () => ({}),
    }),
  ],
});

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = (await db.appMeta.get(REFRESH_TOKEN_KEY))?.value;
    if (!refreshToken) {
      await clearLocalSession();
      return null;
    }

    try {
      const result = await refreshClient.auth.refresh.mutate({ refreshToken });
      localStorage.setItem('token', result.accessToken);
      return result.accessToken;
    } catch {
      await clearLocalSession();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function getAccessTokenForRequest(): Promise<string | null> {
  const token = localStorage.getItem('token');
  if (!token) return null;
  if (isTokenFreshEnough(token)) return token;
  return refreshAccessToken();
}

// Custom link to intercept errors globally
const errorHandlingLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        next(value) {
          observer.next(value);
        },
        error(err) {
          if ((err as { data?: { code?: string } })?.data?.code === 'UNAUTHORIZED') {
            void handleUnauthorizedSession();
          }
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
      async headers() {
        const token = await getAccessTokenForRequest();
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

