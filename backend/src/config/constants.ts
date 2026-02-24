export const RATE_LIMITS = {
  SIGNUP: { limit: 5, windowMs: 15 * 60 * 1000 },
  LOGIN: { limit: 10, windowMs: 15 * 60 * 1000 },
  CHECK_USERNAME: { limit: 20, windowMs: 60 * 1000 },
  UPDATE_USERNAME: { limit: 5, windowMs: 60 * 60 * 1000 },
} as const;

export const MEDIA_LIMITS = {
  BYTES_IN_MB: 1024 * 1024,
  PRESIGNED_UPLOAD_TTL_SECONDS: 15 * 60,
  PRESIGNED_DOWNLOAD_TTL_SECONDS: 15 * 60,
} as const;
