import { useState, useMemo } from 'react';
import type { VerbTable, VerbForm, Segment } from '../../types/verb.ts';
import type { LanguageConfig } from '../../types/language.ts';

interface VerbTableViewProps {
  table: VerbTable;
  language: LanguageConfig;
  onEditClick?: () => void;
}

type Dimension = 'stem' | 'tense' | 'png';

const DIMENSION_LABELS: Record<Dimension, string> = {
  stem: 'Stem',
  tense: 'Tense',
  png: 'Person',
};

/** Canonical ordering for all PNG keys */
const PNG_ORDER = [
  '3ms', '3fs', '2ms', '2fs', '1ms', '1fs',
  '3mp', '3fp', '2mp', '2fp', '1cp',
  'ms', 'fs', 'mp', 'fp',
  'abs',
];

const TENSE_ORDER = [
  'past', 'future', 'imperative', 'infinitive',
  'active-participle', 'passive-participle',
];

const STEM_ORDER = [
  'peal', 'pael', 'aphel', 'ethpeel', 'ethpaal', 'ettaphal',
  'eshtaphal', 'shafel',
];

function getPersonLabel(key: string): string {
  const labels: Record<string, string> = {
    '3ms': '3rd m.sg.', '3fs': '3rd f.sg.',
    '2ms': '2nd m.sg.', '2fs': '2nd f.sg.',
    '1ms': '1st m.sg.', '1fs': '1st f.sg.',
    '3mp': '3rd m.pl.', '3fp': '3rd f.pl.',
    '2mp': '2nd m.pl.', '2fp': '2nd f.pl.',
    '1cp': '1st c.pl.',
    'ms': 'm.sg.', 'fs': 'f.sg.',
    'mp': 'm.pl.', 'fp': 'f.pl.',
    'abs': 'absolute',
  };
  return labels[key] || key;
}

function getTenseLabel(tense: string): string {
  const labels: Record<string, string> = {
    'past': 'Past',
    'future': 'Future',
    'imperative': 'Imper.',
    'infinitive': 'Infin.',
    'active-participle': 'Act. Ptc.',
    'passive-participle': 'Pass. Ptc.',
  };
  return labels[tense] || tense;
}

function getStemLabel(stem: string): string {
  const labels: Record<string, string> = {
    'peal': 'Peal (פְּעַל)',
    'pael': 'Pael (פַּעֵּל)',
    'aphel': 'Aphel (אַפְעֵל)',
    'ethpeel': 'Ethpeel (אֶתְפְּעֵל)',
    'ethpaal': 'Ethpaal (אֶתְפַּעַּל)',
    'ettaphal': 'Ettaphal (אֶתַּפְעַל)',
  };
  return labels[stem] || stem;
}

function getDimensionLabel(dim: Dimension, value: string): string {
  if (dim === 'stem') return getStemLabel(value);
  if (dim === 'tense') return getTenseLabel(value);
  return getPersonLabel(value);
}

/** Look up a form from the 3D data structure */
function getForm(table: VerbTable, stem: string, tense: string, png: string): VerbForm | null {
  return table.stems[stem]?.[tense]?.[png] ?? null;
}

/** Collect all unique values for a dimension, in canonical order */
function getDimensionValues(table: VerbTable, dim: Dimension): string[] {
  const found = new Set<string>();
  for (const [stemName, stemData] of Object.entries(table.stems)) {
    if (dim === 'stem') {
      found.add(stemName);
    } else {
      for (const [tenseName, conjugation] of Object.entries(stemData)) {
        if (dim === 'tense') {
          found.add(tenseName);
        } else {
          for (const pngKey of Object.keys(conjugation)) {
            found.add(pngKey);
          }
        }
      }
    }
  }

  // Sort by canonical order
  const order = dim === 'stem' ? STEM_ORDER : dim === 'tense' ? TENSE_ORDER : PNG_ORDER;
  const ordered = order.filter((v) => found.has(v));
  // Append any unexpected values not in canonical order
  for (const v of found) {
    if (!ordered.includes(v)) ordered.push(v);
  }
  return ordered;
}

/** Map (sectionValue, colValue, rowValue) back to (stem, tense, png) */
function resolveDimensions(
  sectionAxis: Dimension, sectionVal: string,
  colAxis: Dimension, colVal: string,
  rowAxis: Dimension, rowVal: string,
): { stem: string; tense: string; png: string } {
  const map: Record<string, string> = {
    [sectionAxis]: sectionVal,
    [colAxis]: colVal,
    [rowAxis]: rowVal,
  };
  return { stem: map.stem, tense: map.tense, png: map.png };
}

function SegmentedForm({ form, language }: { form: VerbForm; language: LanguageConfig }) {
  if (!form.segments || form.segments.length === 0) {
    return (
      <span
        className={`text-lg ${language.script === 'syriac' ? 'font-syriac' : 'font-hebrew'}`}
        dir={language.direction}
      >
        {form.form}
      </span>
    );
  }

  return (
    <span
      className={`text-lg ${language.script === 'syriac' ? 'font-syriac' : 'font-hebrew'}`}
      dir={language.direction}
    >
      {form.segments.map((segment: Segment, idx: number) => (
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
              : ''
          }
          title={segment.type}
        >
          {segment.text}
        </span>
      ))}
    </span>
  );
}

