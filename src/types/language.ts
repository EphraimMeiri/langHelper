export type TextDirection = 'rtl' | 'ltr';

export type ScriptType = 'syriac' | 'hebrew' | 'arabic' | 'latin';

export interface GrammaticalCategories {
  person: string[];
  number: string[];
  gender: string[];
  tense: string[];
  stems: string[];
}

export interface LanguageConfig {
  id: string;
  name: string;
  nativeName: string;
  direction: TextDirection;
  script: ScriptType;
  alphabet: string[];
  grammaticalCategories: GrammaticalCategories;
  verbClasses: string[];
}

export interface LanguageState {
  currentLanguage: LanguageConfig | null;
  availableLanguages: LanguageConfig[];
  isLoading: boolean;
  error: string | null;
}

export function getPersonNumberGenderKey(
  person: string,
  number: string,
  gender: string
): string {
  const personNum = person.replace(/\D/g, '');
  const numAbbr = number === 'singular' ? 's' : 'p';
  const genderAbbr = gender === 'masculine' ? 'm' : 'f';
  return `${personNum}${genderAbbr}${numAbbr}`;
}

export function parsePersonNumberGenderKey(key: string): {
  person: string;
  number: string;
  gender: string;
} {
  const match = key.match(/^(\d)(m|f)(s|p)$/);
  if (!match) {
    throw new Error(`Invalid person-number-gender key: ${key}`);
  }
  return {
    person: `${match[1]}${match[1] === '1' ? 'st' : match[1] === '2' ? 'nd' : 'rd'}`,
    number: match[3] === 's' ? 'singular' : 'plural',
    gender: match[2] === 'm' ? 'masculine' : 'feminine',
  };
}
