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
