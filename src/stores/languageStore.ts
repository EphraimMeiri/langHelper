import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LanguageConfig } from '../types/language.ts';

interface LanguageStore {
  currentLanguageId: string | null;
  languages: LanguageConfig[];
  isLoading: boolean;
  error: string | null;

  setCurrentLanguage: (id: string) => void;
  loadLanguages: () => Promise<void>;
  getCurrentLanguage: () => LanguageConfig | null;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      currentLanguageId: null,
      languages: [],
      isLoading: false,
      error: null,

      setCurrentLanguage: (id: string) => {
        set({ currentLanguageId: id });
      },

      loadLanguages: async () => {
        set({ isLoading: true, error: null });
        try {
          const modules = import.meta.glob('/data/languages/*/config.json');
          const languages: LanguageConfig[] = [];

          for (const path in modules) {
            const mod = (await modules[path]()) as { default: LanguageConfig };
            languages.push(mod.default);
          }

          set({
            languages,
            isLoading: false,
            currentLanguageId: get().currentLanguageId || languages[0]?.id || null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load languages',
            isLoading: false,
          });
        }
      },

      getCurrentLanguage: () => {
        const { currentLanguageId, languages } = get();
        return languages.find(l => l.id === currentLanguageId) || null;
      },
    }),
    {
      name: 'lang-helper-language',
      partialize: (state) => ({ currentLanguageId: state.currentLanguageId }),
    }
  )
);
