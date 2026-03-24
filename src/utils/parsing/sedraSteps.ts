/**
 * Builds a synthetic step-by-step morphological breakdown for a SEDRA result.
 *
 * SEDRA gives us the parsed conclusion (kaylo, tense, person, gender, number)
 * and the root/stem consonants. We use that to locate structural parts of the
 * word (root, kaylo prefix, tense/PNG suffix) and explain each one.
 */

import type { ParseStep, HighlightRange, ParseConclusion } from '../../types/parsing';
import type { SedraWord } from '../../services/sedraApi';
import { stripSyriacVowels } from '../syriacText';

// Known prefixes for each kaylo (consonantal, on the word itself)
const KAYLO_PREFIXES: Record<string, string> = {
  "aphel":    'ܐ',
  "ettaphal": 'ܐܬ',
  "ettafal":  'ܐܬ',
  "shaphel":  'ܫ',
  "eshtaphal":'ܐܫܬ',
  "pael":     '',
  "paʿʿel":  '',
  "peal":     '',
  "peʿal":   '',
  "ethpeel":  'ܐܬ',
  "ethpaal":  'ܐܬ',
  "ethpael":  'ܐܬ',
};

// Kaylo descriptions
const KAYLO_DESC: Record<string, string> = {
  "peal":     "Peal (G-stem): simple action",
  "peʿal":   "Peal (G-stem): simple action",
  "pael":     "Pael (D-stem): intensive/causative action",
  "paʿʿel":  "Paʿʿel (D-stem): intensive/causative action",
  "aphel":    "Aphel (C-stem): causative, prefixed ܐ",
  "ettaphal": "Ettaphal (Ct-stem): causative reflexive/passive, prefixed ܐܬ",
  "ettafal":  "Ettafal (Ct-stem): causative reflexive/passive, prefixed ܐܬ",
  "ethpeel":  "Ethpeel (Gt-stem): passive/reflexive of Peal, prefixed ܐܬ",
  "ethpaal":  "Ethpaal (Dt-stem): passive/reflexive of Pael, prefixed ܐܬ",
  "ethpael":  "Ethpael (Dt-stem): passive/reflexive of Pael, prefixed ܐܬ",
  "shaphel":  "Shaphel (S-stem): causative, prefixed ܫ",
  "eshtaphal":"Eshtaphal (St-stem): causative reflexive, prefixed ܐܫܬ",
};

// PNG suffix descriptions: tense → {person}{gender}{number} → description + consonantal suffix
type PNGKey = string; // e.g. "2ms", "3fp", "1c"
interface SuffixInfo { suffix: string; desc: string; }

const PERFECT_SUFFIXES: Record<PNGKey, SuffixInfo> = {
  "3ms": { suffix: "",    desc: "3rd masc. sg. perfect: no suffix" },
  "3fs": { suffix: "ܬ",  desc: "3rd fem. sg. perfect: ـܬ" },
  "2ms": { suffix: "ܬ",  desc: "2nd masc. sg. perfect: ـܬ" },
  "2fs": { suffix: "ܬܝ", desc: "2nd fem. sg. perfect: ـܬܝ" },
  "1cs": { suffix: "ܬ",  desc: "1st common sg. perfect: ـܬ" },
  "3mp": { suffix: "ܘ",  desc: "3rd masc. pl. perfect: ـܘ" },
  "3fp": { suffix: "ܝ",  desc: "3rd fem. pl. perfect: ـܝ" },
  "2mp": { suffix: "ܬܘܢ",desc: "2nd masc. pl. perfect: ـܬܘܢ" },
  "2fp": { suffix: "ܬܝܢ",desc: "2nd fem. pl. perfect: ـܬܝܢ" },
  "1cp": { suffix: "ܢ",  desc: "1st common pl. perfect: ـܢ" },
};

const IMPERFECT_SUFFIXES: Record<PNGKey, SuffixInfo> = {
  "3ms": { suffix: "",    desc: "3rd masc. sg. imperfect: no suffix" },
  "3fs": { suffix: "ܢ",  desc: "3rd fem. sg. imperfect: ـܢ" },
  "2ms": { suffix: "",    desc: "2nd masc. sg. imperfect: no suffix" },
  "2fs": { suffix: "ܢ",  desc: "2nd fem. sg. imperfect: ـܢ" },
  "1cs": { suffix: "",    desc: "1st common sg. imperfect: no suffix" },
  "3mp": { suffix: "ܘܢ", desc: "3rd masc. pl. imperfect: ـܘܢ" },
  "3fp": { suffix: "ܢ",  desc: "3rd fem. pl. imperfect: ـܢ" },
  "2mp": { suffix: "ܘܢ", desc: "2nd masc. pl. imperfect: ـܘܢ" },
  "2fp": { suffix: "ܢ",  desc: "2nd fem. pl. imperfect: ـܢ" },
  "1cp": { suffix: "",    desc: "1st common pl. imperfect: no suffix" },
};

