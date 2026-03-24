import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CALChapter, CALWordGloss } from '../types/cal-reader';
import { fetchCALChapter } from '../utils/calTextParser';
import { cacheChapter, getCachedChapter } from '../utils/calCache';
import { fetchChapterGlosses } from '../utils/calGlossParser';

interface CALReaderState {
  chapter: CALChapter | null;
  fileCode: string;
  chapterNum: number;
  cset: string;
  isLoading: boolean;
  error: string | null;
  fromCache: boolean;
  /** Gloss loading progress: null = not loading, [done, total] */
  glossProgress: [number, number] | null;
  /** Whether to show inline glosses for Syriac-specific words */
  showGlosses: boolean;
  selectedWordCoord: string | null;
  selectedWordText: string | null;
  bookmarks: { fileCode: string; chapter: number; label: string }[];

  // Actions
  loadChapter: (fileCode: string, chapter: number, cset?: string) => Promise<void>;
  goToNextChapter: () => Promise<void>;
  goToPrevChapter: () => Promise<void>;
  fetchGlosses: () => Promise<void>;
  fetchVerseGlosses: (verseRef: string) => Promise<void>;
  setShowGlosses: (show: boolean) => void;
  selectWord: (coord: string, text: string) => void;
  clearWordSelection: () => void;
  addBookmark: (label: string) => void;
  removeBookmark: (fileCode: string, chapter: number) => void;
}

export const useCALReaderStore = create<CALReaderState>()(
  persist(
    (set, get) => ({
      chapter: null,
      fileCode: '62001',
      chapterNum: 1,
      cset: 'S',
      isLoading: false,
      error: null,
      fromCache: false,
      glossProgress: null,
      showGlosses: true,
      selectedWordCoord: null,
      selectedWordText: null,
      bookmarks: [],

      loadChapter: async (fileCode, chapter, cset) => {
        const charset = cset || get().cset;
        set({
          isLoading: true, error: null, fileCode, chapterNum: chapter,
          cset: charset, fromCache: false, glossProgress: null,
        });

        // Try cache first
        try {
          const cached = await getCachedChapter(fileCode, chapter, charset);
          if (cached) {
            set({ chapter: cached, isLoading: false, fromCache: true });
            return;
          }
        } catch {
          // fall through
        }

        // Fetch from network
        try {
          const data = await fetchCALChapter(fileCode, chapter, charset);
          set({ chapter: data, isLoading: false, fromCache: false });
          // Cache in background (without glosses yet)
          cacheChapter(data).catch(() => {});
        } catch (err) {
          set({ error: `${err}`, isLoading: false });
        }
      },

      goToNextChapter: async () => {
        const { chapter, fileCode, chapterNum, cset } = get();
        const next = chapter?.nextChapter ?? chapterNum + 1;
        await get().loadChapter(fileCode, next, cset);
      },

      goToPrevChapter: async () => {
        const { chapter, chapterNum, fileCode, cset } = get();
        const prev = chapter?.prevChapter ?? Math.max(1, chapterNum - 1);
        await get().loadChapter(fileCode, prev, cset);
      },

      fetchGlosses: async () => {
        const { chapter } = get();
        if (!chapter) return;

        // Already have glosses?
        if (chapter.glosses && Object.keys(chapter.glosses).length > 0) return;

        // Collect all words
        const allWords = chapter.verses.flatMap((v) =>
          v.words.map((w) => ({ text: w.text, coord: w.coord, wordIndex: w.wordIndex }))
        );
        if (allWords.length === 0) return;

        set({ glossProgress: [0, 0] });

        const glossMap = await fetchChapterGlosses(allWords, (done, total) => {
          set({ glossProgress: [done, total] });
        });

        // Convert to a plain object for serialization
        const glosses: Record<string, CALWordGloss> = {};
        for (const [text, g] of glossMap) {
          glosses[text] = {
            lemma: g.lemma,
            gloss: g.gloss,
            pos: g.pos,
            syriacOnly: g.syriacOnly,
          };
        }

        // Merge glosses into the chapter and re-cache
        const currentChapter = get().chapter;
        if (currentChapter && currentChapter.fileCode === chapter.fileCode && currentChapter.chapter === chapter.chapter) {
          const updated = { ...currentChapter, glosses };
          set({ chapter: updated, glossProgress: null });
          cacheChapter(updated).catch(() => {});
        } else {
          set({ glossProgress: null });
        }
      },

      fetchVerseGlosses: async (verseRef: string) => {
        const { chapter } = get();
        if (!chapter) return;
        const verse = chapter.verses.find((v) => v.ref === verseRef);
        if (!verse) return;

        // Skip words that are already glossed
        const existing = chapter.glosses || {};
        const needed = verse.words
          .filter((w) => !(w.text in existing))
          .map((w) => ({ text: w.text, coord: w.coord, wordIndex: w.wordIndex }));

        if (needed.length === 0) return;

        set({ glossProgress: [0, needed.length] });

        const glossMap = await fetchChapterGlosses(needed, (done, total) => {
          set({ glossProgress: [done, total] });
        });

        const newGlosses: Record<string, CALWordGloss> = { ...existing };
        for (const [text, g] of glossMap) {
          newGlosses[text] = {
            lemma: g.lemma,
            gloss: g.gloss,
            pos: g.pos,
            syriacOnly: g.syriacOnly,
          };
        }

        const currentChapter = get().chapter;
        if (currentChapter && currentChapter.fileCode === chapter.fileCode && currentChapter.chapter === chapter.chapter) {
          const updated = { ...currentChapter, glosses: newGlosses };
          set({ chapter: updated, glossProgress: null });
          cacheChapter(updated).catch(() => {});
        } else {
          set({ glossProgress: null });
        }
      },

      setShowGlosses: (show) => set({ showGlosses: show }),

      selectWord: (coord, text) => set({ selectedWordCoord: coord, selectedWordText: text }),
      clearWordSelection: () => set({ selectedWordCoord: null, selectedWordText: null }),

      addBookmark: (label) => {
        const { fileCode, chapterNum, bookmarks } = get();
        if (bookmarks.some((b) => b.fileCode === fileCode && b.chapter === chapterNum)) return;
        set({ bookmarks: [...bookmarks, { fileCode, chapter: chapterNum, label }] });
      },

      removeBookmark: (fileCode, chapter) => {
        set({ bookmarks: get().bookmarks.filter((b) => !(b.fileCode === fileCode && b.chapter === chapter)) });
      },
    }),
    {
      name: 'lang-helper-cal-reader',
      partialize: (state) => ({
        fileCode: state.fileCode,
        chapterNum: state.chapterNum,
        cset: state.cset,
        bookmarks: state.bookmarks,
        showGlosses: state.showGlosses,
      }),
    }
  )
);
