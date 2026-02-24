import { defineStore } from 'pinia';
import { ref } from 'vue';
import { trpc } from '../api';
import type { UserProfile } from '../api/types';

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<UserProfile | null>(null);
  const isLoading = ref(false);

  const fetchProfile = async () => {
    isLoading.value = true;
    try {
      const data = await trpc.profile.me.query();
      profile.value = data;
    } catch {
      profile.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  const updateProfile = async (displayName: string, avatarUrl?: string) => {
    const data = await trpc.profile.updateProfile.mutate({ displayName, avatarUrl });
    profile.value = { ...profile.value!, ...data };
    return data;
  };

  const updateUsername = async (username: string) => {
    const data = await trpc.profile.updateUsername.mutate({ username });
    profile.value = { ...profile.value!, username: data.username };
    return data;
  };

  const checkUsernameAvailability = (username: string) => {
    return trpc.auth.checkUsername.query({ username });
  };

  return {
    profile,
    isLoading,
    fetchProfile,
    updateProfile,
    updateUsername,
    checkUsernameAvailability
  };
});
