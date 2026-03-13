import { useState } from 'react';
import type { TranslitMapping } from '../../utils/transliteration';
import { useTransliterationStore } from '../../stores/transliterationStore';
import type { ScriptType } from '../../types/language';

interface TransliterationHelpProps {
  script: ScriptType;
}

export function TransliterationHelp({ script }: TransliterationHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { getMappings } = useTransliterationStore();
  const { consonants, vowels } = getMappings(script);

  const fontClass = script === 'syriac' ? 'font-syriac' : 'font-hebrew';

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-300 dark:border-gray-600 rounded-full w-5 h-5 inline-flex items-center justify-center"
        title="Transliteration help"
      >
        ?
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Popup */}
          <div className="absolute left-0 top-7 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-80 max-h-96 overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Type English letters to auto-convert to {script === 'syriac' ? 'Syriac' : 'Hebrew'}
            </p>

            {/* Consonants */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                Consonants
              </h4>
              <div className="grid grid-cols-4 gap-1 text-sm">
                {consonants.map((m) => (
                  <MappingCell key={m.latin} mapping={m} fontClass={fontClass} />
                ))}
              </div>
            </div>

            {/* Vowels */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                Vowels
              </h4>
              <div className="grid grid-cols-4 gap-1 text-sm">
                {vowels.map((m) => (
                  <MappingCell key={m.latin} mapping={m} fontClass={fontClass} showWithAlef />
                ))}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              <p><strong>Tips:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">sh</code> = shin/shin</li>
                <li>Uppercase for emphatics (T, S) or finals (K, M, N)</li>
                <li>Vowels follow the consonant they mark</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MappingCell({
  mapping,
  fontClass,
  showWithAlef = false,
}: {
  mapping: TranslitMapping;
  fontClass: string;
  showWithAlef?: boolean;
}) {
  // For vowels, show with a base letter for visibility
  const displayChar = showWithAlef
    ? (fontClass.includes('syriac') ? 'ܐ' + mapping.char : 'א' + mapping.char)
    : mapping.char;

  return (
    <div
      className="flex items-center gap-1 p-1 rounded bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
      title={mapping.name}
    >
      <span className="font-mono text-blue-600 dark:text-blue-400 w-5 text-center">
        {mapping.latin}
      </span>
      <span className={`${fontClass} text-lg`} dir="rtl">
        {displayChar}
      </span>
    </div>
  );
}
