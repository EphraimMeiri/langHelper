import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VerbTable } from '../types/verb.ts';

interface TableStore {
  tables: VerbTable[];
  currentTableId: string | null;
  isLoading: boolean;
  error: string | null;

  setCurrentTable: (id: string | null) => void;
  loadTablesForLanguage: (languageId: string) => Promise<void>;
  getCurrentTable: () => VerbTable | null;
  saveTable: (table: VerbTable) => void;
  deleteTable: (id: string) => void;
}

export const useTableStore = create<TableStore>()(
  persist(
    (set, get) => ({
      tables: [],
      currentTableId: null,
      isLoading: false,
      error: null,

      setCurrentTable: (id: string | null) => {
        set({ currentTableId: id });
      },

      loadTablesForLanguage: async (languageId: string) => {
        set({ isLoading: true, error: null });
        try {
          const modules = import.meta.glob('/data/languages/*/verbs/*.json');
          const tables: VerbTable[] = [];

          for (const path in modules) {
            if (path.includes(`/${languageId}/`)) {
              const mod = (await modules[path]()) as { default: VerbTable };
              tables.push(mod.default);
            }
          }

          set({
            tables,
            isLoading: false,
            currentTableId: tables[0]?.id || null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load tables',
            isLoading: false,
          });
        }
      },

      getCurrentTable: () => {
        const { currentTableId, tables } = get();
        return tables.find(t => t.id === currentTableId) || null;
      },

      saveTable: (table: VerbTable) => {
        const { tables } = get();
        const updatedTable = { ...table, updatedAt: new Date().toISOString() };
        const existingIndex = tables.findIndex(t => t.id === table.id);

        if (existingIndex >= 0) {
          const newTables = [...tables];
          newTables[existingIndex] = updatedTable;
          set({ tables: newTables });
        } else {
          set({ tables: [...tables, updatedTable] });
        }
      },

      deleteTable: (id: string) => {
        const { tables, currentTableId } = get();
        set({
          tables: tables.filter(t => t.id !== id),
          currentTableId: currentTableId === id ? null : currentTableId,
        });
      },
    }),
    {
      name: 'lang-helper-tables',
      partialize: (state) => ({
        tables: state.tables,
        currentTableId: state.currentTableId,
      }),
    }
  )
);
