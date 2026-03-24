// English to Syriac/Hebrew transliteration mappings

import type { ScriptType } from '../types/language';

export interface TranslitMapping {
  latin: string;
  char: string;
  name: string;
  hebrewShortcut?: string; // optional Hebrew character shortcut override
}

// Syriac consonants - using common academic transliteration
export const SYRIAC_CONSONANT_MAP: TranslitMapping[] = [
  { latin: "'", char: 'ܐ', name: 'Alap' },
  { latin: 'b', char: 'ܒ', name: 'Beth' },
  { latin: 'g', char: 'ܓ', name: 'Gamal' },
  { latin: 'd', char: 'ܕ', name: 'Dalath' },
  { latin: 'h', char: 'ܗ', name: 'He' },
  { latin: 'w', char: 'ܘ', name: 'Waw' },
  { latin: 'z', char: 'ܙ', name: 'Zain' },
  { latin: 'x', char: 'ܚ', name: 'Heth' },
  { latin: 'T', char: 'ܛ', name: 'Teth' },
  { latin: 'y', char: 'ܝ', name: 'Yodh' },
  { latin: 'k', char: 'ܟ', name: 'Kaph' },
  { latin: 'l', char: 'ܠ', name: 'Lamadh' },
  { latin: 'm', char: 'ܡ', name: 'Mim' },
  { latin: 'n', char: 'ܢ', name: 'Nun' },
  { latin: 's', char: 'ܣ', name: 'Semkath' },
  { latin: 'E', char: 'ܥ', name: 'Ayin' },
  { latin: 'p', char: 'ܦ', name: 'Pe' },
  { latin: 'S', char: 'ܨ', name: 'Tsade' },
  { latin: 'q', char: 'ܩ', name: 'Qoph' },
  { latin: 'r', char: 'ܪ', name: 'Resh' },
  { latin: 'sh', char: 'ܫ', name: 'Shin' },
  { latin: 't', char: 'ܬ', name: 'Taw' },
];

// Syriac vowels (Western/Serto style)
export const SYRIAC_VOWEL_MAP: TranslitMapping[] = [
  { latin: 'a', char: 'ܰ', name: 'Pthaha (a)' },
  { latin: 'o', char: 'ܳ', name: 'Zqapha (o)' },
  { latin: 'e', char: 'ܶ', name: 'Rbasa (e)' },
  { latin: 'i', char: 'ܺ', name: 'Hbasa (i)' },
  { latin: 'u', char: 'ܽ', name: 'Esasa (u)' },
  { latin: 'A', char: 'ܲ', name: 'Pthaha above' },
  { latin: 'O', char: 'ܴ', name: 'Zqapha above' },
  { latin: 'I', char: 'ܼ', name: 'Hbasa above' },
];

// Hebrew consonants
export const HEBREW_CONSONANT_MAP: TranslitMapping[] = [
  { latin: "'", char: 'א', name: 'Aleph' },
  { latin: 'b', char: 'ב', name: 'Bet' },
  { latin: 'g', char: 'ג', name: 'Gimel' },
  { latin: 'd', char: 'ד', name: 'Dalet' },
  { latin: 'h', char: 'ה', name: 'He' },
  { latin: 'w', char: 'ו', name: 'Vav' },
  { latin: 'z', char: 'ז', name: 'Zayin' },
  { latin: 'x', char: 'ח', name: 'Het' },
  { latin: 'T', char: 'ט', name: 'Tet' },
  { latin: 'y', char: 'י', name: 'Yod' },
  { latin: 'k', char: 'כ', name: 'Kaf' },
  { latin: 'K', char: 'ך', name: 'Kaf final' },
  { latin: 'l', char: 'ל', name: 'Lamed' },
  { latin: 'm', char: 'מ', name: 'Mem' },
  { latin: 'M', char: 'ם', name: 'Mem final' },
  { latin: 'n', char: 'נ', name: 'Nun' },
  { latin: 'N', char: 'ן', name: 'Nun final' },
  { latin: 's', char: 'ס', name: 'Samekh' },
  { latin: 'E', char: 'ע', name: 'Ayin' },
  { latin: 'p', char: 'פ', name: 'Pe' },
  { latin: 'P', char: 'ף', name: 'Pe final' },
  { latin: 'S', char: 'צ', name: 'Tsadi' },
  { latin: 'Z', char: 'ץ', name: 'Tsadi final' },
  { latin: 'q', char: 'ק', name: 'Qof' },
  { latin: 'r', char: 'ר', name: 'Resh' },
  { latin: 'sh', char: 'ש', name: 'Shin' },
  { latin: 't', char: 'ת', name: 'Tav' },
];

