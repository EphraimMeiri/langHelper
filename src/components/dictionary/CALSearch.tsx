import { useCallback, useEffect, useRef } from 'react';
import { useCALDictionaryStore } from '../../stores/calDictionaryStore';
import { ScriptInput } from '../common/ScriptInput';
import { useLanguageStore } from '../../stores/languageStore';

const POS_COLORS: Record<string, string> = {
  'vb.': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'n.m.': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'n.f.': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  'adj.': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'adv.': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  'conj.': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'prep.': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  'sym.': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

function getPosColor(pos: string): string {
  // Try exact match, then prefix match
  if (POS_COLORS[pos]) return POS_COLORS[pos];
  for (const [key, val] of Object.entries(POS_COLORS)) {
    if (pos.startsWith(key.replace('.', ''))) return val;
  }
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
}

export function CALSearch() {
  const currentLang = useLanguageStore((s) => s.getCurrentLanguage());
  const {
    searchTerm,
    results,
    selectedEntry,
    syriacOnly,
    isLoading,
    loadIndex,
    search,
    selectEntry,
    setSyriacOnly,
  } = useCALDictionaryStore();

  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    loadIndex();
  }, [loadIndex]);

  const handleSearchChange = useCallback(
    (value: string) => {
      // Debounce search
      clearTimeout(searchTimerRef.current);
      // Update the term immediately for display
      useCALDictionaryStore.setState({ searchTerm: value });
      searchTimerRef.current = setTimeout(() => {
        search(value);
      }, 150);
    },
    [search]
  );

  const handlePlainSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleSearchChange(e.target.value);
    },
    [handleSearchChange]
  );

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search CAL Dictionary
        </label>
        {currentLang?.script === 'syriac' ? (
          <ScriptInput
            value={searchTerm}
            onChange={handleSearchChange}
            script="syriac"
            direction="rtl"
            placeholder="Search by Syriac, Hebrew, CAL, or English..."
            showKeyboard={false}
          />
        ) : (
          <input
            type="text"
            value={searchTerm}
            onChange={handlePlainSearchChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Search by lemma or English gloss..."
          />
        )}

        {/* Syriac-only toggle */}
        <label className="flex items-center gap-2 mt-2 cursor-pointer">
          <input
            type="checkbox"
            checked={syriacOnly}
            onChange={(e) => setSyriacOnly(e.target.checked)}
            className="w-3.5 h-3.5 text-blue-600 rounded"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Syriac entries only
          </span>
        </label>
      </div>

      {/* Results */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {isLoading ? (
          <div className="p-4 text-gray-500 dark:text-gray-400 text-sm">
            Loading dictionary...
          </div>
        ) : results.length === 0 && searchTerm ? (
          <div className="p-4 text-gray-500 dark:text-gray-400 text-sm">
            No results found.
          </div>
        ) : results.length === 0 ? (
          <div className="p-4 text-gray-500 dark:text-gray-400 text-sm">
            Type to search across 42,000+ Aramaic entries.
          </div>
        ) : (
          <div className="max-h-[calc(100vh-320px)] overflow-auto divide-y divide-gray-100 dark:divide-gray-700">
            <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 sticky top-0">
              {results.length} result{results.length !== 1 ? 's' : ''}
              {results.length >= 100 ? ' (showing first 100)' : ''}
            </div>
            {results.map((r) => (
              <button
                key={r.lemma}
                onClick={() => selectEntry(r.lemma, r.fileKey)}
                className={`w-full text-left px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${
                  selectedEntry?.lemma === r.lemma
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-500'
                    : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* Syriac headword */}
                  {r.syriac && (
                    <span
                      className="font-syriac text-lg"
                      dir="rtl"
                    >
                      {r.syriac}
                    </span>
                  )}
                  {/* Hebrew headword */}
                  {r.hebrew && (
                    <span
                      className="font-hebrew text-sm text-gray-500 dark:text-gray-400"
                      dir="rtl"
                    >
                      ({r.hebrew})
                    </span>
                  )}
                  {/* POS badge */}
                  {r.pos && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${getPosColor(r.pos)}`}
                    >
                      {r.pos}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 truncate">
                  {r.gloss}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
