import { toast } from 'vue-sonner';

/**
 * Maps raw backend TRPC error codes to user-friendly messages.
 * This ensures UI remains decoupled from raw server errors.
 */
const errorCodeMap: Record<string, string> = {
  UNAUTHORIZED: 'Пожалуйста, авторизуйтесь для выполнения этого действия.',
  FORBIDDEN: 'У вас нет прав для выполнения этой операции.',
  NOT_FOUND: 'Запрошенный ресурс не найден.',
  CONFLICT: 'Конфликт данных. Запись уже существует.',
  PAYLOAD_TOO_LARGE: 'Файл слишком большой.',
  TOO_MANY_REQUESTS: 'Слишком много запросов. Пожалуйста, подождите немного.',
  INTERNAL_SERVER_ERROR: 'Произошла непредвиденная ошибка на сервере.',
  BAD_REQUEST: 'Некорректный запрос.',
};

/**
 * Global error handler for the frontend.
 * Shows a toast and can log to an external service.
 */
export function handleGlobalError(error: any) {
  let message = 'Произошла ошибка при выполнении операции.';
  
  if (error && error.data && error.data.code) {
    const code = error.data.code;
    
    // First, map to our friendly messages based on TRPC code
    if (errorCodeMap[code]) {
      message = errorCodeMap[code];
    }
    
    // Fallback or override if the backend provides a safe, specific message we want to display
    // Note: ensure backend messages are user-friendly if you prefer error.message
    if (error.message && code !== 'INTERNAL_SERVER_ERROR') {
      message = error.message;
    }
  } else if (error && error.message) {
    message = error.message;
  }

  // Handle specific Zod validation errors nicely
  if (error?.data?.zodError) {
    message = 'Пожалуйста, проверьте правильность введенных данных.';
  }

  toast.error(message);
}
