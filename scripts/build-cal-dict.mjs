#!/usr/bin/env node
/**
 * Build script: Merge CAL dictionary JSON with ol_extra.tsv (dictionary references)
 * and ol_connections.tsv (inter-lemma relationships) into app-ready data files.
 *
 * Usage: node scripts/build-cal-dict.mjs [--cal-dir <path>]
 *
 * Default CAL dir: ../DICTA/CAL data (relative to project root)
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

// Parse args
const args = process.argv.slice(2);
let calDir = resolve(PROJECT_ROOT, '..', 'DICTA', 'CAL data');
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--cal-dir' && args[i + 1]) {
    calDir = resolve(args[i + 1]);
    i++;
  }
}

const JSON_DIR = join(calDir, 'output_v3', 'json', 'entries');
const EXPORT_DIR = join(calDir, 'newCALExport');
const OUT_DIR = join(PROJECT_ROOT, 'data', 'dictionaries', 'cal');
const OUT_ENTRIES = join(OUT_DIR, 'entries');

// CAL ASCII → Syriac consonant map
const CAL_TO_SYRIAC = new Map([
  ['$', 'ܫ'], ['&', 'ܫ'], [')', 'ܐ'], ['(', 'ܥ'],
  ['b', 'ܒ'], ['g', 'ܓ'], ['d', 'ܕ'], ['h', 'ܗ'],
  ['w', 'ܘ'], ['z', 'ܙ'], ['x', 'ܚ'], ['T', 'ܛ'],
  ['+', 'ܛ'], // Teth alternate encoding
  ['y', 'ܝ'], ['k', 'ܟ'], ['l', 'ܠ'], ['m', 'ܡ'],
  ['n', 'ܢ'], ['s', 'ܣ'], ['p', 'ܦ'], ['c', 'ܨ'],
  ['q', 'ܩ'], ['r', 'ܪ'], ['S', 'ܫ'], ['t', 'ܬ'],
]);

function calToSyriac(cal) {
  const word = cal.replace(/#\d+/, '').replace(/\s+[A-Z].*$/, '').replace(/@/g, ' ');
  let result = '';
  for (const ch of word) {
    result += CAL_TO_SYRIAC.get(ch) || '';
  }
  return result;
}

// ---------------------------------------------------------------------------
// 1. Parse ol_extra.tsv → dictionary references map
// ---------------------------------------------------------------------------
console.log('Reading ol_extra.tsv...');
const extraPath = join(EXPORT_DIR, 'ol_extra.tsv');
const extraLines = readFileSync(extraPath, 'utf-8').split('\n');
const extraHeader = extraLines[0].split('\t');

// Map column names to our short keys
const DICT_COL_MAP = {
  'LS2_page': 'ls2',
  'DJPA_page': 'djpa',
  'DJBA_page': 'djba',
  'MD_page': 'md',
  'Jastrow_page': 'jastrow',
  'Tal_page': 'tal',
  'PS_page': 'ps',
  'JPS': 'jps',
  'Audo': 'audo',
  'BB': 'bb',
  'BA': 'ba',
  'DNWSI': 'dnwsi',
  'DISO': 'diso',
  'Levy_page': 'levy',
  'Schult': 'schult',
  'DJA': 'dja',
  'Qumran': 'qumran',
};

// Also capture vocalization columns
const VOC_COL_MAP = {
  'LS2_voc': 'ls2_voc',
  'MD_voc': 'md_voc',
  'DJBA_voc': 'djba_voc',
  'DJPA_voc': 'djpa_voc',
  'JLA_voc': 'jla_voc',
};

// Find column indices
const dictColIndices = {};
const vocColIndices = {};
for (let i = 0; i < extraHeader.length; i++) {
  const col = extraHeader[i].trim();
  if (DICT_COL_MAP[col]) dictColIndices[DICT_COL_MAP[col]] = i;
  if (VOC_COL_MAP[col]) vocColIndices[VOC_COL_MAP[col]] = i;
}

const lemmaColIdx = extraHeader.findIndex(h => h.trim() === 'CAL_lemma');
const commentsColIdx = extraHeader.findIndex(h => h.trim() === 'comments');

const dictRefsMap = new Map(); // lemma → { dict_refs, vocalizations }

for (let i = 1; i < extraLines.length; i++) {
  const line = extraLines[i];
  if (!line.trim()) continue;
  const cols = line.split('\t');
  const lemma = cols[lemmaColIdx]?.trim();
  if (!lemma) continue;

  const dict_refs = {};
  for (const [key, colIdx] of Object.entries(dictColIndices)) {
    const val = cols[colIdx]?.trim();
    if (val && val !== 'NULL' && val !== '') {
      dict_refs[key] = val;
    }
  }

  const vocalizations = {};
  for (const [key, colIdx] of Object.entries(vocColIndices)) {
    const val = cols[colIdx]?.trim();
    if (val && val !== 'NULL' && val !== '') {
      vocalizations[key] = val;
    }
  }

  const comments = cols[commentsColIdx]?.trim();

  if (Object.keys(dict_refs).length > 0 || Object.keys(vocalizations).length > 0) {
    dictRefsMap.set(lemma, {
      dict_refs,
      ...(Object.keys(vocalizations).length > 0 ? { vocalizations } : {}),
      ...(comments && comments !== 'NULL' ? { comments } : {}),
    });
  }
}

console.log(`  Loaded ${dictRefsMap.size} entries with dictionary references`);

// ---------------------------------------------------------------------------
// 2. Parse ol_connections.tsv → related lemmas map
// ---------------------------------------------------------------------------
console.log('Reading ol_connections.tsv...');
const connPath = join(EXPORT_DIR, 'ol_connections.tsv');
const connLines = readFileSync(connPath, 'utf-8').split('\n');

const relatedMap = new Map(); // lemma → Set<target>

for (let i = 1; i < connLines.length; i++) {
  const line = connLines[i];
  if (!line.trim()) continue;
  const cols = line.split('\t');
  const lemma = cols[1]?.trim();
  const target = cols[2]?.trim();
  if (!lemma || !target) continue;

  if (!relatedMap.has(lemma)) relatedMap.set(lemma, new Set());
  relatedMap.get(lemma).add(target);

  // Also add reverse link
  if (!relatedMap.has(target)) relatedMap.set(target, new Set());
  relatedMap.get(target).add(lemma);
}

console.log(`  Loaded ${relatedMap.size} lemmas with related entries`);

// ---------------------------------------------------------------------------
// 3. Read CAL JSON entries and merge
// ---------------------------------------------------------------------------
console.log('Reading CAL JSON entries...');
const jsonFiles = readdirSync(JSON_DIR).filter(f => f.endsWith('.json'));
console.log(`  Found ${jsonFiles.length} JSON files`);

const searchIndex = [];
let totalEntries = 0;

mkdirSync(OUT_ENTRIES, { recursive: true });

for (const file of jsonFiles) {
  const raw = JSON.parse(readFileSync(join(JSON_DIR, file), 'utf-8'));
  const fileKey = file.replace('.json', '');

  const enrichedEntries = [];

  for (const entry of raw.entries) {
    const lemma = entry.lemma;

    // Add Syriac transliteration
    const lemma_syriac = calToSyriac(lemma);

    // Get dictionary references
    const extraData = dictRefsMap.get(lemma);
    const dict_refs = extraData?.dict_refs || {};
    const vocalizations = extraData?.vocalizations;
    const extra_comments = extraData?.comments;

    // Get related lemmas
    const relatedSet = relatedMap.get(lemma);
    const related = relatedSet ? [...relatedSet] : [];

    // Build enriched entry
    const enriched = {
      ...entry,
      lemma_syriac,
      dict_refs,
      related,
    };
    if (vocalizations) enriched.vocalizations = vocalizations;
    if (extra_comments) enriched.extra_comments = extra_comments;

    enrichedEntries.push(enriched);

    // Build search index entry
    searchIndex.push({
      l: lemma,                             // CAL lemma
      s: lemma_syriac,                      // Syriac script
      h: entry.lemma_hebrew_word || '',     // Hebrew script
      p: entry.pos || '',                   // POS
      g: entry.primary_gloss || '',         // English gloss
      f: fileKey,                           // File key for lazy loading
    });

    totalEntries++;
  }

  // Write enriched entry file
  const outData = {
    first_char: raw.first_char,
    count: enrichedEntries.length,
    entries: enrichedEntries,
  };
  writeFileSync(join(OUT_ENTRIES, file), JSON.stringify(outData));
  console.log(`  ${file}: ${enrichedEntries.length} entries`);
}

// ---------------------------------------------------------------------------
// 4. Write search index
// ---------------------------------------------------------------------------
console.log(`Writing search index (${searchIndex.length} entries)...`);
writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(searchIndex));

const indexSize = readFileSync(join(OUT_DIR, 'index.json')).length;
console.log(`  Index size: ${(indexSize / 1024 / 1024).toFixed(1)} MB`);

// ---------------------------------------------------------------------------
// 5. Write metadata
// ---------------------------------------------------------------------------
console.log('Reading metadata...');
const metaPath = join(calDir, 'output_v3', 'json', 'cal_metadata.json');
const originalMeta = JSON.parse(readFileSync(metaPath, 'utf-8'));

const DICT_ABBREVIATIONS = {
  ls2: { abbrev: 'LS2', name: 'Lexicon Syriacum (Brockelmann)', noteFormat: 'page[column]' },
  ps: { abbrev: 'PS', name: 'Thesaurus Syriacus (Payne-Smith)' },
  jps: { abbrev: 'JPS', name: 'Compendious Syriac Dictionary (J. Payne-Smith)' },
  djpa: { abbrev: 'DJPA', name: 'Dictionary of Jewish Palestinian Aramaic (Sokoloff)' },
  djba: { abbrev: 'DJBA', name: 'Dictionary of Jewish Babylonian Aramaic (Sokoloff)' },
  md: { abbrev: 'MD', name: 'Mandaic Dictionary (Drower/Macuch)' },
  jastrow: { abbrev: 'Jastrow', name: 'Dictionary of the Targumim (Jastrow)' },
  levy: { abbrev: 'Levy', name: 'Chaldaisches Worterbuch (Levy)' },
  tal: { abbrev: 'Tal', name: 'Dictionary of Samaritan Aramaic (Tal)' },
  audo: { abbrev: 'Audo', name: 'Syriac Dictionary (Audo)' },
  bb: { abbrev: 'BB', name: 'Lexicon (Bar Bahlul)' },
  ba: { abbrev: 'BA', name: 'Lexicon (Bar Ali)' },
  dnwsi: { abbrev: 'DNWSI', name: 'Dictionary of North-West Semitic Inscriptions' },
  diso: { abbrev: 'DISO', name: 'Dictionnaire des inscriptions semitiques de l\'ouest' },
  schult: { abbrev: 'Schult', name: 'Lexicon Syropalaestinum (Schulthess)' },
  dja: { abbrev: 'DJA', name: 'Dictionary of Jewish Aramaic' },
  qumran: { abbrev: 'Qumran', name: 'Qumran Aramaic texts page reference' },
};

const metadata = {
  version: '1.0',
  build_date: new Date().toISOString(),
  source: 'CAL Dictionary + ol_extra.tsv + ol_connections.tsv',
  total_entries: totalEntries,
  dialects: originalMeta.dialects,
  dictionaries: DICT_ABBREVIATIONS,
};

writeFileSync(join(OUT_DIR, 'metadata.json'), JSON.stringify(metadata, null, 2));

console.log(`\nDone! ${totalEntries} entries processed.`);
console.log(`Output: ${OUT_DIR}`);
