/** A single word in a CAL text verse */
export interface CALWord {
  /** Display text (Syriac script) */
  text: string;
  /** Coordinate for lexical lookup */
  coord: string;
  /** Word index within the verse */
  wordIndex: number;
}

/** A verse/line in a CAL text */
export interface CALVerse {
  /** Verse reference, e.g. "15:1" */
  ref: string;
  /** Individual words */
  words: CALWord[];
  /** Coordinate for commentary link */
  commentCoord: string;
}

/** Gloss data for a word, parsed from CAL lexicon */
export interface CALWordGloss {
  lemma: string;
  gloss: string;
  pos: string;
  /** True if ALL senses are attested only in Syriac (not shared with other Aramaic dialects) */
  syriacOnly: boolean;
}

/** A parsed CAL chapter */
export interface CALChapter {
  /** Text title / identifier */
  title: string;
  /** File code, e.g. "62002" */
  fileCode: string;
  /** Chapter number */
  chapter: number;
  /** Character set used */
  cset: string;
  /** Parsed verses */
  verses: CALVerse[];
  /** Previous chapter number, if any */
  prevChapter: number | null;
  /** Next chapter number, if any */
  nextChapter: number | null;
  /** Word glosses keyed by word text. Populated after background fetch. */
  glosses?: Record<string, CALWordGloss>;
}

/** Known CAL text entry for the catalog */
export interface CALTextInfo {
  fileCode: string;
  name: string;
  abbreviation: string;
  group: string;
}
