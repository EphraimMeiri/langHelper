import { create } from 'zustand';
import type {
  CALEntry,
  CALEntryFile,
  CALIndexEntry,
  CALMetadata,
} from '../types/cal-dictionary';
import {
  normalizeSearchTerm,
  isSyriacScript,
  isHebrewScript,
} from '../utils/calTransliteration';

interface SearchResult {
  lemma: string;
  syriac: string;
  hebrew: string;
  pos: string;
  gloss: string;
  fileKey: string;
}

interface CALDictionaryStore {
  // Data
  index: CALIndexEntry[] | null;
  metadata: CALMetadata | null;
  loadedEntries: Map<string, CALEntryFile>;
  isLoading: boolean;
  error: string | null;

  // UI state
  searchTerm: string;
  results: SearchResult[];
  selectedEntry: CALEntry | null;
  syriacOnly: boolean;

  // Actions
  loadIndex: () => Promise<void>;
  search: (term: string) => void;
  selectEntry: (lemma: string, fileKey: string) => Promise<void>;
  clearSelection: () => void;
  setSyriacOnly: (val: boolean) => void;
}

// Lazy loaders via Vite glob
const entryModules = import.meta.glob<{ default: CALEntryFile }>(
  '../../data/dictionaries/cal/entries/*.json'
);

const indexModule = () =>
  import('@data/dictionaries/cal/index.json') as unknown as Promise<{
    default: CALIndexEntry[];
  }>;

const metadataModule = () =>
  import('@data/dictionaries/cal/metadata.json') as unknown as Promise<{
    default: CALMetadata;
  }>;

export const useCALDictionaryStore = create<CALDictionaryStore>()((set, get) => ({
  index: null,
  metadata: null,
  loadedEntries: new Map(),
  isLoading: false,
  error: null,

  searchTerm: '',
  results: [],
  selectedEntry: null,
  syriacOnly: false,

  loadIndex: async () => {
    if (get().index) return; // Already loaded
    set({ isLoading: true, error: null });
    try {
      const [indexData, metaData] = await Promise.all([
        indexModule(),
        metadataModule(),
      ]);
      set({
        index: indexData.default,
        metadata: metaData.default,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: `Failed to load dictionary index: ${err}`,
        isLoading: false,
      });
    }
  },

  search: (term: string) => {
    set({ searchTerm: term });
    const { index } = get();
    if (!index || !term.trim()) {
      set({ results: [] });
      return;
    }

    const normalized = normalizeSearchTerm(term);
    const isScript = isSyriacScript(term) || isHebrewScript(term);
    const isEnglish = /^[a-z\s]+$/i.test(term.trim()) && !normalized.includes('(') && !normalized.includes(')');

    const results: SearchResult[] = [];
    const limit = 100;

    for (const entry of index) {
      if (results.length >= limit) break;

      // Syriac-only filter: check if any meaning has dialect "60" or "65"
      // We can't check meanings from the index, so we skip this filter here
      // and rely on the entry-level dialect check in the UI

      let match = false;

      if (isEnglish) {
        // Search by English gloss
        match = entry.g.toLowerCase().includes(normalized);
      } else if (isScript) {
        // Search by Syriac or Hebrew script
        if (isSyriacScript(term)) {
          match = entry.s.includes(term.trim()) ||
            entry.l.toLowerCase().startsWith(normalized.toLowerCase());
        } else {
          match = entry.h.includes(term.trim()) ||
            entry.l.toLowerCase().startsWith(normalized.toLowerCase());
        }
      } else {
        // CAL ASCII search — match lemma prefix
        match = entry.l.toLowerCase().startsWith(normalized);
        if (!match) {
          // Also try without POS suffix for partial matches
          const lemmaWord = entry.l.replace(/\s+[A-Z].*$/, '').toLowerCase();
          match = lemmaWord.startsWith(normalized);
        }
      }

      if (match) {
        results.push({
          lemma: entry.l,
          syriac: entry.s,
          hebrew: entry.h,
          pos: entry.p,
          gloss: entry.g,
          fileKey: entry.f,
        });
      }
    }

    set({ results });
  },

  selectEntry: async (lemma: string, fileKey: string) => {
    const { loadedEntries } = get();

    // Load the entry file if not cached
    if (!loadedEntries.has(fileKey)) {
      set({ isLoading: true });
      try {
        const modulePath = `../../data/dictionaries/cal/entries/${fileKey}.json`;
        const loader = entryModules[modulePath];
        if (!loader) {
          set({ error: `Entry file not found: ${fileKey}`, isLoading: false });
          return;
        }
        const mod = await loader();
        const newMap = new Map(loadedEntries);
        newMap.set(fileKey, mod.default);
        set({ loadedEntries: newMap });
      } catch (err) {
        set({ error: `Failed to load entries: ${err}`, isLoading: false });
        return;
      }
    }

    // Find the entry
    const file = get().loadedEntries.get(fileKey);
    if (!file) {
      set({ error: `Entry file not loaded: ${fileKey}`, isLoading: false });
      return;
    }

    const entry = file.entries.find((e) => e.lemma === lemma);
    set({ selectedEntry: entry || null, isLoading: false });
  },

  clearSelection: () => set({ selectedEntry: null }),

  setSyriacOnly: (val: boolean) => {
    set({ syriacOnly: val });
    // Re-run search with new filter
    const { searchTerm } = get();
    if (searchTerm) {
      get().search(searchTerm);
    }
  },
}));
