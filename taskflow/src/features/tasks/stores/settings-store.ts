import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

type SettingsState = {
  theme: Theme;
  language: string;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: string) => void;
};

// localStorageに自動保存・復元
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'ja',
      setTheme: (theme) => set({ theme }),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'taskflow-settings', // localStorageのキー名
    }
  )
);