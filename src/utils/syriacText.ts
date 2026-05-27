export type SyriacVowelStyle = 'western' | 'eastern';

const WESTERN_TO_EASTERN: Record<string, string> = {
  '\u0730': '\u0732', // PTHAHA ABOVE -> PTHAHA DOTTED
  '\u0731': '\u0732', // PTHAHA BELOW -> PTHAHA DOTTED
  '\u0733': '\u0735', // ZQAPHA ABOVE -> ZQAPHA DOTTED
  '\u0734': '\u0735', // ZQAPHA BELOW -> ZQAPHA DOTTED
  '\u0736': '\u0738', // RBASA ABOVE -> DOTTED ZLAMA HORIZONTAL
  '\u0737': '\u0738', // RBASA BELOW -> DOTTED ZLAMA HORIZONTAL
  '\u073a': '\u0739', // HBASA ABOVE -> DOTTED ZLAMA ANGULAR
  '\u073b': '\u0739', // HBASA BELOW -> DOTTED ZLAMA ANGULAR
  '\u073d': '\u073c', // ESASA ABOVE -> HBASA-ESASA DOTTED
  '\u073e': '\u073c', // ESASA BELOW -> HBASA-ESASA DOTTED
};

const EASTERN_TO_WESTERN: Record<string, string> = {
  '\u0732': '\u0730', // PTHAHA DOTTED -> PTHAHA ABOVE
  '\u0735': '\u0733', // ZQAPHA DOTTED -> ZQAPHA ABOVE
  '\u0738': '\u0736', // DOTTED ZLAMA HORIZONTAL -> RBASA ABOVE
  '\u0739': '\u073a', // DOTTED ZLAMA ANGULAR -> HBASA ABOVE
  '\u073c': '\u073d', // HBASA-ESASA DOTTED -> ESASA ABOVE
};

export function stripSyriacVowels(text: string): string {
  return text.replace(/[\u0730-\u074A]/g, '');
}

/**
 * Text copied out of some PDFs inserts spaces between base letters and their
 * combining vowel/diacritic marks. Remove any whitespace (including NBSP, the
 * Unicode space separators, and zero-width/BOM) that immediately precedes a
 * Syriac combining mark (U+0730\u2013U+074A) so it reattaches to the prior letter.
 */
export function joinSeparatedSyriacDiacritics(text: string): string {
  return text.replace(/[ \t\u00A0\u2000-\u200B\uFEFF]+([\u0730-\u074A])/g, '$1');
}

/**
 * Remove whitespace sitting between two Syriac characters (block U+0700\u2013U+074F).
 * The lookahead keeps the trailing letter unconsumed so runs of single-letter
 * gaps ("\u0710 \u0712 \u0713") all collapse.
 */
export function closeSyriacLetterGaps(text: string): string {
  return text.replace(
    /([\u0700-\u074F])[ \t\u00A0\u2000-\u200B\uFEFF]+(?=[\u0700-\u074F])/g,
    '$1'
  );
}

/**
 * Repair Syriac text pasted from a PDF. First reattach combining marks to their
 * letters; only if that changed something (i.e. the copy was broken) do we also
 * close gaps between letters, since a clean paste's spaces are real boundaries.
 */
export function repairPastedSyriac(text: string): string {
  const joined = joinSeparatedSyriacDiacritics(text);
  if (joined === text) return text;
  return closeSyriacLetterGaps(joined);
}

export function convertSyriacVowelStyle(
  text: string,
  targetStyle: SyriacVowelStyle
): string {
  const map = targetStyle === 'eastern' ? WESTERN_TO_EASTERN : EASTERN_TO_WESTERN;
  let result = '';

  for (const ch of text) {
    result += map[ch] || ch;
  }

  return result;
}

export function formatSyriacText(
  text: string,
  options: {
    showVowels?: boolean;
    vowelStyle?: SyriacVowelStyle;
  } = {}
): string {
  const { showVowels = true, vowelStyle } = options;
  let result = text;

  if (!showVowels) {
    result = stripSyriacVowels(result);
  }

  if (vowelStyle) {
    result = convertSyriacVowelStyle(result, vowelStyle);
  }

  return result;
}
