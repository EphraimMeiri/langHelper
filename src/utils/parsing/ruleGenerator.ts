import type { VerbTable, VerbForm } from '../../types/verb';
import type { ParsingRule, HighlightRange, ParseConclusion, ParsingRuleSet } from '../../types/parsing';

interface PatternInfo {
  pattern: string;
  type: 'prefix' | 'suffix' | 'infix' | 'vowel-pattern';
  conclusion: ParseConclusion;
  examples: string[];
}

// Extract patterns from verb tables to generate parsing rules
export function generateRulesFromTables(
  tables: VerbTable[],
  languageId: string
): ParsingRuleSet {
  const patterns: Map<string, PatternInfo> = new Map();
  const rules: ParsingRule[] = [];

  // Analyze each table
  for (const table of tables) {
    analyzeTable(table, patterns);
  }

  // Convert patterns to rules
  let priority = 0;
  for (const [key, info] of patterns) {
    const rule = createRuleFromPattern(key, info, priority++);
    rules.push(rule);
  }

  // Sort rules: suffixes first (more specific), then prefixes
  rules.sort((a, b) => {
    // Suffix rules have higher priority (check first)
    const aIsSuffix = a.pattern.endsWith('$');
    const bIsSuffix = b.pattern.endsWith('$');
    if (aIsSuffix && !bIsSuffix) return -1;
    if (!aIsSuffix && bIsSuffix) return 1;
    return a.priority - b.priority;
  });

  // Build rule chains
  const entryPoints = linkRules(rules);

  return {
    languageId,
    version: '1.0.0',
    rules,
    entryPoints,
    updatedAt: new Date().toISOString(),
  };
}

function analyzeTable(table: VerbTable, patterns: Map<string, PatternInfo>): void {
  for (const [stem, tenses] of Object.entries(table.stems)) {
    for (const [tense, persons] of Object.entries(tenses)) {
      for (const [png, form] of Object.entries(persons)) {
        if (form.segments && form.segments.length > 0) {
          extractPatternsFromForm(form, stem, tense, png, patterns);
        }
      }
    }
  }
}

function extractPatternsFromForm(
  form: VerbForm,
  stem: string,
  tense: string,
  png: string,
  patterns: Map<string, PatternInfo>
): void {
  const { person, gender, number } = parsePNG(png);

  // Extract suffix patterns (segments at the end that aren't root)
  const suffixSegments = [];
  for (let i = form.segments.length - 1; i >= 0; i--) {
    const seg = form.segments[i];
    if (seg.type === 'root') break;
    if (seg.type === 'suffix' || seg.type === 'vowel') {
      suffixSegments.unshift(seg);
    }
  }

  if (suffixSegments.length > 0) {
    const suffixText = suffixSegments.map(s => s.text).join('');
    const key = `suffix:${suffixText}`;

    if (!patterns.has(key)) {
      patterns.set(key, {
        pattern: suffixText,
        type: 'suffix',
        conclusion: { person, gender, number, tense },
        examples: [form.form],
      });
    } else {
      patterns.get(key)!.examples.push(form.form);
    }
  }

  // Extract prefix patterns (segments at the start that aren't root)
  const prefixSegments = [];
  for (const seg of form.segments) {
    if (seg.type === 'root') break;
    if (seg.type === 'prefix' || seg.type === 'vowel') {
      prefixSegments.push(seg);
    }
  }

  if (prefixSegments.length > 0) {
    const prefixText = prefixSegments.map(s => s.text).join('');
    const key = `prefix:${prefixText}`;

    if (!patterns.has(key)) {
      patterns.set(key, {
        pattern: prefixText,
        type: 'prefix',
        conclusion: { stem, tense },
        examples: [form.form],
      });
    } else {
      patterns.get(key)!.examples.push(form.form);
    }
  }
}

