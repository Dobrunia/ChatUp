import * as dotenv from 'dotenv';
dotenv.config();

import { defaults } from './defaults';

const isDev = (process.env.NODE_ENV || defaults.env) === 'development';

function getEnv(key: string, fallback?: string): string {
  const value = process.env[key];
  if (!value) {
    if (fallback !== undefined) {
      console.warn(`[CONFIG WARNING] Missing ENV for ${key}, using fallback value for local development.`);
      return fallback;
    }
    throw new Error(`Missing required ENV variable: ${key}`);
  }
  return value;
}

/** Secrets: fallback allowed ONLY in development; production throws immediately */
function getSecretEnv(key: string, devFallback: string): string {
  const value = process.env[key];
  if (value) return value;
  if (isDev) {
    console.warn(`[CONFIG WARNING] Missing secret ${key}, using dev fallback. NEVER do this in production.`);
    return devFallback;
  }
  throw new Error(`Missing required secret ENV variable: ${key}. Refusing to start in ${process.env.NODE_ENV} mode.`);
}

export const config = {
  env: getEnv('NODE_ENV', defaults.env),
  port: parseInt(getEnv('PORT', defaults.port.toString()), 10),
  db: {
    url: getEnv('DATABASE_URL', defaults.db.url),
  },
  jwt: {
    accessSecret: getSecretEnv('JWT_ACCESS_SECRET', defaults.jwt.accessSecret),
    refreshSecret: getSecretEnv('JWT_REFRESH_SECRET', defaults.jwt.refreshSecret),
    accessExpiresIn: getEnv('JWT_ACCESS_EXPIRES_IN', defaults.jwt.accessExpiresIn),
    refreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', defaults.jwt.refreshExpiresIn),
  },
  s3: {
    endpoint: getEnv('S3_ENDPOINT', defaults.s3.endpoint),
    accessKeyId: getSecretEnv('S3_ACCESS_KEY_ID', defaults.s3.accessKeyId),
    secretAccessKey: getSecretEnv('S3_SECRET_ACCESS_KEY', defaults.s3.secretAccessKey),
    bucket: getEnv('S3_BUCKET', defaults.s3.bucket),
    region: getEnv('S3_REGION', defaults.s3.region),
  }
};
