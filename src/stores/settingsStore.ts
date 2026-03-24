import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SyriacFont = 'estrangela' | 'serto' | 'east-syriac';
export type HebrewFont = 'default' | 'frank-ruehl' | 'david';
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type SyriacVocalization = 'western' | 'eastern';

interface SettingsState {
  // Font settings
  syriacFont: SyriacFont;
  hebrewFont: HebrewFont;
  fontSize: FontSize;

  // Display settings
  showVowels: boolean;
  showSegmentColors: boolean;
  darkMode: 'system' | 'light' | 'dark';
  syriacVocalization: SyriacVocalization;

  // Keyboard settings
  keyboardDefaultOpen: boolean;

  // Actions
  setSyriacFont: (font: SyriacFont) => void;
  setHebrewFont: (font: HebrewFont) => void;
  setFontSize: (size: FontSize) => void;
  setShowVowels: (show: boolean) => void;
  setShowSegmentColors: (show: boolean) => void;
  setDarkMode: (mode: 'system' | 'light' | 'dark') => void;
  setKeyboardDefaultOpen: (open: boolean) => void;
  setSyriacVocalization: (style: SyriacVocalization) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      syriacFont: 'estrangela',
      hebrewFont: 'default',
      fontSize: 'medium',
      showVowels: true,
      showSegmentColors: true,
      darkMode: 'system',
      keyboardDefaultOpen: false,
      syriacVocalization: 'eastern',

      // Actions
      setSyriacFont: (font) => set({
        syriacFont: font,
        syriacVocalization: font === 'serto' ? 'western' : 'eastern',
      }),
      setHebrewFont: (font) => set({ hebrewFont: font }),
      setFontSize: (size) => set({ fontSize: size }),
      setShowVowels: (show) => set({ showVowels: show }),
      setShowSegmentColors: (show) => set({ showSegmentColors: show }),
      setDarkMode: (mode) => set({ darkMode: mode }),
      setKeyboardDefaultOpen: (open) => set({ keyboardDefaultOpen: open }),
      setSyriacVocalization: (style) => set({ syriacVocalization: style }),
    }),
    {
      name: 'lang-helper-settings',
    }
  )
);

export function getFontSizeClass(size: FontSize): string {
  switch (size) {
    case 'small':
      return 'text-lg';
    case 'medium':
      return 'text-xl';
    case 'large':
      return 'text-2xl';
    case 'xlarge':
      return 'text-3xl';
  }
}
