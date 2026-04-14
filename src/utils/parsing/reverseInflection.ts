/**
 * Reverse Inflection: strips Syriac verb affixes to find candidate roots,
 * then confirms against SEDRA API.
 *
 * Flow: inflected form → strip suffix/prefix → candidate roots → SEDRA lookup
 *       → paradigm confirmation → step-by-step breakdown
 */

import type { ParseStep, ParseConclusion, HighlightRange } from '../../types/parsing';
import { stripSyriacVowels, convertSyriacVowelStyle } from '../syriacText';
import {
  lookupWord,
  lookupLexeme,
  fetchLexemeParadigmHtml,
  getGloss,
  type SedraWord,
  type SedraLexeme,
} from '../../services/sedraApi';
import { parseSedraParadigmHtml, type SedraParadigm, type SedraParadigmForm } from '../sedraParadigm';

// ---------------------------------------------------------------------------
// Affix definitions
// ---------------------------------------------------------------------------

interface AffixRule {
  id: string;
  affix: string; // consonantal affix to match
  conclusions: ParseConclusion[]; // possible interpretations (ambiguous affixes have multiple)
  description: string;
}

// Perfect suffixes (longest first)
const PERFECT_SUFFIXES: AffixRule[] = [
  { id: 'perf_2mp', affix: 'ܬܘܢ', conclusions: [{ person: '2nd', gender: 'masculine', number: 'plural', tense: 'past' }], description: '2nd masc. pl. perfect suffix ـܬܘܢ' },
  { id: 'perf_2fp', affix: 'ܬܝܢ', conclusions: [{ person: '2nd', gender: 'feminine', number: 'plural', tense: 'past' }], description: '2nd fem. pl. perfect suffix ـܬܝܢ' },
  { id: 'perf_2fs', affix: 'ܬܝ', conclusions: [{ person: '2nd', gender: 'feminine', number: 'singular', tense: 'past' }], description: '2nd fem. sg. perfect suffix ـܬܝ' },
  { id: 'perf_3mp', affix: 'ܘ', conclusions: [{ person: '3rd', gender: 'masculine', number: 'plural', tense: 'past' }], description: '3rd masc. pl. perfect suffix ـܘ' },
  { id: 'perf_t', affix: 'ܬ', conclusions: [
    { person: '3rd', gender: 'feminine', number: 'singular', tense: 'past' },
    { person: '2nd', gender: 'masculine', number: 'singular', tense: 'past' },
    { person: '1st', gender: 'common', number: 'singular', tense: 'past' },
  ], description: 'Perfect suffix ـܬ (3fs / 2ms / 1s)' },
  { id: 'perf_3fp', affix: 'ܝ', conclusions: [{ person: '3rd', gender: 'feminine', number: 'plural', tense: 'past' }], description: '3rd fem. pl. perfect suffix ـܝ' },
  { id: 'perf_1p', affix: 'ܢ', conclusions: [{ person: '1st', gender: 'common', number: 'plural', tense: 'past' }], description: '1st common pl. perfect suffix ـܢ' },
];

// Imperfect prefixes (single consonant)
const IMPERFECT_PREFIXES: AffixRule[] = [
  { id: 'impf_n', affix: 'ܢ', conclusions: [
    { person: '3rd', gender: 'masculine', number: 'singular', tense: 'future' },
    { person: '3rd', gender: 'masculine', number: 'plural', tense: 'future' },
    { person: '1st', gender: 'common', number: 'plural', tense: 'future' },
  ], description: 'Imperfect prefix ܢـ (3ms / 3mp / 1cp)' },
  { id: 'impf_t', affix: 'ܬ', conclusions: [
    { person: '3rd', gender: 'feminine', number: 'singular', tense: 'future' },
    { person: '2nd', gender: 'masculine', number: 'singular', tense: 'future' },
    { person: '2nd', gender: 'masculine', number: 'plural', tense: 'future' },
    { person: '3rd', gender: 'feminine', number: 'plural', tense: 'future' },
    { person: '2nd', gender: 'feminine', number: 'plural', tense: 'future' },
  ], description: 'Imperfect prefix ܬـ (3fs / 2ms / 2mp / 3fp / 2fp)' },
  { id: 'impf_a', affix: 'ܐ', conclusions: [
    { person: '1st', gender: 'common', number: 'singular', tense: 'future' },
  ], description: 'Imperfect prefix ܐـ (1s)' },
];

