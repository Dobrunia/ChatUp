import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
  const notificationsEnabled = ref(false);
  const darkModeEnabled = ref(false); // Can check window.matchMedia('(prefers-color-scheme: dark)')

  const toggleNotifications = (val: boolean) => {
    notificationsEnabled.value = val;
    localStorage.setItem('settings.notifications', val.toString());
  };

  const toggleDarkMode = (val: boolean) => {
    darkModeEnabled.value = val;
    document.body.classList.toggle('dark', val);
    localStorage.setItem('settings.darkMode', val.toString());
  };

  const loadSettings = () => {
    const n = localStorage.getItem('settings.notifications');
    if (n !== null) notificationsEnabled.value = n === 'true';

    const d = localStorage.getItem('settings.darkMode');
    if (d !== null) {
      toggleDarkMode(d === 'true');
    }
  };

  return {
    notificationsEnabled,
    darkModeEnabled,
    toggleNotifications,
    toggleDarkMode,
    loadSettings
  };
});
