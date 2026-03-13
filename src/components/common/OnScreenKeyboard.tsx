import { useState } from 'react';
import type { ScriptType } from '../../types/language.ts';

interface OnScreenKeyboardProps {
  script: ScriptType;
  onKeyPress: (char: string) => void;
  onBackspace?: () => void;
  className?: string;
}

interface KeyDef {
  char: string;
  name: string;
}

interface KeyboardLayout {
  letters: KeyDef[][];
  vowels: KeyDef[][];
}

const SYRIAC_LAYOUT: KeyboardLayout = {
  letters: [
    [
      { char: 'ܐ', name: 'Alap' },
      { char: 'ܒ', name: 'Beth' },
      { char: 'ܓ', name: 'Gamal' },
      { char: 'ܕ', name: 'Dalath' },
      { char: 'ܗ', name: 'He' },
      { char: 'ܘ', name: 'Waw' },
      { char: 'ܙ', name: 'Zain' },
      { char: 'ܚ', name: 'Heth' },
      { char: 'ܛ', name: 'Teth' },
      { char: 'ܝ', name: 'Yodh' },
      { char: 'ܟ', name: 'Kap' },
    ],
    [
      { char: 'ܠ', name: 'Lamadh' },
      { char: 'ܡ', name: 'Mim' },
      { char: 'ܢ', name: 'Nun' },
      { char: 'ܣ', name: 'Semkath' },
      { char: 'ܥ', name: 'E' },
      { char: 'ܦ', name: 'Pe' },
      { char: 'ܨ', name: 'Sadhe' },
      { char: 'ܩ', name: 'Qop' },
      { char: 'ܪ', name: 'Resh' },
      { char: 'ܫ', name: 'Shin' },
      { char: 'ܬ', name: 'Taw' },
    ],
  ],
  vowels: [
    [
      { char: 'ܰ', name: 'Pthaha (a)' },
      { char: 'ܳ', name: 'Zqapha (o)' },
      { char: 'ܶ', name: 'Rbasa (e)' },
      { char: 'ܺ', name: 'Hbasa (i)' },
      { char: 'ܽ', name: 'Esasa (u)' },
      { char: 'ܱ', name: 'Pthaha dot' },
      { char: 'ܴ', name: 'Zqapha dot' },
      { char: 'ܷ', name: 'Rbasa dot' },
      { char: 'ܻ', name: 'Hbasa dot' },
      { char: 'ܾ', name: 'Esasa dot' },
    ],
    [
      { char: 'ܲ', name: 'Pthaha above' },
      { char: 'ܵ', name: 'Zqapha above' },
      { char: 'ܸ', name: 'Rbasa above' },
      { char: 'ܼ', name: 'Hbasa above' },
      { char: 'ܿ', name: 'Rwaha' },
      { char: '̈', name: 'Seyame (pl.)' },
      { char: '̇', name: 'Qushshaya' },
      { char: '̣', name: 'Rukkakha' },
      { char: 'ܑ', name: 'Fem. dot' },
      { char: '̄', name: 'Line above' },
    ],
  ],
};

const HEBREW_LAYOUT: KeyboardLayout = {
  letters: [
    [
      { char: 'א', name: 'Alef' },
      { char: 'ב', name: 'Bet' },
      { char: 'ג', name: 'Gimel' },
      { char: 'ד', name: 'Dalet' },
      { char: 'ה', name: 'He' },
      { char: 'ו', name: 'Vav' },
      { char: 'ז', name: 'Zayin' },
      { char: 'ח', name: 'Het' },
      { char: 'ט', name: 'Tet' },
      { char: 'י', name: 'Yod' },
      { char: 'כ', name: 'Kaf' },
      { char: 'ך', name: 'Kaf final' },
    ],
    [
      { char: 'ל', name: 'Lamed' },
      { char: 'מ', name: 'Mem' },
      { char: 'ם', name: 'Mem final' },
      { char: 'נ', name: 'Nun' },
      { char: 'ן', name: 'Nun final' },
      { char: 'ס', name: 'Samekh' },
      { char: 'ע', name: 'Ayin' },
      { char: 'פ', name: 'Pe' },
      { char: 'ף', name: 'Pe final' },
      { char: 'צ', name: 'Tsadi' },
      { char: 'ץ', name: 'Tsadi final' },
      { char: 'ק', name: 'Qof' },
      { char: 'ר', name: 'Resh' },
      { char: 'ש', name: 'Shin' },
      { char: 'ת', name: 'Tav' },
    ],
  ],
  vowels: [
    [
      { char: 'ַ', name: 'Patach (a)' },
      { char: 'ָ', name: 'Qamats (a/o)' },
      { char: 'ֶ', name: 'Segol (e)' },
      { char: 'ֵ', name: 'Tsere (e)' },
      { char: 'ִ', name: 'Hiriq (i)' },
      { char: 'ֹ', name: 'Holam (o)' },
      { char: 'ֻ', name: 'Qubuts (u)' },
      { char: 'ּ', name: 'Dagesh' },
    ],
    [
      { char: 'ְ', name: 'Shva' },
      { char: 'ֲ', name: 'Hataf Patach' },
      { char: 'ֳ', name: 'Hataf Qamats' },
      { char: 'ֱ', name: 'Hataf Segol' },
      { char: 'ׁ', name: 'Shin dot' },
      { char: 'ׂ', name: 'Sin dot' },
      { char: '־', name: 'Maqaf' },
      { char: 'ֽ', name: 'Meteg' },
    ],
  ],
};

function getLayout(script: ScriptType): KeyboardLayout {
  switch (script) {
    case 'syriac':
      return SYRIAC_LAYOUT;
    case 'hebrew':
      return HEBREW_LAYOUT;
    default:
      return HEBREW_LAYOUT;
  }
}

export function OnScreenKeyboard({
  script,
  onKeyPress,
  onBackspace,
  className = '',
}: OnScreenKeyboardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const layout = getLayout(script);
  const fontClass = script === 'syriac' ? 'font-syriac' : 'font-hebrew';

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className={`text-sm text-blue-600 dark:text-blue-400 hover:underline ${className}`}
      >
        Show Keyboard
      </button>
    );
  }

  return (
    <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Letters & Vowels</span>
        <div className="flex gap-2">
          {onBackspace && (
            <button
              onClick={onBackspace}
              className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800"
            >
              ⌫
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            Hide
          </button>
        </div>
      </div>

      {/* Letters */}
      <div className="space-y-1 mb-2" dir="rtl">
        {layout.letters.map((row, rowIdx) => (
          <div key={`letters-${rowIdx}`} className="flex gap-1 justify-center flex-wrap">
            {row.map((key) => (
              <button
                key={key.char}
                onClick={() => onKeyPress(key.char)}
                title={key.name}
                className={`w-9 h-9 text-lg ${fontClass} bg-white dark:bg-gray-700 rounded shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900 hover:shadow transition-all active:scale-95`}
              >
                {key.char}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Vowels/Diacritics */}
      <div className="space-y-1 border-t border-gray-200 dark:border-gray-700 pt-2">
        {layout.vowels.map((row, rowIdx) => (
          <div key={`vowels-${rowIdx}`} className="flex gap-1 justify-center flex-wrap">
            {row.map((key) => (
              <button
                key={key.char + key.name}
                onClick={() => onKeyPress(key.char)}
                title={key.name}
                className={`w-9 h-9 text-lg ${fontClass} bg-orange-50 dark:bg-orange-900/30 rounded shadow-sm hover:bg-orange-100 dark:hover:bg-orange-800/50 hover:shadow transition-all active:scale-95`}
              >
                ◌{key.char}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
