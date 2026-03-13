import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScriptType } from '../types/language';
import {
  SYRIAC_CONSONANT_MAP,
  SYRIAC_VOWEL_MAP,
  HEBREW_CONSONANT_MAP,
  HEBREW_VOWEL_MAP,
  type TranslitMapping,
} from '../utils/transliteration';

interface TransliterationState {
  // Custom mappings per script (overrides defaults)
  customMappings: {
    syriac: {
      consonants: TranslitMapping[];
      vowels: TranslitMapping[];
    };
    hebrew: {
      consonants: TranslitMapping[];
      vowels: TranslitMapping[];
    };
  };

  // Whether to use custom mappings
  useCustomMappings: boolean;

  // Actions
  setUseCustomMappings: (use: boolean) => void;
  updateMapping: (
    script: ScriptType,
    type: 'consonants' | 'vowels',
    index: number,
    updates: Partial<TranslitMapping>
  ) => void;
  addMapping: (
    script: ScriptType,
    type: 'consonants' | 'vowels',
    mapping: TranslitMapping
  ) => void;
  deleteMapping: (
    script: ScriptType,
    type: 'consonants' | 'vowels',
    index: number
  ) => void;
  resetToDefaults: (script: ScriptType) => void;
  resetAllToDefaults: () => void;

  // Getters
  getMappings: (script: ScriptType) => {
    consonants: TranslitMapping[];
    vowels: TranslitMapping[];
  };
}

const getDefaultMappings = () => ({
  syriac: {
    consonants: [...SYRIAC_CONSONANT_MAP],
    vowels: [...SYRIAC_VOWEL_MAP],
  },
  hebrew: {
    consonants: [...HEBREW_CONSONANT_MAP],
    vowels: [...HEBREW_VOWEL_MAP],
  },
});

export const useTransliterationStore = create<TransliterationState>()(
  persist(
    (set, get) => ({
      customMappings: getDefaultMappings(),
      useCustomMappings: true,

      setUseCustomMappings: (use) => set({ useCustomMappings: use }),

      updateMapping: (script, type, index, updates) => {
        if (script !== 'syriac' && script !== 'hebrew') return;

        set((state) => {
          const newMappings = { ...state.customMappings };
          const list = [...newMappings[script][type]];
          list[index] = { ...list[index], ...updates };
          newMappings[script] = {
            ...newMappings[script],
            [type]: list,
          };
          return { customMappings: newMappings };
        });
      },

      addMapping: (script, type, mapping) => {
        if (script !== 'syriac' && script !== 'hebrew') return;

        set((state) => {
          const newMappings = { ...state.customMappings };
          newMappings[script] = {
            ...newMappings[script],
            [type]: [...newMappings[script][type], mapping],
          };
          return { customMappings: newMappings };
        });
      },

      deleteMapping: (script, type, index) => {
        if (script !== 'syriac' && script !== 'hebrew') return;

        set((state) => {
          const newMappings = { ...state.customMappings };
          const list = [...newMappings[script][type]];
          list.splice(index, 1);
          newMappings[script] = {
            ...newMappings[script],
            [type]: list,
          };
          return { customMappings: newMappings };
        });
      },

      resetToDefaults: (script) => {
        if (script !== 'syriac' && script !== 'hebrew') return;

        const defaults = getDefaultMappings();
        set((state) => ({
          customMappings: {
            ...state.customMappings,
            [script]: defaults[script],
          },
        }));
      },

      resetAllToDefaults: () => {
        set({ customMappings: getDefaultMappings() });
      },

      getMappings: (script) => {
        const state = get();
        if (script !== 'syriac' && script !== 'hebrew') {
          // Return empty for unsupported scripts
          return { consonants: [], vowels: [] };
        }

        if (state.useCustomMappings) {
          return state.customMappings[script];
        }

        // Return defaults
        const defaults = getDefaultMappings();
        return defaults[script];
      },
    }),
    {
      name: 'lang-helper-transliteration',
    }
  )
);
