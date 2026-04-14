// SEDRA IV API Service
// Syriac Electronic Data Research Archive
// https://sedra.bethmardutho.org/api

import { convertSyriacVowelStyle, stripSyriacVowels } from '../utils/syriacText';

export interface SedraObjectReference {
  id: number;
  link: string;
}

export interface SedraWord {
  word: SedraObjectReference;
  lexeme: SedraObjectReference;
  glosses?: Record<string, string | string[]>;
  syriac: string; // Consonantal form
  western?: string; // Western vocalized
  eastern?: string; // Eastern vocalized
  state?: string; // absolute, construct, emphatic
  tense?: string; // perfect, imperfect, imperative, infinitive, participle
  kaylo?: string; // Stem/binyan: peal, pael, aphel, etc.
  number?: string; // singular, plural
  person?: string; // first, second, third
  gender?: string; // masculine, feminine, common
  suffixType?: string;
  suffixNumber?: string;
  suffixPerson?: string;
  suffixGender?: string;
  stem?: string;
  category?: string;
  hasSeyame?: boolean;
  isLexicalForm?: boolean;
  isEnclitic?: boolean;
  isTheoretical?: boolean;
}

export interface SedraLexeme {
  lexeme: SedraObjectReference;
  syriac: string;
  glosses?: Record<string, string | string[]>;
  etymologies?: Record<string, string>;
  root?: SedraObjectReference;
  words?: SedraObjectReference[];
  categoryType?: string; // verb, noun, adjective, etc.
  kaylo?: string;
}

const SEDRA_BASE_URL = '/sedra-proxy/api';
const SEDRA_LEXEME_BASE_URL = '/sedra-proxy';

// Simple in-memory cache with TTL (30 minutes)
const CACHE_TTL = 30 * 60 * 1000;
const cache = new Map<string, { data: unknown; expires: number }>();

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

export interface SedraVerbLexemeListItem {
  term: number;
  value: string;
  label: string;
}

export async function lookupWord(wordOrId: string): Promise<SedraWord[]> {
  const cacheKey = `word:${wordOrId}`;
  const cached = getCached<SedraWord[]>(cacheKey);
  if (cached) return cached;

  try {
    // SEDRA uses western vocalization; convert eastern vowels before lookup
    const westernized = convertSyriacVowelStyle(wordOrId, 'western');
    const encoded = encodeURIComponent(westernized);
    const response = await fetch(`${SEDRA_BASE_URL}/word/${encoded}.json`);

    let result: SedraWord[] = [];
    if (response.ok) {
      const data = await response.json();
      result = Array.isArray(data) ? data : [data];
    } else if (response.status !== 404) {
      throw new Error(`SEDRA API error: ${response.status}`);
    }

    // If vocalized lookup returned no morphological info, retry with
    // consonantal form which often returns richer results from SEDRA
    const consonantal = stripSyriacVowels(wordOrId);
    const hasInflectionInfo = result.some(w => w.tense || w.kaylo);
    if (!hasInflectionInfo && consonantal !== westernized) {
      const consEncoded = encodeURIComponent(consonantal);
      const consResponse = await fetch(`${SEDRA_BASE_URL}/word/${consEncoded}.json`);
      if (consResponse.ok) {
        const consData = await consResponse.json();
        const consResult: SedraWord[] = Array.isArray(consData) ? consData : [consData];
        // Merge: prefer results with inflection info, deduplicate by word id
        const seenIds = new Set(result.map(w => w.word?.id));
        for (const w of consResult) {
          if (!seenIds.has(w.word?.id)) {
            result.push(w);
            seenIds.add(w.word?.id);
          }
        }
        // Sort: results with inflection info first
        result.sort((a, b) => {
          const aHas = (a.tense || a.kaylo) ? 1 : 0;
          const bHas = (b.tense || b.kaylo) ? 1 : 0;
          return bHas - aHas;
        });
      }
    }

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('SEDRA lookup error:', error);
    return [];
  }
}

export async function lookupLexeme(id: string | number): Promise<SedraLexeme | null> {
  const cacheKey = `lexeme:${id}`;
  const cached = getCached<SedraLexeme | null>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const response = await fetch(`${SEDRA_BASE_URL}/lexeme/${id}.json`);

    if (!response.ok) {
      if (response.status === 404) {
        setCache(cacheKey, null);
        return null;
      }
      throw new Error(`SEDRA API error: ${response.status}`);
    }

    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error('SEDRA lexeme lookup error:', error);
    return null;
  }
}

