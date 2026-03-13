import { useState, useCallback } from 'react';
import type { VerbTable, VerbForm, Segment, SegmentType } from '../../types/verb.ts';
import type { LanguageConfig } from '../../types/language.ts';
import { OnScreenKeyboard } from '../common/OnScreenKeyboard.tsx';

interface VerbTableEditorProps {
  table: VerbTable;
  language: LanguageConfig;
  onSave: (table: VerbTable) => void;
  onCancel: () => void;
}

interface EditingCell {
  stem: string;
  tense: string;
  person: string;
}

const PERSON_ORDER = ['3ms', '3fs', '2ms', '2fs', '1ms', '1fs', '3mp', '3fp', '2mp', '2fp', '1cp'];
const PARTICIPLE_ORDER = ['ms', 'fs', 'mp', 'fp'];

function getPersonLabel(key: string): string {
  const labels: Record<string, string> = {
    '3ms': '3rd m.sg.',
    '3fs': '3rd f.sg.',
    '2ms': '2nd m.sg.',
    '2fs': '2nd f.sg.',
    '1ms': '1st m.sg.',
    '1fs': '1st f.sg.',
    '3mp': '3rd m.pl.',
    '3fp': '3rd f.pl.',
    '2mp': '2nd m.pl.',
    '2fp': '2nd f.pl.',
    '1cp': '1st c.pl.',
    'ms': 'm.sg.',
    'fs': 'f.sg.',
    'mp': 'm.pl.',
    'fp': 'f.pl.',
    'abs': 'absolute',
  };
  return labels[key] || key;
}

function getTenseLabel(tense: string): string {
  const labels: Record<string, string> = {
    'past': 'Past',
    'future': 'Future',
    'imperative': 'Imperative',
    'infinitive': 'Infinitive',
    'active-participle': 'Active Ptc.',
    'passive-participle': 'Passive Ptc.',
  };
  return labels[tense] || tense;
}

function getStemLabel(stem: string): string {
  const labels: Record<string, string> = {
    'peal': 'Peal',
    'pael': 'Pael',
    'aphel': 'Aphel',
    'ethpeel': 'Ethpeel',
    'ethpaal': 'Ethpaal',
    'ettaphal': 'Ettaphal',
  };
  return labels[stem] || stem;
}

const SEGMENT_TYPES: { type: SegmentType; label: string; color: string }[] = [
  { type: 'root', label: 'Root', color: 'bg-blue-500' },
  { type: 'prefix', label: 'Prefix', color: 'bg-green-500' },
  { type: 'suffix', label: 'Suffix', color: 'bg-purple-500' },
  { type: 'vowel', label: 'Vowel', color: 'bg-orange-500' },
  { type: 'infix', label: 'Infix', color: 'bg-pink-500' },
];

