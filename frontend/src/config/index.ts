// Single source of truth for all environment variables in the frontend.
// No import.meta.env should be used directly in components or stores.

function getEnv(key: keyof ImportMetaEnv, fallback?: string): string {
  const value = import.meta.env[key];
  if (!value) {
    if (fallback !== undefined) {
      console.warn(`[CONFIG WARNING] Missing ENV for ${key}, using fallback: ${fallback}`);
      return fallback;
    }
    throw new Error(`Missing required frontend ENV variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[key];
  return value && value.trim().length > 0 ? value : undefined;
}

export const config = {
  app: {
    version: __APP_VERSION__,
    githubRepo: __GITHUB_REPO__,
  },
  api: {
    url: getEnv('VITE_API_URL', 'http://localhost:3000/trpc'),
  },
  ws: {
    url: getEnv('VITE_WS_URL', 'ws://localhost:3000'),
  },
  webPush: {
    publicKey: getOptionalEnv('VITE_WEB_PUSH_PUBLIC_KEY'),
  }
};