const IMPERATIVE_SUFFIXES: Record<PNGKey, SuffixInfo> = {
  "2ms": { suffix: "",    desc: "2nd masc. sg. imperative: no suffix" },
  "2fs": { suffix: "ܝ",  desc: "2nd fem. sg. imperative: ـܝ" },
  "2mp": { suffix: "ܘ",  desc: "2nd masc. pl. imperative: ـܘ" },
  "2fp": { suffix: "ܢ",  desc: "2nd fem. pl. imperative: ـܢ" },
};

function getPNGKey(word: SedraWord): PNGKey {
  const p = word.person?.[0] ?? '';   // "first"→"f", "second"→"s", "third"→"t" ... use number
  const personMap: Record<string, string> = { first: '1', second: '2', third: '3' };
  const genderMap: Record<string, string> = { masculine: 'm', feminine: 'f', common: 'c' };
  const numberMap: Record<string, string> = { singular: 's', plural: 'p' };
  const person = personMap[word.person ?? ''] ?? '';
  const gender = genderMap[word.gender ?? ''] ?? 'c';
  const number = numberMap[word.number ?? ''] ?? 's';
  return `${person}${gender}${number}`;
}

function getSuffixInfo(word: SedraWord, pngKey: PNGKey): SuffixInfo | null {
  const tense = word.tense?.toLowerCase() ?? '';
  if (tense === 'perfect') return PERFECT_SUFFIXES[pngKey] ?? null;
  if (tense === 'imperfect') return IMPERFECT_SUFFIXES[pngKey] ?? null;
  if (tense === 'imperative') return IMPERATIVE_SUFFIXES[pngKey] ?? null;
  return null;
}

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

export function buildSedraSteps(word: SedraWord): ParseStep[] {
  const consonantal = stripSyriacVowels(word.syriac ?? '');
  if (!consonantal) return [];

  const steps: ParseStep[] = [];
  let cumulative: ParseConclusion = {};

  const kaylo = word.kaylo?.toLowerCase() ?? '';
  const kayloPrefix = KAYLO_PREFIXES[kaylo] ?? '';
  const rootConsonants = word.stem ? stripSyriacVowels(word.stem) : '';

  // --- Step 1: Identify the root ---
  let rootStart = 0;
  let rootEnd = consonantal.length;

  if (rootConsonants) {
    // Find root consonants in the word, skipping any kaylo prefix
    const prefixLen = kayloPrefix.length;
    const idx = consonantal.indexOf(rootConsonants, prefixLen);
    if (idx !== -1) {
      rootStart = idx;
      rootEnd = idx + rootConsonants.length;
    }
  }

  const rootHighlight: HighlightRange = {
    start: rootStart,
    end: rootEnd,
    type: 'root',
    label: 'root',
  };

  cumulative = { ...cumulative, root: rootConsonants || consonantal };
  steps.push(makeStep(
    1,
    'sedra_root',
    `Root: ${rootConsonants || consonantal} — the base consonantal root`,
    [rootHighlight],
    { root: rootConsonants || consonantal },
    { ...cumulative },
  ));

  // --- Step 2: Identify the kaylo (stem pattern) ---
  if (kaylo) {
    const desc = KAYLO_DESC[kaylo] ?? `${word.kaylo} stem`;
    const kayloHighlights: HighlightRange[] = [];

    if (kayloPrefix.length > 0) {
      kayloHighlights.push({
        start: 0,
        end: kayloPrefix.length,
        type: 'affix',
        label: kaylo,
      });
    }

    cumulative = { ...cumulative, stem: word.kaylo ?? kaylo };
    steps.push(makeStep(
      2,
      'sedra_kaylo',
      `Stem: ${desc}`,
      kayloHighlights,
      { stem: word.kaylo ?? kaylo },
      { ...cumulative },
    ));
  }

  // --- Step 3: Tense + PNG suffix ---
  const pngKey = getPNGKey(word);
  const suffixInfo = getSuffixInfo(word, pngKey);
  const tenseLabel = word.tense ?? '';
  const personLabel = word.person ?? '';
  const genderLabel = word.gender ?? '';
  const numberLabel = word.number ?? '';
  const pngDesc = [personLabel, genderLabel, numberLabel].filter(Boolean).join(' ');

  const suffixHighlights: HighlightRange[] = [];
  if (suffixInfo && suffixInfo.suffix.length > 0) {
    // The suffix should be at the end of the consonantal form
    const suffixStart = consonantal.length - suffixInfo.suffix.length;
    if (suffixStart >= rootStart && consonantal.endsWith(suffixInfo.suffix)) {
      suffixHighlights.push({
        start: suffixStart,
        end: consonantal.length,
        type: 'affix',
        label: pngKey,
      });
    }
  }

  const tenseExplanation = suffixInfo
    ? `${tenseLabel} ${pngDesc}: ${suffixInfo.desc}`
    : `${tenseLabel} ${pngDesc}`;

  cumulative = {
    ...cumulative,
    tense: tenseLabel,
    person: personLabel,
    gender: genderLabel,
    number: numberLabel,
  };

  steps.push(makeStep(
    3,
    'sedra_png',
    tenseExplanation,
    suffixHighlights,
    { tense: tenseLabel, person: personLabel, gender: genderLabel, number: numberLabel },
    { ...cumulative },
  ));

  return steps;
}
