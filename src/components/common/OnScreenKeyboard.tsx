import { useState, useMemo } from 'react';
import type { ScriptType } from '../../types/language.ts';
import {
  SYRIAC_CONSONANT_MAP, SYRIAC_VOWEL_MAP,
  HEBREW_CONSONANT_MAP, HEBREW_VOWEL_MAP,
} from '../../utils/transliteration.ts';
import { syriacToCAL, calToHebrew, HEBREW_NIKUD_TO_SYRIAC } from '../../utils/calTransliteration.ts';
import { convertSyriacVowelStyle } from '../../utils/syriacText.ts';
import { useSettingsStore } from '../../stores/settingsStore.ts';

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
  const syriacVocalization = useSettingsStore((s) => s.syriacVocalization);

  // When clicking a vowel key, insert the correct codepoint for current vocalization
  const handleVowelPress = (char: string) => {
    if (script !== 'syriac') { onKeyPress(char); return; }
    onKeyPress(convertSyriacVowelStyle(char, syriacVocalization));
  };

  // Build char → latin shortcut map from transliteration mappings
  const shortcutMap = useMemo(() => {
    const maps = script === 'syriac'
      ? [...SYRIAC_CONSONANT_MAP, ...SYRIAC_VOWEL_MAP]
      : [...HEBREW_CONSONANT_MAP, ...HEBREW_VOWEL_MAP];
    const m = new Map<string, string>();
    for (const { char, latin } of maps) m.set(char, latin);
    return m;
  }, [script]);

  // For Syriac keys: build char → Hebrew equivalent for the corner label
  const hebrewEquivMap = useMemo(() => {
    if (script !== 'syriac') return new Map<string, string>();
    const m = new Map<string, string>();
    // Consonants: via CAL transliteration
    for (const { char } of SYRIAC_CONSONANT_MAP) {
      const heb = calToHebrew(syriacToCAL(char));
      if (heb) m.set(char, heb);
    }
    // Vowels: invert HEBREW_NIKUD_TO_SYRIAC (first match wins)
    for (const [nikud, syriac] of HEBREW_NIKUD_TO_SYRIAC) {
      if (syriac && !m.has(syriac)) m.set(syriac, nikud);
    }
    return m;
  }, [script]);

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
            {row.map((key) => {
              const shortcut = shortcutMap.get(key.char);
              const hebrewEquiv = hebrewEquivMap.get(key.char);
              return (
                <button
                  key={key.char}
                  onClick={() => onKeyPress(key.char)}
                  title={shortcut ? `${key.name} — type "${shortcut}"` : key.name}
                  className={`relative w-9 h-9 text-lg ${fontClass} bg-white dark:bg-gray-700 rounded shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900 hover:shadow transition-all active:scale-95`}
                >
                  {key.char}
                  {hebrewEquiv && (
                    <span className="absolute top-0 left-0.5 text-[8px] font-hebrew text-gray-400 dark:text-gray-500 leading-none">
                      {hebrewEquiv}
                    </span>
                  )}
                  {shortcut && (
                    <span className="absolute bottom-0 right-0.5 text-[8px] text-gray-400 dark:text-gray-500 font-mono leading-none">
                      {shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Vowels/Diacritics */}
      <div className="space-y-1 border-t border-gray-200 dark:border-gray-700 pt-2">
        {layout.vowels.map((row, rowIdx) => (
          <div key={`vowels-${rowIdx}`} className="flex gap-1 justify-center flex-wrap">
            {row.map((key) => {
              const shortcut = shortcutMap.get(key.char);
              const hebrewEquiv = hebrewEquivMap.get(key.char);
              return (
                <button
                  key={key.char + key.name}
                  onClick={() => handleVowelPress(key.char)}
                  title={shortcut ? `${key.name} — type "${shortcut}"` : key.name}
                  className={`relative w-9 h-9 text-lg ${fontClass} bg-orange-50 dark:bg-orange-900/30 rounded shadow-sm hover:bg-orange-100 dark:hover:bg-orange-800/50 hover:shadow transition-all active:scale-95`}
                >
                  ◌{key.char}
                  {hebrewEquiv && (
                    <span className="absolute top-0 left-0.5 text-[8px] font-hebrew text-gray-400 dark:text-gray-500 leading-none">
                      א{hebrewEquiv}
                    </span>
                  )}
                  {shortcut && (
                    <span className="absolute bottom-0 right-0.5 text-[8px] text-gray-400 dark:text-gray-500 font-mono leading-none">
                      {shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
