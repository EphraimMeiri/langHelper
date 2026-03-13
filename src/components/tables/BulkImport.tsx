import { useState, useMemo } from 'react';
import type { VerbTable, VerbForm, Segment } from '../../types/verb.ts';
import type { LanguageConfig } from '../../types/language.ts';

interface BulkImportProps {
  language: LanguageConfig;
  existingTable?: VerbTable;
  onImport: (table: VerbTable) => void;
  onCancel: () => void;
}

interface ParsedRow {
  cells: string[];
}

interface ColumnMapping {
  columnIndex: number;
  mappingType: 'person' | 'tense' | 'stem' | 'form' | 'ignore';
  value?: string;
}

const PERSON_OPTIONS = [
  { value: '3ms', label: '3rd m.sg.' },
  { value: '3fs', label: '3rd f.sg.' },
  { value: '2ms', label: '2nd m.sg.' },
  { value: '2fs', label: '2nd f.sg.' },
  { value: '1ms', label: '1st m.sg.' },
  { value: '1fs', label: '1st f.sg.' },
  { value: '3mp', label: '3rd m.pl.' },
  { value: '3fp', label: '3rd f.pl.' },
  { value: '2mp', label: '2nd m.pl.' },
  { value: '2fp', label: '2nd f.pl.' },
  { value: '1cp', label: '1st c.pl.' },
  { value: 'ms', label: 'm.sg. (participle)' },
  { value: 'fs', label: 'f.sg. (participle)' },
  { value: 'mp', label: 'm.pl. (participle)' },
  { value: 'fp', label: 'f.pl. (participle)' },
  { value: 'abs', label: 'absolute (infinitive)' },
];

const TENSE_OPTIONS = [
  { value: 'past', label: 'Past' },
  { value: 'future', label: 'Future' },
  { value: 'imperative', label: 'Imperative' },
  { value: 'infinitive', label: 'Infinitive' },
  { value: 'active-participle', label: 'Active Participle' },
  { value: 'passive-participle', label: 'Passive Participle' },
];

const STEM_OPTIONS = [
  { value: 'peal', label: 'Peal' },
  { value: 'pael', label: 'Pael' },
  { value: 'aphel', label: 'Aphel' },
  { value: 'ethpeel', label: 'Ethpeel' },
  { value: 'ethpaal', label: 'Ethpaal' },
  { value: 'ettaphal', label: 'Ettaphal' },
];

function parseTSV(input: string): ParsedRow[] {
  const lines = input.trim().split('\n');
  return lines.map((line) => ({
    cells: line.split('\t').map((cell) => cell.trim()),
  }));
}

function parseCSV(input: string): ParsedRow[] {
  const lines = input.trim().split('\n');
  return lines.map((line) => ({
    cells: line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')),
  }));
}

function autoSegmentForm(form: string): Segment[] {
  // Simple auto-segmentation: each grapheme cluster becomes a root segment
  const chars = [...form];
  return chars.map((char) => ({
    text: char,
    type: 'root' as const,
  }));
}