function SegmentEditor({
  form,
  language,
  onChange,
}: {
  form: VerbForm;
  language: LanguageConfig;
  onChange: (form: VerbForm) => void;
}) {
  const [formText, setFormText] = useState(form.form);
  const [segments, setSegments] = useState<Segment[]>(form.segments || []);
  const [selectedType, setSelectedType] = useState<SegmentType>('root');
  const [showKeyboard, setShowKeyboard] = useState(false);

  const handleFormChange = (text: string) => {
    setFormText(text);
    onChange({ ...form, form: text });
  };

  const handleKeyPress = (char: string) => {
    const newText = formText + char;
    setFormText(newText);
    onChange({ ...form, form: newText });
  };

  const handleBackspace = () => {
    if (formText.length > 0) {
      const newText = formText.slice(0, -1);
      setFormText(newText);
      onChange({ ...form, form: newText });
    }
  };

  const addSegment = () => {
    const newSegments = [...segments, { text: '', type: selectedType }];
    setSegments(newSegments);
    onChange({ ...form, segments: newSegments });
  };

  const updateSegment = (index: number, text: string) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], text };
    setSegments(newSegments);
    onChange({ ...form, segments: newSegments });
  };

  const updateSegmentType = (index: number, type: SegmentType) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], type };
    setSegments(newSegments);
    onChange({ ...form, segments: newSegments });
  };

  const removeSegment = (index: number) => {
    const newSegments = segments.filter((_, i) => i !== index);
    setSegments(newSegments);
    onChange({ ...form, segments: newSegments });
  };

  const autoSegment = () => {
    // Simple auto-segmentation: each character becomes a root segment
    const chars = [...formText];
    const newSegments: Segment[] = chars.map((char) => ({
      text: char,
      type: 'root' as SegmentType,
    }));
    setSegments(newSegments);
    onChange({ ...form, segments: newSegments });
  };

  return (
    <div className="space-y-4">
      {/* Form input */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Form
          </label>
          <button
            type="button"
            onClick={() => setShowKeyboard(!showKeyboard)}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            {showKeyboard ? 'Hide Keyboard' : 'Show Keyboard'}
          </button>
        </div>
        <input
          type="text"
          value={formText}
          onChange={(e) => handleFormChange(e.target.value)}
          dir={language.direction}
          className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-xl ${
            language.script === 'syriac' ? 'font-syriac' : 'font-hebrew'
          }`}
        />
        {showKeyboard && (
          <div className="mt-2">
            <OnScreenKeyboard
              script={language.script}
              onKeyPress={handleKeyPress}
              onBackspace={handleBackspace}
            />
          </div>
        )}
      </div>

      {/* Segments */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Segments
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={autoSegment}
              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Auto-segment
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={segment.text}
                onChange={(e) => updateSegment(index, e.target.value)}
                dir={language.direction}
                className={`w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-lg ${
                  language.script === 'syriac' ? 'font-syriac' : 'font-hebrew'
                }`}
              />
              <select
                value={segment.type}
                onChange={(e) => updateSegmentType(index, e.target.value as SegmentType)}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
              >
                {SEGMENT_TYPES.map((st) => (
                  <option key={st.type} value={st.type}>
                    {st.label}
                  </option>
                ))}
              </select>
              <span
                className={`w-3 h-3 rounded ${
                  SEGMENT_TYPES.find((st) => st.type === segment.type)?.color || 'bg-gray-400'
                }`}
              />
              <button
                type="button"
                onClick={() => removeSegment(index)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as SegmentType)}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
          >
            {SEGMENT_TYPES.map((st) => (
              <option key={st.type} value={st.type}>
                {st.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addSegment}
            className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
          >
            + Add Segment
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Preview:</div>
        <div
          dir={language.direction}
          className={`text-xl ${language.script === 'syriac' ? 'font-syriac' : 'font-hebrew'}`}
        >
          {segments.map((segment, idx) => (
            <span
              key={idx}
              className={
                segment.type === 'root'
                  ? 'text-blue-700 dark:text-blue-300'
                  : segment.type === 'prefix'
                  ? 'text-green-700 dark:text-green-300'
                  : segment.type === 'suffix'
                  ? 'text-purple-700 dark:text-purple-300'
                  : segment.type === 'vowel'
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-pink-600 dark:text-pink-400'
              }
            >
              {segment.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VerbTableEditor({ table, language, onSave, onCancel }: VerbTableEditorProps) {
  const [editedTable, setEditedTable] = useState<VerbTable>(structuredClone(table));
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [activeTab, setActiveTab] = useState<string>(Object.keys(table.stems)[0] || 'peal');

  const updateForm = useCallback(
    (stem: string, tense: string, person: string, form: VerbForm) => {
      setEditedTable((prev) => {
        const newTable = structuredClone(prev);
        if (!newTable.stems[stem]) {
          newTable.stems[stem] = {};
        }
        if (!newTable.stems[stem][tense]) {
          newTable.stems[stem][tense] = {};
        }
        newTable.stems[stem][tense][person] = form;
        return newTable;
      });
    },
    []
  );

  const handleSave = () => {
    onSave(editedTable);
  };

  const currentStemData = editedTable.stems[activeTab] || {};
  const tenses = Object.entries(currentStemData);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Edit: {table.classDisplayName}
          </h3>
          <div
            className={`text-2xl mt-1 ${language.script === 'syriac' ? 'font-syriac' : 'font-hebrew'}`}
            dir={language.direction}
          >
            {table.paradigmRoot}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Stem Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1 overflow-x-auto">
          {Object.keys(editedTable.stems).map((stem) => (
            <button
              key={stem}
              onClick={() => setActiveTab(stem)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === stem
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {getStemLabel(stem)}
            </button>
          ))}
        </div>
      </div>

      {/* Editing Modal */}
      {editingCell && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h4 className="text-lg font-medium mb-4">
              Edit: {getStemLabel(editingCell.stem)} {getTenseLabel(editingCell.tense)}{' '}
              {getPersonLabel(editingCell.person)}
            </h4>
            <SegmentEditor
              form={
                editedTable.stems[editingCell.stem]?.[editingCell.tense]?.[editingCell.person] || {
                  form: '',
                  segments: [],
                }
              }
              language={language}
              onChange={(form) =>
                updateForm(editingCell.stem, editingCell.tense, editingCell.person, form)
              }
            />
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingCell(null)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tense Tables */}
      <div className="space-y-6">
        {tenses.map(([tenseName, conjugation]) => {
          const isParticiple = tenseName.includes('participle');
          const order = isParticiple ? PARTICIPLE_ORDER : PERSON_ORDER;
          const entries = order.filter((key) => conjugation[key] || true);

          return (
            <div
              key={tenseName}
              className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
            >
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 font-medium">
                {getTenseLabel(tenseName)}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    {entries.map((person) => {
                      const form = conjugation[person] || { form: '', segments: [] };
                      return (
                        <tr
                          key={person}
                          className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-750"
                        >
                          <td className="py-2 px-4 text-sm text-gray-500 dark:text-gray-400 w-28">
                            {getPersonLabel(person)}
                          </td>
                          <td
                            className={`py-2 px-4 text-xl ${
                              language.script === 'syriac' ? 'font-syriac' : 'font-hebrew'
                            }`}
                            dir={language.direction}
                          >
                            {form.form || (
                              <span className="text-gray-300 dark:text-gray-600 text-sm">
                                (empty)
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-right">
                            <button
                              onClick={() =>
                                setEditingCell({ stem: activeTab, tense: tenseName, person })
                              }
                              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
