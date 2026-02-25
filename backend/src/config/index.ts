import * as dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';

function loadEnvFiles() {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'backend/.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../.env'),
  ];

  const loaded = new Set<string>();
  for (const envPath of candidates) {
    if (!existsSync(envPath) || loaded.has(envPath)) {
      continue;
    }
    dotenv.config({ path: envPath, override: false });
    loaded.add(envPath);
  }
}

loadEnvFiles();

import { defaults } from './defaults';

const isDev = (process.env.NODE_ENV || defaults.env) === 'development';

function firstDefinedEnv(keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return undefined;
}

function getEnv(key: string, fallback?: string, aliases: string[] = []): string {
  const value = firstDefinedEnv([key, ...aliases]);
  if (!value) {
    if (fallback !== undefined) {
      console.warn(`[CONFIG WARNING] Missing ENV for ${key}, using fallback value for local development.`);
      return fallback;
    }
    throw new Error(`Missing required ENV variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, fallback = ''): string {
  const value = process.env[key];
  if (value !== undefined) return value;
  if (isDev) return fallback;
  return '';
}

/** Secrets: fallback allowed ONLY in development; production throws immediately */
function getSecretEnv(key: string, devFallback: string, aliases: string[] = []): string {
  const value = firstDefinedEnv([key, ...aliases]);
  if (value) return value;
  if (isDev) {
    console.warn(`[CONFIG WARNING] Missing secret ${key}, using dev fallback. NEVER do this in production.`);
    return devFallback;
  }
  throw new Error(`Missing required secret ENV variable: ${key}. Refusing to start in ${process.env.NODE_ENV} mode.`);
}

export const config = {
  env: getEnv('NODE_ENV', defaults.env, ['APP_ENV']),
  port: Number.parseInt(getEnv('PORT', defaults.port.toString(), ['APP_PORT']), 10),
  db: {
    url: getEnv('DATABASE_URL', defaults.db.url, ['DB_CONNECTION_STRING']),
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
  },
  webPush: {
    publicKey: getOptionalEnv('WEB_PUSH_PUBLIC_KEY', defaults.webPush.publicKey),
    privateKey: getOptionalEnv('WEB_PUSH_PRIVATE_KEY', defaults.webPush.privateKey),
    subject: getOptionalEnv('WEB_PUSH_SUBJECT', defaults.webPush.subject),
  }
};