export function BulkImport({ language, existingTable, onImport, onCancel }: BulkImportProps) {
  const [rawInput, setRawInput] = useState('');
  const [delimiter, setDelimiter] = useState<'tab' | 'comma'>('tab');
  const [hasHeaderRow, setHasHeaderRow] = useState(true);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [tableMetadata, setTableMetadata] = useState({
    class: existingTable?.class || '',
    classDisplayName: existingTable?.classDisplayName || '',
    paradigmRoot: existingTable?.paradigmRoot || '',
    rootMeaning: existingTable?.rootMeaning || '',
  });
  const [step, setStep] = useState<'input' | 'mapping' | 'preview'>('input');

  const parsedData = useMemo(() => {
    if (!rawInput) return [];
    return delimiter === 'tab' ? parseTSV(rawInput) : parseCSV(rawInput);
  }, [rawInput, delimiter]);

  const dataRows = useMemo(() => {
    return hasHeaderRow ? parsedData.slice(1) : parsedData;
  }, [parsedData, hasHeaderRow]);

  const headerRow = useMemo(() => {
    return hasHeaderRow && parsedData.length > 0 ? parsedData[0].cells : [];
  }, [parsedData, hasHeaderRow]);

  const columnCount = useMemo(() => {
    return parsedData.reduce((max, row) => Math.max(max, row.cells.length), 0);
  }, [parsedData]);

  const initializeMappings = () => {
    const mappings: ColumnMapping[] = [];
    for (let i = 0; i < columnCount; i++) {
      mappings.push({
        columnIndex: i,
        mappingType: i === 0 ? 'person' : 'form',
      });
    }
    setColumnMappings(mappings);
    setStep('mapping');
  };

  const updateMapping = (index: number, updates: Partial<ColumnMapping>) => {
    setColumnMappings((prev) => {
      const newMappings = [...prev];
      newMappings[index] = { ...newMappings[index], ...updates };
      return newMappings;
    });
  };

  const generateTable = (): VerbTable => {
    const stems: VerbTable['stems'] = existingTable?.stems
      ? structuredClone(existingTable.stems)
      : {};

    // Find which columns are person, tense, stem, and form
    const personCol = columnMappings.find((m) => m.mappingType === 'person');
    const formCols = columnMappings.filter((m) => m.mappingType === 'form');

    for (const row of dataRows) {
      // Get person from row or from column header
      let person = personCol ? row.cells[personCol.columnIndex] : '';

      // Try to match person to a known value
      const personMatch = PERSON_OPTIONS.find(
        (p) => p.label.toLowerCase().includes(person.toLowerCase()) || p.value === person
      );
      const personKey = personMatch?.value || person;

      for (const formCol of formCols) {
        const formValue = row.cells[formCol.columnIndex];
        if (!formValue) continue;

        // Get stem and tense from the column's mapping or try to parse from header
        const stem = formCol.value?.split('-')[0] || 'peal';
        const tense = formCol.value?.split('-')[1] || 'past';

        if (!stems[stem]) {
          stems[stem] = {};
        }
        if (!stems[stem][tense]) {
          stems[stem][tense] = {};
        }

        const verbForm: VerbForm = {
          form: formValue,
          segments: autoSegmentForm(formValue),
        };

        stems[stem][tense][personKey] = verbForm;
      }
    }

    const now = new Date().toISOString();
    return {
      id: existingTable?.id || `${language.id}-${tableMetadata.class}-${Date.now()}`,
      languageId: language.id,
      class: tableMetadata.class,
      classDisplayName: tableMetadata.classDisplayName,
      paradigmRoot: tableMetadata.paradigmRoot,
      rootMeaning: tableMetadata.rootMeaning,
      stems,
      createdAt: existingTable?.createdAt || now,
      updatedAt: now,
    };
  };

  const handleImport = () => {
    const table = generateTable();
    onImport(table);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Bulk Import
        </h3>
        <button
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

      {/* Step 1: Input */}
      {step === 'input' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h4 className="font-medium mb-4">Table Metadata</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Verb Class ID
                </label>
                <input
                  type="text"
                  value={tableMetadata.class}
                  onChange={(e) =>
                    setTableMetadata((prev) => ({ ...prev, class: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="e.g., strong"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={tableMetadata.classDisplayName}
                  onChange={(e) =>
                    setTableMetadata((prev) => ({ ...prev, classDisplayName: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="e.g., Strong Verbs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Paradigm Root
                </label>
                <input
                  type="text"
                  value={tableMetadata.paradigmRoot}
                  onChange={(e) =>
                    setTableMetadata((prev) => ({ ...prev, paradigmRoot: e.target.value }))
                  }
                  dir={language.direction}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-xl ${
                    language.script === 'syriac' ? 'font-syriac' : 'font-hebrew'
                  }`}
                  placeholder="ܩܛܠ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Root Meaning
                </label>
                <input
                  type="text"
                  value={tableMetadata.rootMeaning}
                  onChange={(e) =>
                    setTableMetadata((prev) => ({ ...prev, rootMeaning: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="e.g., to kill"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h4 className="font-medium mb-4">Paste Table Data</h4>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={delimiter === 'tab'}
                  onChange={() => setDelimiter('tab')}
                />
                <span className="text-sm">Tab-separated (TSV)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={delimiter === 'comma'}
                  onChange={() => setDelimiter('comma')}
                />
                <span className="text-sm">Comma-separated (CSV)</span>
              </label>
              <label className="flex items-center gap-2 ml-4">
                <input
                  type="checkbox"
                  checked={hasHeaderRow}
                  onChange={(e) => setHasHeaderRow(e.target.checked)}
                />
                <span className="text-sm">First row is header</span>
              </label>
            </div>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              className="w-full h-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-sm"
              placeholder="Paste your table data here...&#10;Person&#9;Peal Past&#9;Peal Future&#10;3ms&#9;ܩܛܰܠ&#9;ܢܶܩܛܽܘܠ&#10;..."
              dir="ltr"
            />
            {parsedData.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Detected {parsedData.length} rows, {columnCount} columns
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={initializeMappings}
              disabled={parsedData.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Map Columns
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 'mapping' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h4 className="font-medium mb-4">Map Columns to Grammar Categories</h4>
            <p className="text-sm text-gray-500 mb-4">
              Specify what each column contains. For form columns, select the stem-tense
              combination.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-2">Column</th>
                    <th className="text-left py-2 px-2">Header</th>
                    <th className="text-left py-2 px-2">Sample</th>
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-left py-2 px-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {columnMappings.map((mapping, idx) => (
                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2 px-2 text-gray-500">{idx + 1}</td>
                      <td className="py-2 px-2">{headerRow[idx] || '-'}</td>
                      <td
                        className={`py-2 px-2 ${
                          language.script === 'syriac' ? 'font-syriac' : 'font-hebrew'
                        }`}
                        dir={language.direction}
                      >
                        {dataRows[0]?.cells[idx] || '-'}
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={mapping.mappingType}
                          onChange={(e) =>
                            updateMapping(idx, {
                              mappingType: e.target.value as ColumnMapping['mappingType'],
                            })
                          }
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                        >
                          <option value="person">Person/Number</option>
                          <option value="form">Verb Form</option>
                          <option value="ignore">Ignore</option>
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        {mapping.mappingType === 'form' && (
                          <select
                            value={mapping.value || ''}
                            onChange={(e) => updateMapping(idx, { value: e.target.value })}
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                          >
                            <option value="">Select...</option>
                            {STEM_OPTIONS.map((stem) =>
                              TENSE_OPTIONS.map((tense) => (
                                <option
                                  key={`${stem.value}-${tense.value}`}
                                  value={`${stem.value}-${tense.value}`}
                                >
                                  {stem.label} {tense.label}
                                </option>
                              ))
                            )}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('input')}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Back
            </button>
            <button
              onClick={() => setStep('preview')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next: Preview
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h4 className="font-medium mb-4">Preview Import</h4>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Class:</strong> {tableMetadata.classDisplayName} ({tableMetadata.class})
              </p>
              <p
                className={`text-lg ${language.script === 'syriac' ? 'font-syriac' : 'font-hebrew'}`}
                dir={language.direction}
              >
                <strong>Root:</strong> {tableMetadata.paradigmRoot}
                {tableMetadata.rootMeaning && ` (${tableMetadata.rootMeaning})`}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-64 overflow-auto">
              <pre className="text-xs">
                {JSON.stringify(generateTable().stems, null, 2)}
              </pre>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('mapping')}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Import Table
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
