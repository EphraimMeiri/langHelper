export interface Anchor {
  prefix: string;
  page: number;
  addedAt?: string;
}

export interface ExactEntry {
  lemma: string;
  page: number;
  position?: number;
  notes?: string;
  addedAt?: string;
}

export interface Dictionary {
  id: string;
  languageId: string;
  name: string;
  pdfPath: string;
  pageCount: number;
  anchors: Anchor[];
  exactEntries: ExactEntry[];
  calDictKey?: string;    // CAL dictionary key (e.g., 'ps', 'ls2', 'jastrow')
  pageOffset?: number;    // PDF page = printed page + offset (default 0)
  createdAt: string;
  updatedAt: string;
}

export interface DictionaryLookupResult {
  found: boolean;
  page: number;
  confidence: 'exact' | 'approximate' | 'range';
  matchedAnchor?: Anchor;
  matchedEntry?: ExactEntry;
  nearbyAnchors?: { before?: Anchor; after?: Anchor };
}

export function createEmptyDictionary(
  id: string,
  languageId: string,
  name: string,
  pdfPath: string
): Dictionary {
  return {
    id,
    languageId,
    name,
    pdfPath,
    pageCount: 0,
    anchors: [],
    exactEntries: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function sortAnchors(anchors: Anchor[]): Anchor[] {
  return [...anchors].sort((a, b) => a.prefix.localeCompare(b.prefix));
}

export function findBestPage(
  dictionary: Dictionary,
  searchTerm: string
): DictionaryLookupResult {
  const exactMatch = dictionary.exactEntries.find(
    e => e.lemma === searchTerm
  );
  if (exactMatch) {
    return {
      found: true,
      page: exactMatch.page,
      confidence: 'exact',
      matchedEntry: exactMatch,
    };
  }

  const sortedAnchors = sortAnchors(dictionary.anchors);

  let before: Anchor | undefined;
  let after: Anchor | undefined;

  for (let i = 0; i < sortedAnchors.length; i++) {
    const anchor = sortedAnchors[i];
    const comparison = searchTerm.localeCompare(anchor.prefix);

    if (comparison === 0) {
      return {
        found: true,
        page: anchor.page,
        confidence: 'exact',
        matchedAnchor: anchor,
      };
    } else if (comparison > 0) {
      before = anchor;
    } else {
      after = anchor;
      break;
    }
  }

  if (before) {
    return {
      found: true,
      page: before.page,
      confidence: before.prefix.length > 1 ? 'approximate' : 'range',
      matchedAnchor: before,
      nearbyAnchors: { before, after },
    };
  }

  return {
    found: false,
    page: 1,
    confidence: 'range',
    nearbyAnchors: { after },
  };
}
