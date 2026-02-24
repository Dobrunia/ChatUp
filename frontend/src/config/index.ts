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

export const config = {
  api: {
    url: getEnv('VITE_API_URL', 'http://localhost:3000/trpc'),
  },
  ws: {
    url: getEnv('VITE_WS_URL', 'ws://localhost:3000'),
  }
};