// Hebrew vowels (Tiberian)
// Note: 'E' is reserved for Ayin (consonant), so Tsere uses 'ee'
export const HEBREW_VOWEL_MAP: TranslitMapping[] = [
  { latin: 'a', char: 'ַ', name: 'Patah (a)' },
  { latin: 'A', char: 'ָ', name: 'Qamats (a/o)' },
  { latin: 'e', char: 'ֶ', name: 'Segol (e)' },
  { latin: 'ee', char: 'ֵ', name: 'Tsere (ee)' },
  { latin: 'i', char: 'ִ', name: 'Hiriq (i)' },
  { latin: 'o', char: 'ֹ', name: 'Holam (o)' },
  { latin: 'u', char: 'ֻ', name: 'Qubuts (u)' },
  { latin: 'U', char: 'וּ', name: 'Shureq (U)' },
  { latin: ':', char: 'ְ', name: 'Shva (:)' },
];

// Build lookup map for fast transliteration
export function buildLookupMap(consonants: TranslitMapping[], vowels: TranslitMapping[]): Map<string, string> {
  const map = new Map<string, string>();

  // Add multi-char mappings first (like 'sh')
  const allMappings = [...consonants, ...vowels].sort((a, b) => b.latin.length - a.latin.length);

  for (const mapping of allMappings) {
    map.set(mapping.latin, mapping.char);
  }

  return map;
}

// Default lookup maps (used when store is not available)
const defaultSyriacLookup = buildLookupMap(SYRIAC_CONSONANT_MAP, SYRIAC_VOWEL_MAP);
const defaultHebrewLookup = buildLookupMap(HEBREW_CONSONANT_MAP, HEBREW_VOWEL_MAP);

// Transliterate English text to Syriac/Hebrew using provided mappings
export function transliterateWithMappings(
  text: string,
  consonants: TranslitMapping[],
  vowels: TranslitMapping[]
): string {
  const lookup = buildLookupMap(consonants, vowels);
  return transliterateWithLookup(text, lookup);
}

// Transliterate using a pre-built lookup map
function transliterateWithLookup(text: string, lookup: Map<string, string>): string {
  let result = '';
  let i = 0;

  while (i < text.length) {
    // Try longer sequences first (up to 3 chars for potential future mappings)
    let matched = false;
    for (let len = 3; len >= 1; len--) {
      if (i + len <= text.length) {
        const substr = text.slice(i, i + len);
        if (lookup.has(substr)) {
          result += lookup.get(substr);
          i += len;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      // Keep unmapped characters as-is (spaces, numbers, etc.)
      result += text[i];
      i++;
    }
  }

  return result;
}

// Simple transliterate function using defaults (for backward compatibility)
export function transliterate(text: string, script: ScriptType): string {
  const lookup = script === 'syriac' ? defaultSyriacLookup : defaultHebrewLookup;
  return transliterateWithLookup(text, lookup);
}

// Check if a character is a Latin letter that could be transliterated
export function isTransliteratable(char: string, script: ScriptType): boolean {
  const lookup = script === 'syriac' ? defaultSyriacLookup : defaultHebrewLookup;
  return lookup.has(char) || lookup.has(char.toLowerCase());
}

// Get mapping tables for display
export function getMappingTables(script: ScriptType): {
  consonants: TranslitMapping[];
  vowels: TranslitMapping[];
} {
  if (script === 'syriac') {
    return {
      consonants: SYRIAC_CONSONANT_MAP,
      vowels: SYRIAC_VOWEL_MAP,
    };
  }
  return {
    consonants: HEBREW_CONSONANT_MAP,
    vowels: HEBREW_VOWEL_MAP,
  };
}
