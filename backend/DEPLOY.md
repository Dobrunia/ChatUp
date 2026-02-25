# Backend deploy (production)

Ниже рабочий процесс деплоя бэка для этого проекта (Node + Prisma + MySQL).

## 1) Что загрузить на сервер

Минимальный набор файлов/папок:

- `backend/dist`
- `backend/package.json`
- `.env` (корень репо/приложения)
- `shared/dist`
- `shared/package.json`
- `prisma/schema.prisma`
- `prisma/migrations`
- `package.json` (корень репо)
- `package-lock.json` (корень репо)

Без `shared/dist` и `prisma/migrations` сервер не поднимется корректно.

## 2) Установить зависимости

Запускать из корня проекта на сервере:

```bash
npm ci
```

## 3) Prisma (обязательно)

```bash
cd backend
npm run db:generate
npx prisma migrate deploy --schema=../prisma/schema.prisma
```

Важно:

- в production использовать только `migrate deploy`
- не использовать `prisma migrate dev` на сервере

## 4) Запуск backend

```bash
npm run start -w backend
```

По умолчанию стартует `node backend/dist/index.js` через скрипт `backend`.

## 5) Частые проблемы

1. **Ошибка подключения к MySQL**  
   Проверь `DATABASE_URL` в `backend/.env`.

2. **Prisma не видит таблицы / P2021**  
   Не применены миграции -> выполни `prisma migrate deploy`.

3. **Падает import `@chatup/shared`**  
   Не загружен `shared/dist` или не установлен workspace dependency.

4. **Проблема с паролем в URL (спецсимволы)**  
   Если в пароле есть `*`, `@`, `#` и т.п., используй URL-encoding.
   Пример: `*` -> `%2A`.

5. **`.env` как будто не читается на хостинге**  
   Частая причина: dotfile не загрузился или процесс стартует из другой директории.  
   Бэкенд умеет читать `.env` из:
   - `./.env` (cwd процесса)
   - `./backend/.env` (cwd процесса)
   - `backend/.env` рядом с `backend/dist`
   - `.env` в корне приложения рядом с папкой `backend`
   Также поддерживаются алиасы переменных панели хостинга:
   - `APP_PORT` -> `PORT`
   - `DB_CONNECTION_STRING` -> `DATABASE_URL`
