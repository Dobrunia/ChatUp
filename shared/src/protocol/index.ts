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

export const USERNAME_VALIDATION_MESSAGE = `Логин должен содержать только строчные латинские буквы и быть длиной ${LIMITS.USERNAME_MIN_LENGTH}-${LIMITS.USERNAME_MAX_LENGTH} символов`;
export const USERNAME_HINT = `Логин: только a-z, длина ${LIMITS.USERNAME_MIN_LENGTH}-${LIMITS.USERNAME_MAX_LENGTH} символов`;
export const PASSWORD_HINT = `Пароль: минимум ${LIMITS.PASSWORD_MIN_LENGTH} символов`;
export const USERNAME_CHARS_ONLY_MESSAGE = 'Допустимы только строчные латинские буквы a-z';

export const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Требуется авторизация',
  RATE_LIMIT_EXCEEDED: 'Слишком много запросов. Попробуйте позже.',
  USERNAME_INVALID: `Логин должен содержать только строчные латинские буквы и быть длиной ${LIMITS.USERNAME_MIN_LENGTH}-${LIMITS.USERNAME_MAX_LENGTH} символов`,
  USERNAME_TAKEN: 'Логин уже занят',
  PASSWORDS_DONT_MATCH: 'Пароли не совпадают',
  INVALID_CREDENTIALS: 'Неверный логин или пароль',
  USER_NOT_FOUND: 'Пользователь не найден',
  DIALOG_MEMBERSHIP_REQUIRED: 'Вы не состоите в этом диалоге',
  DIALOG_SELF_FORBIDDEN: 'Нельзя создать диалог с самим собой',
  DIALOG_BLOCKED: 'Невозможно начать диалог: пользователь вас заблокировал',
  MESSAGE_NOT_FOUND: 'Сообщение не найдено',
  MESSAGE_SEND_FAILED: 'Не удалось отправить сообщение. Попробуйте ещё раз',
  ATTACHMENT_NOT_FOUND: 'Вложение не найдено',
  ATTACHMENT_NOT_READY: 'Вложение недоступно',
  ATTACHMENT_NOT_UPLOADED: 'Файл не загружен в хранилище',
  ACCESS_DENIED: 'Доступ запрещён',
  IMAGE_TOO_LARGE: 'Изображение слишком большое',
  VIDEO_TOO_LARGE: 'Видео слишком большое',
  FILE_TOO_LARGE: 'Файл слишком большой',
  DB_UNAVAILABLE: 'Сервис базы данных временно недоступен',
  AUTH_SESSION_PERSIST_FAILED: 'Не удалось сохранить сессию. Попробуйте ещё раз',
  SIGNUP_FAILED: 'Не удалось зарегистрироваться. Попробуйте ещё раз',
  LOGIN_FAILED: 'Не удалось выполнить вход. Попробуйте ещё раз',
  USERNAME_UPDATE_FAILED: 'Не удалось обновить логин. Попробуйте ещё раз',
  FIELD_VALUE_TOO_LONG: 'Слишком длинное значение поля',
  INTERNAL_ERROR: 'Произошла непредвиденная ошибка на сервере.',
} as const;

export const TRPC_CODE_MESSAGES = {
  UNAUTHORIZED: ERROR_MESSAGES.AUTH_REQUIRED,
  FORBIDDEN: ERROR_MESSAGES.ACCESS_DENIED,
  NOT_FOUND: 'Запрошенный ресурс не найден.',
  CONFLICT: 'Конфликт данных. Запись уже существует.',
  PAYLOAD_TOO_LARGE: ERROR_MESSAGES.FILE_TOO_LARGE,
  TOO_MANY_REQUESTS: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
  INTERNAL_SERVER_ERROR: ERROR_MESSAGES.INTERNAL_ERROR,
  BAD_REQUEST: 'Некорректный запрос.',
} as const;

export const TOAST_MESSAGES = {
  TOO_MANY_USERNAME_CHECKS: 'Слишком частые проверки. Подождите немного.',
  PROFILE_UPDATED: 'Профиль обновлен',
  USERNAME_UPDATED: 'Логин изменен',
  PUSH_ENABLED: 'Уведомления включены',
  PUSH_DISABLED: 'Уведомления отключены',
  PUSH_PERMISSION_DENIED: 'Доступ к уведомлениям запрещён',
  PUSH_INSECURE_CONTEXT: 'Push работает только в HTTPS или localhost',
  PUSH_UNSUPPORTED: 'Ваш браузер не поддерживает Push-уведомления',
  PUSH_PUBLIC_KEY_MISSING: 'На клиенте не настроен VAPID public key',
  PUSH_INIT_FAILED: 'Не удалось включить Push-уведомления',
  USER_NOT_LOADED_FOR_PROFILE: 'Пользователь должен быть найден через поиск.',
  USER_BLOCKED: 'Пользователь заблокирован',
  USER_UNBLOCKED: 'Пользователь разблокирован',
  MAX_ATTACHMENTS_REACHED: 'Максимум 5 файлов за раз',
} as const;

export function fileTooLargeToastMessage(fileName: string, maxMb: number): string {
  return `Файл ${fileName} слишком большой (> ${maxMb}MB)`;
}

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
