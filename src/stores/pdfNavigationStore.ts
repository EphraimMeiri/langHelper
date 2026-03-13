import { create } from 'zustand';

interface PdfNavigationRequest {
  dictionaryId: string;
  page: number;
  timestamp: number;
}

interface PdfNavigationStore {
  pendingNavigation: PdfNavigationRequest | null;
  requestNavigation: (dictionaryId: string, page: number) => void;
  clearNavigation: () => void;
}

export const usePdfNavigationStore = create<PdfNavigationStore>()((set) => ({
  pendingNavigation: null,

  requestNavigation: (dictionaryId, page) =>
    set({ pendingNavigation: { dictionaryId, page, timestamp: Date.now() } }),

  clearNavigation: () => set({ pendingNavigation: null }),
}));
