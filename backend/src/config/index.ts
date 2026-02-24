import * from 'dotenv';
dotenv.config();

import { defaults } from './defaults';

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

export const config = {
  env: getEnv('NODE_ENV', defaults.env),
  port: parseInt(getEnv('PORT', defaults.port.toString()), 10),
  db: {
    url: getEnv('DATABASE_URL', defaults.db.url),
  },
  jwt: {
    accessSecret: getEnv('JWT_ACCESS_SECRET', defaults.jwt.accessSecret),
    refreshSecret: getEnv('JWT_REFRESH_SECRET', defaults.jwt.refreshSecret),
    accessExpiresIn: getEnv('JWT_ACCESS_EXPIRES_IN', defaults.jwt.accessExpiresIn),
    refreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', defaults.jwt.refreshExpiresIn),
  },
  s3: {
    endpoint: getEnv('S3_ENDPOINT', defaults.s3.endpoint),
    accessKeyId: getEnv('S3_ACCESS_KEY_ID', defaults.s3.accessKeyId),
    secretAccessKey: getEnv('S3_SECRET_ACCESS_KEY', defaults.s3.secretAccessKey),
    bucket: getEnv('S3_BUCKET', defaults.s3.bucket),
    region: getEnv('S3_REGION', defaults.s3.region),
  }
};
