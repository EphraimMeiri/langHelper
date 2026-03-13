import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Dictionary, Anchor, ExactEntry } from '../types/dictionary';
import { createEmptyDictionary } from '../types/dictionary';
import { removeFileHandle } from '../utils/pdfStorage';

interface DictionaryStore {
  dictionaries: Dictionary[];
  currentDictionaryId: string | null;
  pdfPathsRestored: boolean;

  addDictionary: (name: string, languageId: string, pdfPath: string) => string;
  removeDictionary: (id: string) => void;
  setCurrentDictionary: (id: string | null) => void;
  getCurrentDictionary: () => Dictionary | null;
  setPdfPath: (dictionaryId: string, pdfPath: string) => void;
  markPdfPathsRestored: () => void;

  addAnchor: (dictionaryId: string, anchor: Anchor) => void;
  removeAnchor: (dictionaryId: string, prefix: string) => void;
  updateAnchors: (dictionaryId: string, anchors: Anchor[]) => void;

  addExactEntry: (dictionaryId: string, entry: ExactEntry) => void;
  removeExactEntry: (dictionaryId: string, lemma: string) => void;

  setPageCount: (dictionaryId: string, count: number) => void;

  setCalDictKey: (dictionaryId: string, calDictKey: string | undefined) => void;
  setPageOffset: (dictionaryId: string, offset: number) => void;
}

export const useDictionaryStore = create<DictionaryStore>()(
  persist(
    (set, get) => ({
      dictionaries: [],
      currentDictionaryId: null,
      pdfPathsRestored: false,

      addDictionary: (name, languageId, pdfPath) => {
        const id = `dict-${Date.now()}`;
        const dict = createEmptyDictionary(id, languageId, name, pdfPath);
        set((state) => ({
          dictionaries: [...state.dictionaries, dict],
          currentDictionaryId: id,
        }));
        return id;
      },

      removeDictionary: (id) => {
        // Clean up stored file handle
        removeFileHandle(id).catch(() => {});
        set((state) => ({
          dictionaries: state.dictionaries.filter((d) => d.id !== id),
          currentDictionaryId:
            state.currentDictionaryId === id ? null : state.currentDictionaryId,
        }));
      },

      setCurrentDictionary: (id) => set({ currentDictionaryId: id }),

      setPdfPath: (dictionaryId, pdfPath) => {
        set((state) => ({
          dictionaries: state.dictionaries.map((d) =>
            d.id === dictionaryId ? { ...d, pdfPath } : d
          ),
        }));
      },

      markPdfPathsRestored: () => set({ pdfPathsRestored: true }),

      getCurrentDictionary: () => {
        const { dictionaries, currentDictionaryId } = get();
        return dictionaries.find((d) => d.id === currentDictionaryId) || null;
      },

      addAnchor: (dictionaryId, anchor) => {
        set((state) => ({
          dictionaries: state.dictionaries.map((d) =>
            d.id === dictionaryId
              ? {
                  ...d,
                  anchors: [
                    ...d.anchors.filter((a) => a.prefix !== anchor.prefix),
                    { ...anchor, addedAt: anchor.addedAt || new Date().toISOString() },
                  ],
                  updatedAt: new Date().toISOString(),
                }
              : d
          ),
        }));
      },

      removeAnchor: (dictionaryId, prefix) => {
        set((state) => ({
          dictionaries: state.dictionaries.map((d) =>
            d.id === dictionaryId
              ? {
                  ...d,
                  anchors: d.anchors.filter((a) => a.prefix !== prefix),
                  updatedAt: new Date().toISOString(),
                }
              : d
          ),
        }));
      },

      updateAnchors: (dictionaryId, anchors) => {
        set((state) => ({
          dictionaries: state.dictionaries.map((d) =>
            d.id === dictionaryId
              ? { ...d, anchors, updatedAt: new Date().toISOString() }
              : d
          ),
        }));
      },

      addExactEntry: (dictionaryId, entry) => {
        set((state) => ({
          dictionaries: state.dictionaries.map((d) =>
            d.id === dictionaryId
              ? {
                  ...d,
                  exactEntries: [
                    ...d.exactEntries.filter((e) => e.lemma !== entry.lemma),
                    { ...entry, addedAt: entry.addedAt || new Date().toISOString() },
                  ],
                  updatedAt: new Date().toISOString(),
                }
              : d
          ),
        }));
      },

      removeExactEntry: (dictionaryId, lemma) => {
        set((state) => ({
          dictionaries: state.dictionaries.map((d) =>
            d.id === dictionaryId
              ? {
                  ...d,
                  exactEntries: d.exactEntries.filter((e) => e.lemma !== lemma),
                  updatedAt: new Date().toISOString(),
                }
              : d
          ),
        }));
      },

      setPageCount: (dictionaryId, count) => {
        set((state) => ({
          dictionaries: state.dictionaries.map((d) =>
            d.id === dictionaryId
              ? { ...d, pageCount: count, updatedAt: new Date().toISOString() }
              : d
          ),
        }));
      },

      setCalDictKey: (dictionaryId, calDictKey) => {
        set((state) => ({
          dictionaries: state.dictionaries.map((d) =>
            d.id === dictionaryId
              ? { ...d, calDictKey, updatedAt: new Date().toISOString() }
              : d
          ),
        }));
      },

      setPageOffset: (dictionaryId, offset) => {
        set((state) => ({
          dictionaries: state.dictionaries.map((d) =>
            d.id === dictionaryId
              ? { ...d, pageOffset: offset, updatedAt: new Date().toISOString() }
              : d
          ),
        }));
      },
    }),
    {
      name: 'lang-helper-dictionaries',
      partialize: (state) => ({
        dictionaries: state.dictionaries,
        currentDictionaryId: state.currentDictionaryId,
        // pdfPathsRestored is intentionally excluded — always starts false
      }),
    }
  )
);
