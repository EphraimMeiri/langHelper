import { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header.tsx';
import { VerbTableView } from '../components/tables/VerbTableView.tsx';
import { VerbTableEditor } from '../components/tables/VerbTableEditor.tsx';
import { BulkImport } from '../components/tables/BulkImport.tsx';
import { useLanguageStore } from '../stores/languageStore.ts';
import { useTableStore } from '../stores/tableStore.ts';
import type { VerbTable } from '../types/verb.ts';

type ViewMode = 'view' | 'edit' | 'import';

export function TablesPage() {
  const currentLang = useLanguageStore((s) => s.getCurrentLanguage());
  const { tables, currentTableId, setCurrentTable, loadTablesForLanguage, isLoading, saveTable } =
    useTableStore();
  const [viewMode, setViewMode] = useState<ViewMode>('view');

  const handleSaveTable = (table: VerbTable) => {
    saveTable(table);
    setCurrentTable(table.id);
    setViewMode('view');
  };

  const handleExport = () => {
    const currentTable = tables.find((t) => t.id === currentTableId);
    if (!currentTable) return;

    const dataStr = JSON.stringify(currentTable, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTable.class}-${currentTable.languageId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (currentLang) {
      loadTablesForLanguage(currentLang.id);
    }
  }, [currentLang?.id, loadTablesForLanguage]);

  const currentTable = tables.find((t) => t.id === currentTableId);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Verb Tables"
        subtitle={currentLang ? `${currentLang.name} conjugation tables` : undefined}
      />

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading tables...</div>
        ) : viewMode === 'import' && currentLang ? (
          <BulkImport
            language={currentLang}
            onImport={handleSaveTable}
            onCancel={() => setViewMode('view')}
          />
        ) : tables.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No verb tables yet for {currentLang?.name || 'this language'}.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setViewMode('import')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Import from TSV/CSV
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Verb Class List */}
            <div className="lg:col-span-1 space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Verb Classes
                </h3>
                <button
                  onClick={() => setViewMode('import')}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  + Import
                </button>
              </div>
              {tables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => {
                    setCurrentTable(table.id);
                    setViewMode('view');
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    table.id === currentTableId
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 shadow-sm'
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium">{table.classDisplayName}</div>
                  <div
                    className={`text-lg mt-1 ${
                      currentLang?.script === 'syriac' ? 'font-syriac' : 'font-hebrew'
                    }`}
                    dir={currentLang?.direction}
                  >
                    {table.paradigmRoot}
                  </div>
                  {table.rootMeaning && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      "{table.rootMeaning}"
                    </div>
                  )}
                </button>
              ))}

              {/* Export Button */}
              {currentTable && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                  <button
                    onClick={handleExport}
                    className="w-full px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Export as JSON
                  </button>
                </div>
              )}
            </div>

            {/* Main Content - Table View */}
            <div className="lg:col-span-3">
              {currentTable && currentLang ? (
                viewMode === 'edit' ? (
                  <VerbTableEditor
                    table={currentTable}
                    language={currentLang}
                    onSave={handleSaveTable}
                    onCancel={() => setViewMode('view')}
                  />
                ) : (
                  <VerbTableView
                    table={currentTable}
                    language={currentLang}
                    onEditClick={() => setViewMode('edit')}
                  />
                )
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Select a verb class to view its conjugation table.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
