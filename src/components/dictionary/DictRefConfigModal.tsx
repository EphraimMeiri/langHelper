import { useState } from 'react';
import { useDictionaryStore } from '../../stores/dictionaryStore';
import type { DictRefs } from '../../types/cal-dictionary';

/** Full names for dictionary abbreviation keys */
const DICT_LABELS: Record<keyof DictRefs, string> = {
  ls2: 'Brockelmann (LS2)',
  ps: 'Payne-Smith (Thesaurus)',
  jps: 'J. Payne-Smith (Compendious)',
  djpa: 'Sokoloff (DJPA)',
  djba: 'Sokoloff (DJBA)',
  md: 'Mandaic Dict.',
  jastrow: 'Jastrow',
  levy: 'Levy',
  tal: 'Tal',
  audo: 'Audo',
  bb: 'Bar Bahlul',
  ba: 'Bar Ali',
  dnwsi: 'DNWSI',
  diso: 'DISO',
  schult: 'Schulthess',
  dja: 'DJA',
  qumran: 'Qumran',
};

const ALL_DICT_KEYS = Object.keys(DICT_LABELS) as (keyof DictRefs)[];

export function DictRefConfigModal({ onClose }: { onClose: () => void }) {
  const { dictionaries, setCalDictKey, setPageOffset } = useDictionaryStore();

  // Build reverse map: calDictKey → dictionary
  const keyToDictId = new Map<string, string>();
  const dictIdToOffset = new Map<string, number>();
  for (const d of dictionaries) {
    if (d.calDictKey) {
      keyToDictId.set(d.calDictKey, d.id);
    }
    dictIdToOffset.set(d.id, d.pageOffset ?? 0);
  }

  // Local state for offset edits (so we can batch changes)
  const [offsets, setOffsets] = useState<Record<string, number>>(() => {
    const o: Record<string, number> = {};
    for (const d of dictionaries) {
      o[d.id] = d.pageOffset ?? 0;
    }
    return o;
  });

  const handleDictChange = (calKey: string, dictId: string) => {
    // Clear the old dictionary that had this calKey
    const oldDictId = keyToDictId.get(calKey);
    if (oldDictId) {
      setCalDictKey(oldDictId, undefined);
    }

    if (dictId) {
      // If the new dictionary already has a different calKey, clear it
      const newDict = dictionaries.find((d) => d.id === dictId);
      if (newDict?.calDictKey && newDict.calDictKey !== calKey) {
        setCalDictKey(dictId, undefined);
      }
      setCalDictKey(dictId, calKey);
    }
  };

  const handleOffsetChange = (dictId: string, offset: number) => {
    setOffsets((prev) => ({ ...prev, [dictId]: offset }));
    setPageOffset(dictId, offset);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            PDF Dictionary Mappings
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl px-2"
          >
            &times;
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Link your uploaded PDF dictionaries to CAL reference keys. Set a page offset if the
          PDF page numbering differs from the printed page numbers.
        </p>

        {dictionaries.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
            No PDF dictionaries uploaded yet. Add PDFs in the PDF Viewer tab first.
          </div>
        ) : (
          <div className="overflow-auto flex-1 -mx-1 px-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 pr-2">Reference Dictionary</th>
                  <th className="pb-2 pr-2">PDF File</th>
                  <th className="pb-2 w-20">Offset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {ALL_DICT_KEYS.map((calKey) => {
                  const assignedDictId = keyToDictId.get(calKey) ?? '';
                  return (
                    <tr key={calKey}>
                      <td className="py-2 pr-2">
                        <span className="text-gray-700 dark:text-gray-300 text-xs">
                          {DICT_LABELS[calKey]}
                        </span>
                      </td>
                      <td className="py-2 pr-2">
                        <select
                          value={assignedDictId}
                          onChange={(e) => handleDictChange(calKey, e.target.value)}
                          className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">-- None --</option>
                          {dictionaries.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          value={assignedDictId ? (offsets[assignedDictId] ?? 0) : 0}
                          onChange={(e) => {
                            if (assignedDictId) {
                              handleOffsetChange(assignedDictId, parseInt(e.target.value, 10) || 0);
                            }
                          }}
                          disabled={!assignedDictId}
                          className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center disabled:opacity-40"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Offset = PDF page - printed page
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
