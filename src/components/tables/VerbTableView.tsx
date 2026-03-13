import { useState } from 'react';
import type { VerbTable, VerbForm, Segment } from '../../types/verb.ts';
import type { LanguageConfig } from '../../types/language.ts';

interface VerbTableViewProps {
  table: VerbTable;
  language: LanguageConfig;
  onEditClick?: () => void;
}

interface CollapsedState {
  [key: string]: boolean;
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
    'past': 'Past (Perfect)',
    'future': 'Future (Imperfect)',
    'imperative': 'Imperative',
    'infinitive': 'Infinitive',
    'active-participle': 'Active Participle',
    'passive-participle': 'Passive Participle',
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

function SegmentedForm({ form, language }: { form: VerbForm; language: LanguageConfig }) {
  if (!form.segments || form.segments.length === 0) {
    return (
      <span
        className={`text-xl ${language.script === 'syriac' ? 'font-syriac' : 'font-hebrew'}`}
        dir={language.direction}
      >
        {form.form}
      </span>
    );
  }

  return (
    <span
      className={`text-xl ${language.script === 'syriac' ? 'font-syriac' : 'font-hebrew'}`}
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

function TenseTable({
  tense,
  conjugation,
  language,
}: {
  tense: string;
  conjugation: Record<string, VerbForm>;
  language: LanguageConfig;
}) {
  const isParticiple = tense.includes('participle');
  const order = isParticiple ? PARTICIPLE_ORDER : PERSON_ORDER;
  const entries = order
    .filter((key) => conjugation[key])
    .map((key) => ({ key, form: conjugation[key] }));

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <tbody>
          {entries.map(({ key, form }) => (
            <tr key={key} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
              <td className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400 w-28">
                {getPersonLabel(key)}
              </td>
              <td className="py-2 px-3" dir={language.direction}>
                <SegmentedForm form={form} language={language} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function VerbTableView({ table, language, onEditClick }: VerbTableViewProps) {
  const [collapsedStems, setCollapsedStems] = useState<CollapsedState>({});
  const [collapsedTenses, setCollapsedTenses] = useState<CollapsedState>({});
  const [showLegend, setShowLegend] = useState(true);

  const toggleStem = (stem: string) => {
    setCollapsedStems((prev) => ({ ...prev, [stem]: !prev[stem] }));
  };

  const toggleTense = (stem: string, tense: string) => {
    const key = `${stem}-${tense}`;
    setCollapsedTenses((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const stems = Object.entries(table.stems);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
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

      {/* Stems */}
      <div className="space-y-4">
        {stems.map(([stemName, stemData]) => {
          const isCollapsed = collapsedStems[stemName];
          const tenses = Object.entries(stemData);

          return (
            <div
              key={stemName}
              className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
            >
              {/* Stem Header */}
              <button
                onClick={() => toggleStem(stemName)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-750 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-white">
                  {getStemLabel(stemName)}
                </span>
                <span className="text-gray-400">
                  {isCollapsed ? '▶' : '▼'}
                </span>
              </button>

              {/* Tenses */}
              {!isCollapsed && (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {tenses.map(([tenseName, conjugation]) => {
                    const tenseKey = `${stemName}-${tenseName}`;
                    const isTenseCollapsed = collapsedTenses[tenseKey];

                    return (
                      <div key={tenseName}>
                        {/* Tense Header */}
                        <button
                          onClick={() => toggleTense(stemName, tenseName)}
                          className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {getTenseLabel(tenseName)}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {isTenseCollapsed ? '▶' : '▼'}
                          </span>
                        </button>

                        {/* Conjugation Table */}
                        {!isTenseCollapsed && (
                          <div className="px-4 pb-3">
                            <TenseTable
                              tense={tenseName}
                              conjugation={conjugation}
                              language={language}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Notes */}
      {table.notes && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Notes:</strong> {table.notes}
        </div>
      )}
    </div>
  );
}
