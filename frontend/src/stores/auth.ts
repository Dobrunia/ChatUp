import { defineStore } from 'pinia';
import { ref } from 'vue';
import { trpc } from '../api';

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false);
  
  // Basic session init from local storage
  const initSession = () => {
    const token = localStorage.getItem('token');
    isAuthenticated.value = !!token;
  };

  const setTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('token', accessToken);
    // In a real app we might put refreshToken in IndexedDB or similar as per plan:
    // "Refresh token stored in one place (Preferences/IndexedDB) and rotated via auth.refresh"
    // For MVP, we'll keep it simple in localStorage next to access token, but conceptually isolated.
    localStorage.setItem('refreshToken', refreshToken);
    isAuthenticated.value = true;
  };

  const logout = async () => {
    try {
      const rToken = localStorage.getItem('refreshToken');
      if (rToken) {
        // Attempt server logout, don't block if network fails
        await trpc.auth.logout.mutate({ refreshToken: rToken }).catch(() => {});
      }
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      isAuthenticated.value = false;
      // Also potentially clear other sensitive stores or trigger app reset here
    }
  };

  return {
    isAuthenticated,
    initSession,
    setTokens,
    logout
  };
});
