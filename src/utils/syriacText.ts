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
