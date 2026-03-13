import { useState } from 'react';
import { useTransliterationStore } from '../../stores/transliterationStore';
import type { TranslitMapping } from '../../utils/transliteration';
import type { ScriptType } from '../../types/language';

export function TransliterationEditor() {
  const {
    customMappings,
    useCustomMappings,
    setUseCustomMappings,
    updateMapping,
    addMapping,
    deleteMapping,
    resetToDefaults,
  } = useTransliterationStore();

  const [activeScript, setActiveScript] = useState<'syriac' | 'hebrew'>('syriac');
  const [activeTab, setActiveTab] = useState<'consonants' | 'vowels'>('consonants');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newMapping, setNewMapping] = useState<TranslitMapping>({
    latin: '',
    char: '',
    name: '',
  });

  const currentMappings = customMappings[activeScript][activeTab];
  const fontClass = activeScript === 'syriac' ? 'font-syriac' : 'font-hebrew';

  const handleSaveEdit = (index: number, updates: Partial<TranslitMapping>) => {
    updateMapping(activeScript, activeTab, index, updates);
    setEditingIndex(null);
  };

  const handleAddNew = () => {
    if (newMapping.latin && newMapping.char) {
      addMapping(activeScript, activeTab, { ...newMapping });
      setNewMapping({ latin: '', char: '', name: '' });
      setIsAdding(false);
    }
  };

  const handleDelete = (index: number) => {
    if (confirm('Delete this mapping?')) {
      deleteMapping(activeScript, activeTab, index);
    }
  };

  const handleReset = () => {
    if (confirm(`Reset all ${activeScript} mappings to defaults?`)) {
      resetToDefaults(activeScript);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Transliteration Mappings
        </h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useCustomMappings}
            onChange={(e) => setUseCustomMappings(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Use custom mappings
          </span>
        </label>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Customize how English letters are converted to {activeScript === 'syriac' ? 'Syriac' : 'Hebrew'} characters when typing.
      </p>

      {/* Script tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveScript('syriac')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeScript === 'syriac'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Syriac
        </button>
        <button
          onClick={() => setActiveScript('hebrew')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeScript === 'hebrew'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Hebrew
        </button>
      </div>

      {/* Type tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('consonants')}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            activeTab === 'consonants'
              ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Consonants ({customMappings[activeScript].consonants.length})
        </button>
        <button
          onClick={() => setActiveTab('vowels')}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            activeTab === 'vowels'
              ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Vowels ({customMappings[activeScript].vowels.length})
        </button>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            + Add
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Mapping table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300 font-medium">
                Key
              </th>
              <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300 font-medium">
                Character
              </th>
              <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300 font-medium">
                Name
              </th>
              <th className="px-4 py-2 text-right text-gray-600 dark:text-gray-300 font-medium w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Add new row */}
            {isAdding && (
              <tr className="bg-green-50 dark:bg-green-900/20">
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={newMapping.latin}
                    onChange={(e) =>
                      setNewMapping({ ...newMapping, latin: e.target.value })
                    }
                    placeholder="e.g., sh"
                    className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                    autoFocus
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={newMapping.char}
                    onChange={(e) =>
                      setNewMapping({ ...newMapping, char: e.target.value })
                    }
                    placeholder="ܫ"
                    className={`w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg ${fontClass}`}
                    dir="rtl"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={newMapping.name}
                    onChange={(e) =>
                      setNewMapping({ ...newMapping, name: e.target.value })
                    }
                    placeholder="Shin"
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={handleAddNew}
                    className="text-green-600 hover:text-green-700 mr-2"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setNewMapping({ latin: '', char: '', name: '' });
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            )}

            {currentMappings.map((mapping, index) => (
              <MappingRow
                key={`${mapping.latin}-${index}`}
                mapping={mapping}
                index={index}
                fontClass={fontClass}
                isEditing={editingIndex === index}
                onEdit={() => setEditingIndex(index)}
                onSave={(updates) => handleSaveEdit(index, updates)}
                onCancel={() => setEditingIndex(null)}
                onDelete={() => handleDelete(index)}
                isVowel={activeTab === 'vowels'}
                script={activeScript}
              />
            ))}

            {currentMappings.length === 0 && !isAdding && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  No mappings defined. Click "Add" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Tip: Use multi-character keys like "sh" for compound letters. They are matched before single characters.
      </p>
    </div>
  );
}

interface MappingRowProps {
  mapping: TranslitMapping;
  index: number;
  fontClass: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<TranslitMapping>) => void;
  onCancel: () => void;
  onDelete: () => void;
  isVowel: boolean;
  script: ScriptType;
}

function MappingRow({
  mapping,
  fontClass,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  isVowel,
  script,
}: MappingRowProps) {
  const [editValues, setEditValues] = useState(mapping);

  // For vowels, show with a base letter for visibility
  const baseChar = script === 'syriac' ? 'ܐ' : 'א';
  const displayChar = isVowel ? baseChar + mapping.char : mapping.char;
  const editDisplayChar = isVowel ? baseChar + editValues.char : editValues.char;

  if (isEditing) {
    return (
      <tr className="bg-blue-50 dark:bg-blue-900/20">
        <td className="px-4 py-2">
          <input
            type="text"
            value={editValues.latin}
            onChange={(e) =>
              setEditValues({ ...editValues, latin: e.target.value })
            }
            className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
          />
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editValues.char}
              onChange={(e) =>
                setEditValues({ ...editValues, char: e.target.value })
              }
              className={`w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg ${fontClass}`}
              dir="rtl"
            />
            {isVowel && (
              <span className={`text-lg ${fontClass} text-gray-400`} dir="rtl">
                ({editDisplayChar})
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-2">
          <input
            type="text"
            value={editValues.name}
            onChange={(e) =>
              setEditValues({ ...editValues, name: e.target.value })
            }
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </td>
        <td className="px-4 py-2 text-right">
          <button
            onClick={() => onSave(editValues)}
            className="text-blue-600 hover:text-blue-700 mr-2"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <td className="px-4 py-2">
        <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-blue-600 dark:text-blue-400">
          {mapping.latin}
        </code>
      </td>
      <td className="px-4 py-2">
        <span className={`text-xl ${fontClass}`} dir="rtl">
          {displayChar}
        </span>
      </td>
      <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
        {mapping.name}
      </td>
      <td className="px-4 py-2 text-right">
        <button
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mr-2"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
