export const WS_EVENTS = {
  CLIENT: {
    SEND_MESSAGE: "client:message:send",
    TYPING_START: "client:typing:start",
    TYPING_STOP: "client:typing:stop",
    READ_RECEIPT: "client:receipt:read",
  },
  SERVER: {
    NEW_MESSAGE: "server:message:new",
    DELIVERED_RECEIPT: "server:receipt:delivered",
    READ_RECEIPT: "server:receipt:read",
    TYPING: "server:typing",
    PRESENCE: "server:presence",
    ERROR: "server:error"
  }
} as const;

export const LIMITS = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  PASSWORD_MIN_LENGTH: 8,
  PAGE_SIZE_MAX: 50,
  FILE_MAX_SIZE_MB: 25,
  IMAGE_MAX_SIZE_MB: 15,
  VIDEO_MAX_SIZE_MB: 50
} as const;

export const USERNAME_VALIDATION_MESSAGE = `Username must be ${LIMITS.USERNAME_MIN_LENGTH}-${LIMITS.USERNAME_MAX_LENGTH} lowercase english letters`;
export const USERNAME_HINT = `Логин: только a-z, длина ${LIMITS.USERNAME_MIN_LENGTH}-${LIMITS.USERNAME_MAX_LENGTH} символов`;
export const PASSWORD_HINT = `Пароль: минимум ${LIMITS.PASSWORD_MIN_LENGTH} символов`;

export const USERNAME_REGEX = new RegExp(
  `^[a-z]{${LIMITS.USERNAME_MIN_LENGTH},${LIMITS.USERNAME_MAX_LENGTH}}$`
);

export function normalizeUsername(value: unknown): string {
  const raw = typeof value === 'string' ? value : '';
  return raw
    .replace(/^@+/, '')
    .toLowerCase()
    .replaceAll(/[^a-z]/g, '')
    .slice(0, LIMITS.USERNAME_MAX_LENGTH);
}

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

export function isValidPasswordLength(password: string): boolean {
  return password.length >= LIMITS.PASSWORD_MIN_LENGTH;
}

export function isRateLimitError(err: unknown): boolean {
  return (err as { data?: { httpStatus?: number } })?.data?.httpStatus === 429;
}
