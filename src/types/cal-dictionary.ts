// Types for the CAL (Comprehensive Aramaic Lexicon) dictionary data

export interface DictRefs {
  ls2?: string;      // Brockelmann Lexicon Syriacum
  ps?: string;       // Payne-Smith Thesaurus Syriacus
  jps?: string;      // J. Payne-Smith Compendious Syriac Dictionary
  djpa?: string;     // Sokoloff DJPA
  djba?: string;     // Sokoloff DJBA
  md?: string;       // Mandaic Dictionary (Drower/Macuch)
  jastrow?: string;  // Jastrow
  levy?: string;     // Levy
  tal?: string;      // Tal
  audo?: string;     // Audo
  bb?: string;       // Bar Bahlul
  ba?: string;       // Bar Ali
  dnwsi?: string;    // Dictionary of NW Semitic Inscriptions
  diso?: string;     // DISO
  schult?: string;   // Schulthess
  dja?: string;      // Dictionary of Jewish Aramaic
  qumran?: string;   // Qumran page ref
}

export interface CALCitation {
  citation_id: number;
  aramaic: string;
  aramaic_hebrew: string;
  translation: string;
  source: string;
  coord: string;
  reference: string;
}

export interface CALMeaning {
  gloss_id: number;
  sense: string;
  dialect_codes: string[];
  dialect_names: string[];
  gloss: string;
  citations: CALCitation[];
}

export interface CALEntry {
  lemma: string;
  lemma_hebrew: string;
  lemma_hebrew_word: string;
  lemma_syriac: string;
  lemma_display: string;
  sortkey: string;
  pos: string;
  primary_gloss: string;
  formal_shape: string;
  vocalized_shape: string;
  form_section: string;
  end_notes: string;
  xref: string;
  dict_refs: DictRefs;
  related: string[];
  vocalizations?: Record<string, string>;
  extra_comments?: string;
  sense_count: number;
  meanings: CALMeaning[];
}

export interface CALEntryFile {
  first_char: string;
  count: number;
  entries: CALEntry[];
}

/** Lightweight search index entry (compact keys to reduce index size) */
export interface CALIndexEntry {
  l: string;  // CAL lemma
  s: string;  // Syriac script
  h: string;  // Hebrew script
  p: string;  // POS
  g: string;  // English gloss
  f: string;  // File key for lazy loading
  y: number;  // 1 if any meaning has Syriac dialect (60/65)
}

export interface CALDialect {
  abbrev: string;
  name: string;
}

export interface DictAbbrev {
  abbrev: string;
  name: string;
  noteFormat?: string;
}

export interface CALMetadata {
  version: string;
  build_date: string;
  source: string;
  total_entries: number;
  dialects: Record<string, CALDialect>;
  dictionaries: Record<string, DictAbbrev>;
}