export async function listVerbLexemes(term: string): Promise<SedraVerbLexemeListItem[]> {
  const cacheKey = `verblist:${term}`;
  const cached = getCached<SedraVerbLexemeListItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const encoded = encodeURIComponent(term);
    const response = await fetch(`${SEDRA_LEXEME_BASE_URL}/lexeme/list/verbs?term=${encoded}`);

    if (!response.ok) {
      if (response.status === 404) {
        setCache(cacheKey, []);
        return [];
      }
      throw new Error(`SEDRA lexeme list error: ${response.status}`);
    }

    const data = await response.json();
    const result = Array.isArray(data) ? data : [];
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('SEDRA lexeme list error:', error);
    return [];
  }
}

export async function fetchLexemeParadigmHtml(id: string | number): Promise<string | null> {
  const cacheKey = `paradigm:${id}`;
  const cached = getCached<string | null>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const response = await fetch(`${SEDRA_LEXEME_BASE_URL}/lexeme/paradigm/get/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        setCache(cacheKey, null);
        return null;
      }
      throw new Error(`SEDRA paradigm error: ${response.status}`);
    }

    const data = await response.text();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error('SEDRA paradigm error:', error);
    return null;
  }
}

// Map SEDRA terminology to our app's terminology
export function mapSedraToConclusion(sedraWord: SedraWord): {
  person?: string;
  number?: string;
  gender?: string;
  tense?: string;
  stem?: string;
  state?: string;
} {
  const result: Record<string, string | undefined> = {};

  // Map person
  if (sedraWord.person) {
    const personMap: Record<string, string> = {
      'first': '1st',
      'second': '2nd',
      'third': '3rd',
    };
    result.person = personMap[sedraWord.person.toLowerCase()] || sedraWord.person;
  }

  // Map number
  if (sedraWord.number) {
    result.number = sedraWord.number.toLowerCase();
  }

  // Map gender
  if (sedraWord.gender) {
    const genderMap: Record<string, string> = {
      'masculine': 'masculine',
      'feminine': 'feminine',
      'common': 'common',
    };
    result.gender = genderMap[sedraWord.gender.toLowerCase()] || sedraWord.gender;
  }

  // Map tense
  if (sedraWord.tense) {
    const tenseMap: Record<string, string> = {
      'perfect': 'past',
      'imperfect': 'future',
      'imperative': 'imperative',
      'infinitive': 'infinitive',
      'participle': 'participle',
      'active participle': 'active-participle',
      'passive participle': 'passive-participle',
    };
    result.tense = tenseMap[sedraWord.tense.toLowerCase()] || sedraWord.tense;
  }

  // Map kaylo (stem/binyan)
  if (sedraWord.kaylo) {
    const stemMap: Record<string, string> = {
      'peal': 'peal',
      'pael': 'pael',
      'aphel': 'aphel',
      'ethpeel': 'ethpeel',
      'ethpaal': 'ethpaal',
      'ettaphal': 'ettaphal',
      'shafel': 'shafel',
      'eshtaphal': 'eshtaphal',
    };
    result.stem = stemMap[sedraWord.kaylo.toLowerCase()] || sedraWord.kaylo;
  }

  // Map state
  if (sedraWord.state) {
    result.state = sedraWord.state.toLowerCase();
  }

  return result;
}

// Format a person-number-gender key (e.g., "3ms" for 3rd masculine singular)
export function formatPNG(word: SedraWord): string {
  const parts: string[] = [];

  if (word.person) {
    const personNum = word.person.toLowerCase() === 'first' ? '1' :
                      word.person.toLowerCase() === 'second' ? '2' :
                      word.person.toLowerCase() === 'third' ? '3' : '';
    parts.push(personNum);
  }

  if (word.gender) {
    const genderChar = word.gender.toLowerCase() === 'masculine' ? 'm' :
                       word.gender.toLowerCase() === 'feminine' ? 'f' :
                       word.gender.toLowerCase() === 'common' ? 'c' : '';
    parts.push(genderChar);
  }

  if (word.number) {
    const numberChar = word.number.toLowerCase() === 'singular' ? 's' :
                       word.number.toLowerCase() === 'plural' ? 'p' : '';
    parts.push(numberChar);
  }

  return parts.join('');
}

// Get English gloss from SEDRA word
export function getGloss(word: SedraWord): string | undefined {
  if (!word.glosses) return undefined;
  const raw = word.glosses['eng'] || word.glosses['en'] || word.glosses['english'] || Object.values(word.glosses)[0];
  if (!raw) return undefined;
  // SEDRA returns glosses as string[] (e.g. ["glorify","praise","commend"])
  if (Array.isArray(raw)) return raw.join(', ');
  return raw;
}

// Strip vowels from Syriac text (for consonantal matching)
export { stripSyriacVowels, convertSyriacVowelStyle } from '../utils/syriacText';