// Imperfect suffixes (longest first)
const IMPERFECT_SUFFIXES: AffixRule[] = [
  { id: 'impf_suf_wn', affix: 'ܘܢ', conclusions: [{ number: 'plural', gender: 'masculine' }], description: 'Imperfect plural suffix ـܘܢ' },
  { id: 'impf_suf_yn', affix: 'ܝܢ', conclusions: [{ number: 'singular', gender: 'feminine' }], description: 'Imperfect suffix ـܝܢ (2fs)' },
  { id: 'impf_suf_n', affix: 'ܢ', conclusions: [{ number: 'singular', gender: 'feminine' }], description: 'Imperfect/feminine suffix ـܢ' },
];

// Stem prefixes (longest first)
const STEM_PREFIXES: AffixRule[] = [
  { id: 'stem_esht', affix: 'ܐܫܬ', conclusions: [{ stem: 'eshtaphal' }], description: 'Eshtaphal prefix ܐܫܬـ' },
  { id: 'stem_et', affix: 'ܐܬ', conclusions: [
    { stem: 'ethpeel' },
    { stem: 'ethpaal' },
    { stem: 'ettaphal' },
  ], description: 'Ethpe/Ethpa/Ettaphal prefix ܐܬـ' },
  { id: 'stem_sh', affix: 'ܫ', conclusions: [{ stem: 'shaphel' }], description: 'Shaphel prefix ܫـ' },
  { id: 'stem_a', affix: 'ܐ', conclusions: [{ stem: 'aphel' }], description: 'Aphel prefix ܐـ' },
];

// ---------------------------------------------------------------------------
// Candidate generation
// ---------------------------------------------------------------------------

export interface CandidateRoot {
  consonants: string;
  strippedSuffix: AffixRule | null;
  strippedPrefix: AffixRule | null;
  strippedStemPrefix: AffixRule | null;
  impliedConclusions: ParseConclusion[];
  confidence: number;
  tenseCategory: 'perfect' | 'imperfect' | 'unknown';
}

