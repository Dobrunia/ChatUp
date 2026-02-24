import { defineStore } from 'pinia';
import { ref } from 'vue';
import { trpc } from '../api';
import { db } from '../db';

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false);
  const REFRESH_TOKEN_KEY = 'refreshToken';
  
  // Basic session init from local storage
  const initSession = () => {
    const token = localStorage.getItem('token');
    isAuthenticated.value = !!token;
  };

  const setTokens = async (accessToken: string, refreshToken: string) => {
    localStorage.setItem('token', accessToken);
    await db.appMeta.put({ key: REFRESH_TOKEN_KEY, value: refreshToken });
    isAuthenticated.value = true;
  };

  const logout = async () => {
    try {
      const rToken = (await db.appMeta.get(REFRESH_TOKEN_KEY))?.value;
      if (rToken) {
        // Attempt server logout, don't block if network fails
        await trpc.auth.logout.mutate({ refreshToken: rToken }).catch(() => {});
      }
    } finally {
      localStorage.removeItem('token');
      await db.appMeta.delete(REFRESH_TOKEN_KEY);
      isAuthenticated.value = false;
      // Also potentially clear other sensitive stores or trigger app reset here
    }
  };

  const login = async (username: string, password: string) => {
    const res = await trpc.auth.login.mutate({ username, password });
    await setTokens(res.accessToken, res.refreshToken);
    return res;
  };

  const signup = async (input: { username: string; displayName: string; password: string; passwordConfirm: string }) => {
    const res = await trpc.auth.signup.mutate(input);
    await setTokens(res.accessToken, res.refreshToken);
    return res;
  };

  const checkUsernameAvailability = (username: string) => {
    return trpc.auth.checkUsername.query({ username });
  };

  return {
    isAuthenticated,
    initSession,
    login,
    signup,
    checkUsernameAvailability,
    setTokens,
    logout
  };
});
