// CAL ASCII → Syriac / Hebrew script transliteration
// CAL (Comprehensive Aramaic Lexicon) uses a specific ASCII encoding for Aramaic.

// CAL ASCII → Syriac Estrangela script
const CAL_TO_SYRIAC: [string, string][] = [
  ['$', 'ܫ'],  // Shin
  ['&', 'ܫ'],  // Sin (same letter in Syriac)
  [')', 'ܐ'],  // Alap
  ['(', 'ܥ'],  // Ayin (E)
  ['b', 'ܒ'],
  ['g', 'ܓ'],
  ['d', 'ܕ'],
  ['h', 'ܗ'],
  ['w', 'ܘ'],
  ['z', 'ܙ'],
  ['x', 'ܚ'],  // Heth
  ['T', 'ܛ'],  // Teth (uppercase T)
  ['+', 'ܛ'],  // Teth (alternate CAL encoding)
  ['y', 'ܝ'],
  ['k', 'ܟ'],
  ['l', 'ܠ'],
  ['m', 'ܡ'],
  ['n', 'ܢ'],
  ['s', 'ܣ'],  // Semkath
  ['p', 'ܦ'],
  ['c', 'ܨ'],  // Tsade
  ['q', 'ܩ'],
  ['r', 'ܪ'],
  ['S', 'ܫ'],  // Shin (unpointed)
  ['t', 'ܬ'],
];

// CAL ASCII → Hebrew script (consonants only, for search matching)
const CAL_TO_HEBREW: [string, string][] = [
  ['$', 'שׁ'],  // Shin with dot
  ['&', 'שׂ'],  // Sin with dot
  [')', 'א'],  // Aleph
  ['(', 'ע'],  // Ayin
  ['b', 'ב'],
  ['g', 'ג'],
  ['d', 'ד'],
  ['h', 'ה'],
  ['w', 'ו'],
  ['z', 'ז'],
  ['x', 'ח'],  // Heth
  ['T', 'ט'],  // Teth (uppercase T)
  ['+', 'ט'],  // Teth (alternate CAL encoding)
  ['y', 'י'],
  ['k', 'כ'],
  ['K', 'ך'],  // Final Kaph
  ['l', 'ל'],
  ['m', 'מ'],
  ['M', 'ם'],  // Final Mem
  ['n', 'נ'],
  ['N', 'ן'],  // Final Nun
  ['s', 'ס'],  // Samekh
  ['P', 'פּ'],  // Emphatic Pe
  ['p', 'פ'],
  ['c', 'צ'],  // Tsade
  ['C', 'ץ'],  // Final Tsade
  ['q', 'ק'],
  ['r', 'ר'],
  ['S', 'ש'],  // Shin (unpointed)
  ['t', 'ת'],
];

// Syriac → CAL ASCII (reverse mapping for search normalization)
const SYRIAC_TO_CAL: [string, string][] = [
  ['ܐ', ')'],
  ['ܒ', 'b'],
  ['ܓ', 'g'],
  ['ܕ', 'd'],
  ['ܗ', 'h'],
  ['ܘ', 'w'],
  ['ܙ', 'z'],
  ['ܚ', 'x'],
  ['ܛ', 'T'],
  ['ܝ', 'y'],
  ['ܟ', 'k'],
  ['ܠ', 'l'],
  ['ܡ', 'm'],
  ['ܢ', 'n'],
  ['ܣ', 's'],
  ['ܥ', '('],
  ['ܦ', 'p'],
  ['ܨ', 'c'],
  ['ܩ', 'q'],
  ['ܪ', 'r'],
  ['ܫ', '$'],
  ['ܬ', 't'],
];

// Hebrew → CAL ASCII (reverse mapping for search normalization)
const HEBREW_TO_CAL: [string, string][] = [
  ['א', ')'],
  ['ב', 'b'],
  ['ג', 'g'],
  ['ד', 'd'],
  ['ה', 'h'],
  ['ו', 'w'],
  ['ז', 'z'],
  ['ח', 'x'],
  ['ט', 'T'],
  ['י', 'y'],
  ['כ', 'k'], ['ך', 'k'],
  ['ל', 'l'],
  ['מ', 'm'], ['ם', 'm'],
  ['נ', 'n'], ['ן', 'n'],
  ['ס', 's'],
  ['ע', '('],
  ['פ', 'p'], ['ף', 'p'],
  ['צ', 'c'], ['ץ', 'c'],
  ['ק', 'q'],
  ['ר', 'r'],
  ['ש', '$'], ['שׁ', '$'], ['שׂ', '&'],
  ['ת', 't'],
];

function buildMap(pairs: [string, string][]): Map<string, string> {
  const map = new Map<string, string>();
  // Sort by key length descending so multi-char sequences match first
  const sorted = [...pairs].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of sorted) {
    map.set(from, to);
  }
  return map;
}

const calToSyriacMap = buildMap(CAL_TO_SYRIAC);
const calToHebrewMap = buildMap(CAL_TO_HEBREW);
const syriacToCalMap = buildMap(SYRIAC_TO_CAL);
const hebrewToCalMap = buildMap(HEBREW_TO_CAL);

function transliterate(text: string, map: Map<string, string>): string {
  let result = '';
  let i = 0;
  const maxKeyLen = Math.max(...[...map.keys()].map(k => k.length));

  while (i < text.length) {
    let matched = false;
    for (let len = maxKeyLen; len >= 1; len--) {
      if (i + len <= text.length) {
        const substr = text.slice(i, i + len);
        const mapped = map.get(substr);
        if (mapped !== undefined) {
          result += mapped;
          i += len;
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      // Skip non-mapped characters (vowels, diacritics, spaces, etc.)
      i++;
    }
  }

  return result;
}

/** Convert CAL ASCII lemma to Syriac script (consonants only) */
export function calToSyriac(cal: string): string {
  // Strip POS suffix (e.g., " N", " V", " A") and homograph markers (e.g., "#2")
  const word = cal.replace(/#\d+/, '').replace(/\s+[A-Z].*$/, '').replace(/@/g, ' ');
  return transliterate(word, calToSyriacMap);
}

/** Convert CAL ASCII lemma to Hebrew script (consonants only) */
export function calToHebrew(cal: string): string {
  const word = cal.replace(/#\d+/, '').replace(/\s+[A-Z].*$/, '').replace(/@/g, ' ');
  return transliterate(word, calToHebrewMap);
}

/** Convert Syriac script to CAL ASCII (for search normalization) */
export function syriacToCAL(syriac: string): string {
  return transliterate(syriac, syriacToCalMap);
}

/** Convert Hebrew script to CAL ASCII (for search normalization) */
export function hebrewToCAL(hebrew: string): string {
  return transliterate(hebrew, hebrewToCalMap);
}

/** Detect if a string is primarily Syriac script */
export function isSyriacScript(text: string): boolean {
  return /[\u0710-\u074F]/.test(text);
}

/** Detect if a string is primarily Hebrew script */
export function isHebrewScript(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

/** Normalize a search term to CAL ASCII for index matching */
export function normalizeSearchTerm(term: string): string {
  const trimmed = term.trim();
  if (isSyriacScript(trimmed)) {
    return syriacToCAL(trimmed);
  }
  if (isHebrewScript(trimmed)) {
    return hebrewToCAL(trimmed);
  }
  // Already CAL ASCII or English
  return trimmed.toLowerCase();
}