export function generateCandidateRoots(input: string): CandidateRoot[] {
  const cons = stripSyriacVowels(input);
  const candidates: CandidateRoot[] = [];
  const seen = new Set<string>();

  function addCandidate(c: CandidateRoot) {
    // Deduplicate by consonant string + tense category
    const key = `${c.consonants}:${c.tenseCategory}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(c);
  }

  // Score based on root length (triliteral is most common)
  function score(rootLen: number): number {
    if (rootLen === 3) return 1.0;
    if (rootLen === 4) return 0.7;
    if (rootLen === 2) return 0.5;
    return 0.3;
  }

  // --- Perfect: suffix only, no prefix ---
  // No suffix (3ms)
  if (cons.length >= 2) {
    addCandidate({
      consonants: cons,
      strippedSuffix: null,
      strippedPrefix: null,
      strippedStemPrefix: null,
      impliedConclusions: [{ person: '3rd', gender: 'masculine', number: 'singular', tense: 'past' }],
      confidence: score(cons.length),
      tenseCategory: 'perfect',
    });
  }

  for (const suf of PERFECT_SUFFIXES) {
    if (cons.endsWith(suf.affix)) {
      const stem = cons.slice(0, cons.length - suf.affix.length);
      if (stem.length >= 2) {
        addCandidate({
          consonants: stem,
          strippedSuffix: suf,
          strippedPrefix: null,
          strippedStemPrefix: null,
          impliedConclusions: suf.conclusions.map(c => ({ ...c })),
          confidence: score(stem.length),
          tenseCategory: 'perfect',
        });
      }
    }
  }

  // --- Imperfect: prefix + optional suffix ---
  for (const pfx of IMPERFECT_PREFIXES) {
    if (!cons.startsWith(pfx.affix)) continue;
    const afterPrefix = cons.slice(pfx.affix.length);

    // No imperfect suffix
    if (afterPrefix.length >= 2) {
      addCandidate({
        consonants: afterPrefix,
        strippedSuffix: null,
        strippedPrefix: pfx,
        strippedStemPrefix: null,
        impliedConclusions: pfx.conclusions.map(c => ({ ...c })),
        confidence: score(afterPrefix.length),
        tenseCategory: 'imperfect',
      });
    }

    // With imperfect suffix
    for (const suf of IMPERFECT_SUFFIXES) {
      if (afterPrefix.endsWith(suf.affix)) {
        const stem = afterPrefix.slice(0, afterPrefix.length - suf.affix.length);
        if (stem.length >= 2) {
          addCandidate({
            consonants: stem,
            strippedSuffix: suf,
            strippedPrefix: pfx,
            strippedStemPrefix: null,
            impliedConclusions: pfx.conclusions.map(c => ({ ...c, ...suf.conclusions[0] })),
            confidence: score(stem.length),
            tenseCategory: 'imperfect',
          });
        }
      }
    }
  }

  // --- Now try stripping stem prefixes from all candidates so far ---
  const baseCandidates = [...candidates];
  for (const base of baseCandidates) {
    for (const stemPfx of STEM_PREFIXES) {
      if (base.consonants.startsWith(stemPfx.affix)) {
        const afterStem = base.consonants.slice(stemPfx.affix.length);
        if (afterStem.length >= 2) {
          addCandidate({
            consonants: afterStem,
            strippedSuffix: base.strippedSuffix,
            strippedPrefix: base.strippedPrefix,
            strippedStemPrefix: stemPfx,
            impliedConclusions: base.impliedConclusions.map(c => ({ ...c, ...stemPfx.conclusions[0] })),
            confidence: score(afterStem.length) * 0.95,
            tenseCategory: base.tenseCategory,
          });
        }
      }
    }
  }

  // --- Weak root augmentation: if 2 consonants, try inserting weak radicals ---
  const shortCandidates = candidates.filter(c => c.consonants.length === 2);
  for (const base of shortCandidates) {
    const [r1, r2] = [...base.consonants];

    // Pe-weak: prepend ܢ, ܝ, ܐ, ܘ
    for (const weak of ['ܢ', 'ܝ', 'ܐ', 'ܘ']) {
      addCandidate({ ...base, consonants: weak + base.consonants, confidence: 0.6 });
    }

    // Ayin-weak: insert ܘ or ܝ between R1 and R2
    for (const weak of ['ܘ', 'ܝ']) {
      addCandidate({ ...base, consonants: r1 + weak + r2, confidence: 0.6 });
    }

    // Lamed-weak: append ܐ or ܝ
    for (const weak of ['ܐ', 'ܝ']) {
      addCandidate({ ...base, consonants: base.consonants + weak, confidence: 0.6 });
    }
  }

  // Sort by confidence descending
  candidates.sort((a, b) => b.confidence - a.confidence);
  return candidates;
}

// ---------------------------------------------------------------------------
// SEDRA confirmation
// ---------------------------------------------------------------------------

export interface RankedParadigmMatch {
  form: SedraParadigmForm;
  score: number; // 0–1, higher is better
  matchType: 'exact' | 'vowel-close' | 'consonantal';
}

export interface ReverseInflectionResult {
  candidate: CandidateRoot;
  sedraWords: SedraWord[];
  lexeme: SedraLexeme | null;
  paradigm: SedraParadigm | null;
  rankedMatches: RankedParadigmMatch[];
  gloss: string | undefined;
  steps: ParseStep[];
}

/**
 * Score how well a paradigm form matches the input, considering vowels.
 * Both strings are normalized to western vocalization for comparison.
 * Returns 0–1 where 1 = exact match.
 */
function scoreFormMatch(input: string, paradigmForm: string): { score: number; matchType: RankedParadigmMatch['matchType'] } {
  const inputW = convertSyriacVowelStyle(input, 'western');
  const formW = convertSyriacVowelStyle(paradigmForm, 'western');

  // Exact match (after normalizing vocalization style)
  if (inputW === formW) {
    return { score: 1.0, matchType: 'exact' };
  }

  // Consonantal match is the baseline
  const inputCons = stripSyriacVowels(input);
  const formCons = stripSyriacVowels(paradigmForm);
  if (inputCons !== formCons) {
    return { score: 0, matchType: 'consonantal' };
  }

  // Same consonants — score by vowel similarity
  // Extract vowels in order for each
  const vowelPattern = /[\u0730-\u074A]/g;
  const inputVowels = [...inputW].filter(c => vowelPattern.test(c));
  // Reset lastIndex since we're reusing the regex conceptually
  const formVowels = [...formW].filter(c => /[\u0730-\u074A]/.test(c));

  if (inputVowels.length === 0 && formVowels.length === 0) {
    // Both consonantal — treat as exact
    return { score: 1.0, matchType: 'exact' };
  }

  if (inputVowels.length === 0 || formVowels.length === 0) {
    // One has vowels, other doesn't — consonantal match
    return { score: 0.5, matchType: 'consonantal' };
  }

  // Count matching vowels in same positions
  const maxLen = Math.max(inputVowels.length, formVowels.length);
  let matches = 0;
  for (let i = 0; i < maxLen; i++) {
    if (inputVowels[i] === formVowels[i]) matches++;
  }

  const vowelScore = matches / maxLen;
  // Scale: consonantal base 0.5, vowel match adds up to 0.5
  const score = 0.5 + vowelScore * 0.5;
  const matchType = vowelScore >= 0.8 ? 'vowel-close' : 'consonantal';

  return { score, matchType };
}

function rankParadigmMatches(input: string, paradigm: SedraParadigm): RankedParadigmMatch[] {
  const inputCons = stripSyriacVowels(input);
  const matches: RankedParadigmMatch[] = [];

  for (const form of paradigm.forms) {
    // Only consider forms with matching consonants
    if (stripSyriacVowels(form.form) !== inputCons) continue;

    const { score, matchType } = scoreFormMatch(input, form.form);
    matches.push({ form, score, matchType });
  }

  matches.sort((a, b) => b.score - a.score);
  return matches;
}

export async function reverseInflectionLookup(
  input: string
): Promise<ReverseInflectionResult | null> {
  const candidates = generateCandidateRoots(input);
  if (candidates.length === 0) return null;

  // Deduplicate consonantal roots for SEDRA queries
  const uniqueRoots = [...new Set(candidates.map(c => c.consonants))];

  // Batch lookup: try up to 8 unique roots in parallel
  const batchSize = 8;
  for (let i = 0; i < uniqueRoots.length; i += batchSize) {
    const batch = uniqueRoots.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(root => lookupWord(root)));

    for (let j = 0; j < batch.length; j++) {
      const root = batch[j];
      const sedraWords = results[j];
      if (sedraWords.length === 0) continue;

      // Find the candidate(s) that produced this root
      const matchingCandidates = candidates.filter(c => c.consonants === root);

      // Try to get lexeme and paradigm for confirmation
      for (const word of sedraWords) {
        if (!word.lexeme?.id) continue;

        try {
          const lexeme = await lookupLexeme(word.lexeme.id);
          if (!lexeme) continue;

          // Try to fetch paradigm to confirm the inflected form
          let paradigm: SedraParadigm | null = null;
          if (lexeme.categoryType === 'verb' || word.kaylo) {
            const html = await fetchLexemeParadigmHtml(word.lexeme.id);
            if (html) {
              paradigm = parseSedraParadigmHtml(html, word.lexeme.id);
            }
          }

          // Rank paradigm forms by vowel similarity to input
          const rankedMatches = paradigm ? rankParadigmMatches(input, paradigm) : [];
          const confirmed = rankedMatches.length > 0;

          // Even without paradigm confirmation, a SEDRA hit on the root is useful
          const bestCandidate = matchingCandidates[0];
          const gloss = getGloss(word);
          const steps = buildReverseInflectionSteps(input, bestCandidate, root, gloss, confirmed);

          return {
            candidate: bestCandidate,
            sedraWords,
            lexeme,
            paradigm,
            rankedMatches,
            gloss,
            steps,
          };
        } catch (e) {
          console.error('Reverse inflection lexeme fetch error:', e);
        }
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Step-by-step breakdown
// ---------------------------------------------------------------------------

function makeStep(
  n: number,
  id: string,
  explanation: string,
  highlights: HighlightRange[],
  conclusion: ParseConclusion,
  cumulativeConclusion: ParseConclusion,
): ParseStep {
  return {
    stepNumber: n,
    rule: {
      id,
      description: explanation,
      pattern: '',
      isRegex: false,
      highlightRanges: highlights,
      conclusion,
      nextRules: [],
      priority: 0,
      autoGenerated: true,
    },
    matched: true,
    highlights,
    cumulativeConclusion,
    explanation,
  };
}

function buildReverseInflectionSteps(
  input: string,
  candidate: CandidateRoot,
  rootConsonants: string,
  gloss: string | undefined,
  confirmed: boolean,
): ParseStep[] {
  const cons = stripSyriacVowels(input);
  const steps: ParseStep[] = [];
  let cumulative: ParseConclusion = {};
  let stepNum = 1;

  // Step 1: Show consonantal skeleton
  steps.push(makeStep(
    stepNum++,
    'reverse_consonants',
    `Consonantal form: ${cons}`,
    [{ start: 0, end: cons.length, type: 'match', label: 'consonants' }],
    {},
    { ...cumulative },
  ));

  // Step 2: Suffix identification
  if (candidate.strippedSuffix) {
    const suf = candidate.strippedSuffix;
    const sufStart = cons.length - suf.affix.length;
    const conclusion: ParseConclusion = candidate.impliedConclusions[0] ?? {};
    // Only take tense-related fields from the suffix
    const sufConclusion: ParseConclusion = {};
    if (conclusion.person) sufConclusion.person = conclusion.person;
    if (conclusion.gender) sufConclusion.gender = conclusion.gender;
    if (conclusion.number) sufConclusion.number = conclusion.number;
    if (conclusion.tense) sufConclusion.tense = conclusion.tense;

    cumulative = { ...cumulative, ...sufConclusion };
    steps.push(makeStep(
      stepNum++,
      'reverse_suffix',
      `Suffix: ${suf.description}`,
      [{ start: sufStart, end: cons.length, type: 'affix', label: suf.id }],
      sufConclusion,
      { ...cumulative },
    ));
  }

  // Step 3: Imperfect prefix identification
  if (candidate.strippedPrefix) {
    const pfx = candidate.strippedPrefix;
    const pfxConclusion: ParseConclusion = { tense: 'future' };
    cumulative = { ...cumulative, ...pfxConclusion };
    steps.push(makeStep(
      stepNum++,
      'reverse_prefix',
      `Prefix: ${pfx.description}`,
      [{ start: 0, end: pfx.affix.length, type: 'affix', label: pfx.id }],
      pfxConclusion,
      { ...cumulative },
    ));
  }

  // Step 4: Stem prefix identification
  if (candidate.strippedStemPrefix) {
    const stemPfx = candidate.strippedStemPrefix;
    // The stem prefix starts after any imperfect prefix
    const offset = candidate.strippedPrefix?.affix.length ?? 0;
    const stemConclusion: ParseConclusion = { stem: stemPfx.conclusions[0]?.stem };
    cumulative = { ...cumulative, ...stemConclusion };
    steps.push(makeStep(
      stepNum++,
      'reverse_stem_prefix',
      `Stem: ${stemPfx.description}`,
      [{ start: offset, end: offset + stemPfx.affix.length, type: 'affix', label: stemPfx.id }],
      stemConclusion,
      { ...cumulative },
    ));
  }

  // Step 5: Root identification
  const rootConclusion: ParseConclusion = { root: rootConsonants };
  cumulative = { ...cumulative, ...rootConclusion };
  const rootDesc = gloss
    ? `Root: ${rootConsonants} — "${gloss}"`
    : `Root: ${rootConsonants}`;
  // Calculate root position in the consonantal form
  const prefixLen = (candidate.strippedPrefix?.affix.length ?? 0) + (candidate.strippedStemPrefix?.affix.length ?? 0);
  const suffixLen = candidate.strippedSuffix?.affix.length ?? 0;
  steps.push(makeStep(
    stepNum++,
    'reverse_root',
    rootDesc,
    [{ start: prefixLen, end: cons.length - suffixLen, type: 'root', label: 'root' }],
    rootConclusion,
    { ...cumulative },
  ));

  // Step 6: Confirmation
  const confirmDesc = confirmed
    ? `Confirmed: form found in SEDRA paradigm for ${rootConsonants}`
    : `Root ${rootConsonants} found in SEDRA (paradigm confirmation pending)`;
  steps.push(makeStep(
    stepNum++,
    'reverse_confirm',
    confirmDesc,
    [],
    {},
    { ...cumulative },
  ));

  return steps;
}
