// Define types extracted directly from tRPC outputs instead of manual DTO duplication
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../../../backend/src/routers';

type RouterOutput = inferRouterOutputs<AppRouter>;

// Auth
export type LoginResponse = RouterOutput['auth']['login'];
export type SignupResponse = RouterOutput['auth']['signup'];

// Profile
export type UserProfile = RouterOutput['profile']['me'];

// Dialogs
export type DialogItem = RouterOutput['dialog']['list'][number];

// Search
export type UserSearchResult = RouterOutput['search']['users'][number];

// Messages
export type MessageItem = RouterOutput['message']['list'][number];

// Client-side extended types (fields not from backend, managed locally)
export type UserSearchResultLocal = UserSearchResult & { isBlocked?: boolean };