function parsePNG(png: string): { person?: string; gender?: string; number?: string } {
  const result: { person?: string; gender?: string; number?: string } = {};

  // Parse person (1, 2, 3)
  const personMatch = png.match(/^(\d)/);
  if (personMatch) {
    result.person = personMatch[1] === '1' ? '1st' :
                    personMatch[1] === '2' ? '2nd' :
                    personMatch[1] === '3' ? '3rd' : undefined;
  }

  // Parse gender (m, f, c)
  if (png.includes('m')) result.gender = 'masculine';
  else if (png.includes('f')) result.gender = 'feminine';
  else if (png.includes('c')) result.gender = 'common';

  // Parse number (s, p)
  if (png.includes('s')) result.number = 'singular';
  else if (png.includes('p')) result.number = 'plural';

  return result;
}

function createRuleFromPattern(
  key: string,
  info: PatternInfo,
  priority: number
): ParsingRule {
  const [type, pattern] = key.split(':');
  const isRegex = true;

  let regexPattern: string;
  let highlightRanges: HighlightRange[];

  if (type === 'suffix') {
    // Match at end of string
    regexPattern = escapeRegex(pattern) + '$';
    highlightRanges = [{
      start: -pattern.length,
      end: 0,
      type: 'affix',
      label: 'suffix',
    }];
  } else if (type === 'prefix') {
    // Match at start of string
    regexPattern = '^' + escapeRegex(pattern);
    highlightRanges = [{
      start: 0,
      end: pattern.length,
      type: 'affix',
      label: 'prefix',
    }];
  } else {
    regexPattern = escapeRegex(pattern);
    highlightRanges = [];
  }

  const description = generateRuleDescription(info);

  return {
    id: `auto_${type}_${pattern.replace(/[^\w]/g, '_')}`,
    description,
    pattern: regexPattern,
    isRegex,
    highlightRanges,
    conclusion: info.conclusion,
    nextRules: [],
    priority,
    autoGenerated: true,
  };
}

function generateRuleDescription(info: PatternInfo): string {
  const parts: string[] = [];

  if (info.type === 'suffix') {
    parts.push(`Suffix "${info.pattern}" indicates`);
  } else if (info.type === 'prefix') {
    parts.push(`Prefix "${info.pattern}" indicates`);
  }

  const conclusionParts: string[] = [];
  if (info.conclusion.person) conclusionParts.push(info.conclusion.person + ' person');
  if (info.conclusion.gender) conclusionParts.push(info.conclusion.gender);
  if (info.conclusion.number) conclusionParts.push(info.conclusion.number);
  if (info.conclusion.tense) conclusionParts.push(info.conclusion.tense);
  if (info.conclusion.stem) conclusionParts.push(info.conclusion.stem + ' stem');

  parts.push(conclusionParts.join(' '));

  return parts.join(' ');
}

function linkRules(rules: ParsingRule[]): string[] {
  // Group rules by what they determine
  const suffixRules = rules.filter(r => r.pattern.endsWith('$'));
  const prefixRules = rules.filter(r => r.pattern.startsWith('^'));

  // Entry points are suffix rules (we check person/number/gender first)
  const entryPoints = suffixRules.map(r => r.id);

  // Link suffix rules to prefix rules for stem determination
  for (const suffixRule of suffixRules) {
    suffixRule.nextRules = prefixRules.map(r => r.id);
  }

  return entryPoints.length > 0 ? entryPoints : rules.slice(0, 5).map(r => r.id);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Find exact matches in verb tables
export function findExactMatches(
  input: string,
  tables: VerbTable[]
): Array<{
  table: VerbTable;
  stem: string;
  tense: string;
  png: string;
  form: VerbForm;
}> {
  const matches: Array<{
    table: VerbTable;
    stem: string;
    tense: string;
    png: string;
    form: VerbForm;
  }> = [];

  // Strip vowels for consonantal matching
  const inputConsonants = stripVowels(input);

  for (const table of tables) {
    for (const [stem, tenses] of Object.entries(table.stems)) {
      for (const [tense, persons] of Object.entries(tenses)) {
        for (const [png, form] of Object.entries(persons)) {
          // Exact match
          if (form.form === input) {
            matches.push({ table, stem, tense, png, form });
          }
          // Consonantal match
          else if (stripVowels(form.form) === inputConsonants && form.form !== input) {
            matches.push({ table, stem, tense, png, form });
          }
        }
      }
    }
  }

  return matches;
}

function stripVowels(text: string): string {
  // Remove Syriac vowel marks
  return text.replace(/[\u0730-\u074A]/g, '');
}