function ConjugationGrid({
  table,
  language,
  colAxis,
  rowAxis,
}: {
  table: VerbTable;
  language: LanguageConfig;
  colAxis: Dimension;
  rowAxis: Dimension;
}) {
  const sectionAxis = (['stem', 'tense', 'png'] as Dimension[]).find(
    (d) => d !== colAxis && d !== rowAxis
  )!;

  const sections = useMemo(() => getDimensionValues(table, sectionAxis), [table, sectionAxis]);
  const cols = useMemo(() => getDimensionValues(table, colAxis), [table, colAxis]);
  const rows = useMemo(() => getDimensionValues(table, rowAxis), [table, rowAxis]);

  return (
    <div className="space-y-6">
      {sections.map((sectionVal) => (
        <div key={sectionVal} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Section header — only show if more than one section */}
          {sections.length > 1 && (
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-white">
                {getDimensionLabel(sectionAxis, sectionVal)}
              </span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide sticky left-0 bg-white dark:bg-gray-800 z-10">
                    {DIMENSION_LABELS[rowAxis]}
                  </th>
                  {cols.map((colVal) => (
                    <th
                      key={colVal}
                      className="py-2 px-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap"
                    >
                      {getDimensionLabel(colAxis, colVal)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((rowVal) => {
                  // Check if this row has any forms at all in this section
                  const hasAnyForm = cols.some((colVal) => {
                    const { stem, tense, png } = resolveDimensions(
                      sectionAxis, sectionVal, colAxis, colVal, rowAxis, rowVal
                    );
                    return getForm(table, stem, tense, png) !== null;
                  });
                  if (!hasAnyForm) return null;

                  return (
                    <tr
                      key={rowVal}
                      className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-750"
                    >
                      <td className="py-1.5 px-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800 z-10">
                        {getDimensionLabel(rowAxis, rowVal)}
                      </td>
                      {cols.map((colVal) => {
                        const { stem, tense, png } = resolveDimensions(
                          sectionAxis, sectionVal, colAxis, colVal, rowAxis, rowVal
                        );
                        const form = getForm(table, stem, tense, png);
                        return (
                          <td
                            key={colVal}
                            className="py-1.5 px-3 text-center"
                            dir={form ? language.direction : undefined}
                          >
                            {form ? (
                              <SegmentedForm form={form} language={language} />
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

export function VerbTableView({ table, language, onEditClick }: VerbTableViewProps) {
  const [showLegend, setShowLegend] = useState(true);
  const [colAxis, setColAxis] = useState<Dimension>('tense');
  const [rowAxis, setRowAxis] = useState<Dimension>('png');

  const handleColChange = (val: Dimension) => {
    if (val === rowAxis) setRowAxis(colAxis);
    setColAxis(val);
  };

  const handleRowChange = (val: Dimension) => {
    if (val === colAxis) setColAxis(rowAxis);
    setRowAxis(val);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {table.classDisplayName}
          </h3>
          <div className="flex items-center gap-4 mt-1">
            <span
              className={`text-2xl ${language.script === 'syriac' ? 'font-syriac' : 'font-hebrew'}`}
              dir={language.direction}
            >
              {table.paradigmRoot}
            </span>
            {table.rootMeaning && (
              <span className="text-gray-500 dark:text-gray-400">
                "{table.rootMeaning}"
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {showLegend ? 'Hide' : 'Show'} Legend
          </button>
          {onEditClick && (
            <button
              onClick={onEditClick}
              className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              Edit Table
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-500 rounded"></span>
            <span>Root</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-500 rounded"></span>
            <span>Prefix</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-purple-500 rounded"></span>
            <span>Suffix</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-orange-500 rounded"></span>
            <span>Vowel</span>
          </span>
        </div>
      )}

      {/* Axis selectors */}
      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
          <span>Columns:</span>
          <select
            value={colAxis}
            onChange={(e) => handleColChange(e.target.value as Dimension)}
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            <option value="stem">Stem</option>
            <option value="tense">Tense</option>
            <option value="png">Person</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
          <span>Rows:</span>
          <select
            value={rowAxis}
            onChange={(e) => handleRowChange(e.target.value as Dimension)}
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            <option value="stem">Stem</option>
            <option value="tense">Tense</option>
            <option value="png">Person</option>
          </select>
        </label>
        <span className="text-gray-400 dark:text-gray-500 text-xs">
          Sections: {DIMENSION_LABELS[(['stem', 'tense', 'png'] as Dimension[]).find(
            (d) => d !== colAxis && d !== rowAxis
          )!]}
        </span>
      </div>

      {/* Grid */}
      <ConjugationGrid
        table={table}
        language={language}
        colAxis={colAxis}
        rowAxis={rowAxis}
      />

      {/* Notes */}
      {table.notes && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Notes:</strong> {table.notes}
        </div>
      )}
    </div>
  );
}
