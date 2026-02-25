import { toast } from 'vue-sonner';
import { ERROR_MESSAGES, TRPC_CODE_MESSAGES } from '@chatup/shared/src/protocol';

/**
 * Maps raw backend TRPC error codes to user-friendly messages.
 * This ensures UI remains decoupled from raw server errors.
 */
const errorCodeMap: Record<string, string> = TRPC_CODE_MESSAGES;

const legacyMessageMap: Record<string, string> = {
  "Passwords don't match": ERROR_MESSAGES.PASSWORDS_DONT_MATCH,
  'Username already taken': ERROR_MESSAGES.USERNAME_TAKEN,
  'Invalid credentials': ERROR_MESSAGES.INVALID_CREDENTIALS,
  'Not authenticated': ERROR_MESSAGES.AUTH_REQUIRED,
  'Rate limit exceeded, try again later': ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
};

let lastNotifiedMessage = '';
let lastNotifiedAt = 0;

function tryExtractJsonMessage(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as Array<{ message?: string }> | { message?: string };
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].message) {
      return parsed[0].message;
    }
    if (!Array.isArray(parsed) && parsed?.message) {
      return parsed.message;
    }
    return null;
  } catch {
    return null;
  }
}

export function extractUserErrorMessage(error: unknown): string {
  let message = 'Произошла ошибка при выполнении операции.';
  const asObj = error as {
    data?: { code?: string; zodError?: unknown };
    message?: string;
  };
  
  const trpcCode = asObj?.data?.code;
  if (trpcCode) {
    const code = trpcCode;
    
    // First, map to our friendly messages based on TRPC code
    if (errorCodeMap[code]) {
      message = errorCodeMap[code];
    }
    
    // Fallback or override if the backend provides a safe, specific message we want to display
    // Note: ensure backend messages are user-friendly if you prefer error.message
    if (asObj.message) {
      const fromJson = tryExtractJsonMessage(asObj.message);
      message = legacyMessageMap[fromJson || asObj.message] || fromJson || asObj.message;
    }
  } else if (asObj?.message) {
    const fromJson = tryExtractJsonMessage(asObj.message);
    message = legacyMessageMap[fromJson || asObj.message] || fromJson || asObj.message;
  }

  // Handle specific Zod validation errors nicely
  if (asObj?.data?.zodError) {
    message = 'Пожалуйста, проверьте правильность введенных данных.';
  }
  return message;
}

export function notifyError(errorOrMessage: unknown, fallbackMessage = 'Произошла ошибка при выполнении операции.') {
  const message =
    typeof errorOrMessage === 'string'
      ? errorOrMessage
      : extractUserErrorMessage(errorOrMessage) || fallbackMessage;
  const now = Date.now();
  if (message === lastNotifiedMessage && now - lastNotifiedAt < 900) {
    return;
  }
  lastNotifiedMessage = message;
  lastNotifiedAt = now;
  toast.error(message);
}

/**
 * Global error handler for the frontend.
 * Shows a toast and can log to an external service.
 */
export function handleGlobalError(error: unknown) {
  notifyError(error);
}
