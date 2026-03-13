import type { Flashcard, FlashcardSource } from '../types/flashcard';
import type { VerbTable } from '../types/verb';
import type { SedraParadigm } from './sedraParadigm';
import type { SyriacVowelStyle } from './syriacText';
import { formatSyriacText } from './syriacText';

export type CardDirection = 'form-to-parse' | 'parse-to-form';

export interface CardGenerationOptions {
  direction: CardDirection;
  vowelStyle: SyriacVowelStyle;
  includeStems?: Set<string>;
  includeTenses?: Set<string>;
  includePersons?: Set<string>; // '1', '2', '3'
  includeGenders?: Set<string>; // 'm', 'f', 'c'
  includeNumbers?: Set<string>; // 's', 'p'
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildParseText(
  root: string | undefined,
  stem: string,
  tense: string,
  png: string
): string {
  const parts = [];
  if (root) {
    parts.push(`Root: ${root}`);
  }
  parts.push(`Stem: ${stem}`);
  parts.push(`Tense: ${tense}`);
  parts.push(`PNG: ${png}`);
  return parts.join('\n');
}

function shouldInclude(
  value: string,
  filter?: Set<string>
): boolean {
  if (!filter || filter.size === 0) return true;
  return filter.has(value);
}

// Parse PNG string like "3ms" -> { person: '3', gender: 'm', number: 's' }
function parsePNG(png: string): { person?: string; gender?: string; number?: string } {
  const normalized = png.toLowerCase();
  const result: { person?: string; gender?: string; number?: string } = {};

  // Extract person (1, 2, 3)
  const personMatch = normalized.match(/^([123])/);
  if (personMatch) {
    result.person = personMatch[1];
  }

  // Extract gender (m, f, c)
  if (normalized.includes('m')) result.gender = 'm';
  else if (normalized.includes('f')) result.gender = 'f';
  else if (normalized.includes('c')) result.gender = 'c';

  // Extract number (s, p)
  if (normalized.includes('s')) result.number = 's';
  else if (normalized.includes('p')) result.number = 'p';

  return result;
}

function shouldIncludePNG(
  png: string,
  options: CardGenerationOptions
): boolean {
  const parsed = parsePNG(png);

  if (!shouldInclude(parsed.person || '', options.includePersons)) return false;
  if (!shouldInclude(parsed.gender || '', options.includeGenders)) return false;
  if (!shouldInclude(parsed.number || '', options.includeNumbers)) return false;

  return true;
}

export function generateCardsFromTable(
  table: VerbTable,
  options: CardGenerationOptions
): Flashcard[] {
  const cards: Flashcard[] = [];
  const root = table.paradigmRoot;

  for (const [stem, tenses] of Object.entries(table.stems)) {
    if (!shouldInclude(stem, options.includeStems)) continue;
    for (const [tense, persons] of Object.entries(tenses)) {
      if (!shouldInclude(tense, options.includeTenses)) continue;
      for (const [png, form] of Object.entries(persons)) {
        if (!form.form) continue;
        if (!shouldIncludePNG(png, options)) continue;

        const formattedForm = formatSyriacText(form.form, {
          showVowels: true,
          vowelStyle: options.vowelStyle,
        });
        const parseText = buildParseText(root, stem, tense, png);
        const source: FlashcardSource = {
          tableId: table.id,
          stem,
          tense,
          personNumberGender: png,
        };

        const front = options.direction === 'form-to-parse' ? formattedForm : parseText;
        const back = options.direction === 'form-to-parse' ? parseText : formattedForm;

        cards.push({
          id: createId('table'),
          languageId: table.languageId,
          front,
          back,
          source,
          tags: [
            `source:table`,
            `table:${table.class}`,
            `stem:${stem}`,
            `tense:${tense}`,
            `png:${png}`,
          ],
        });
      }
    }
  }

  return cards;
}

export function generateCardsFromSedraParadigm(
  paradigm: SedraParadigm,
  languageId: string,
  options: CardGenerationOptions
): Flashcard[] {
  const cards: Flashcard[] = [];

  for (const entry of paradigm.forms) {
    if (!shouldInclude(entry.stem, options.includeStems)) continue;
    if (!shouldInclude(entry.tense, options.includeTenses)) continue;
    if (!shouldIncludePNG(entry.png, options)) continue;

    const formattedForm = formatSyriacText(entry.form, {
      showVowels: true,
      vowelStyle: options.vowelStyle,
    });
    const parseText = buildParseText(paradigm.root, entry.stem, entry.tense, entry.png);
    const source: FlashcardSource = {
      tableId: `sedra-${paradigm.lexemeId}`,
      stem: entry.stem,
      tense: entry.tense,
      personNumberGender: entry.png,
    };

    const front = options.direction === 'form-to-parse' ? formattedForm : parseText;
    const back = options.direction === 'form-to-parse' ? parseText : formattedForm;

    cards.push({
      id: createId('sedra'),
      languageId,
      front,
      back,
      source,
      tags: [
        `source:sedra`,
        `lexeme:${paradigm.lexemeId}`,
        `stem:${entry.stem}`,
        `tense:${entry.tense}`,
        `png:${entry.png}`,
      ],
    });
  }

  return cards;
}
