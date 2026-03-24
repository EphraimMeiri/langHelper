/**
 * Parse CAL getlex.php responses to extract gloss + dialect info.
 *
 * Dialect codes (from CAL):
 *   44 = Qumran, 51 = JLAtg, 53 = Galilean, 54 = PTA, 55 = CPA,
 *   56 = Samaritan, 60 = Syriac, 65 = Syriac (alternate), 70 = JBA bowls,
 *   74 = Mandaic, 81 = LJLA, ...
 *
 * We consider codes 60 and 65 as "Syriac". A word is Syriac-specific if
 * ALL its senses are attested only in Syriac (no other Aramaic dialect).
 */

const SYRIAC_DIALECT_CODES = new Set(['60', '65']);

export interface WordGloss {
  /** CAL lemma (ASCII) */
  lemma: string;
  /** Primary English gloss */
  gloss: string;
  /** Part of speech */
  pos: string;
  /** Whether ALL senses are Syriac-only (no other Aramaic dialect) */
  syriacOnly: boolean;
  /** Per-sense dialect info (for reference) */
  senses: { gloss: string; dialects: string[] }[];
}

/**
 * Parse the HTML from getlex.php into structured gloss data.
 */
export function parseGlossHTML(html: string): WordGloss | null {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const body = doc.body;
  if (!body) return null;

  const bodyHTML = body.innerHTML;

  // Extract lemma from the <span class="lem"> or the first text line
  // Pattern: <span class="lem"><font color="...">lemma</font></span>
  const lemmaMatch = bodyHTML.match(/<span class="lem"><font[^>]*>([^<]+)<\/font><\/span>/);
  const lemma = lemmaMatch ? lemmaMatch[1].trim() : '';

  // Extract primary gloss from <span class="mgP">
  const primaryMatch = bodyHTML.match(/<span class="mgP">([^<]+)/);
  const primaryGloss = primaryMatch ? primaryMatch[1].trim() : '';

  // Extract POS from <pos> tag
  const posMatch = bodyHTML.match(/<pos>([^<]+)<\/pos>/);
  const pos = posMatch ? posMatch[1].trim() : '';

  // Extract individual senses: <span class="mg1">...</span> followed by dialect <dial> tags
  // Each sense block: <span class="mg1">N </span> <span class="mg1">gloss text</span> <span class="not">...<dial dnumber="60">...</span>
  const senses: { gloss: string; dialects: string[] }[] = [];

  // Split the HTML into sense blocks by looking for mg1 spans
  // Pattern: consecutive mg1 spans followed by a "not" span with dial tags
  const sensePattern = /<span class="mg1">\d*\s*<\/span>\s*<span class="mg1">([^<]+)<\/span>\s*<span class="not"><font[^>]*>(.*?)<\/font><\/span>/gi;
  let m: RegExpExecArray | null;
  while ((m = sensePattern.exec(bodyHTML)) !== null) {
    const gloss = m[1].trim();
    const dialSection = m[2];

    // Extract dialect codes from <dial dnumber="XX"> tags
    const dialects: string[] = [];
    const dialPattern = /dnumber="(\d+)"/g;
    let dm: RegExpExecArray | null;
    while ((dm = dialPattern.exec(dialSection)) !== null) {
      dialects.push(dm[1]);
    }

    senses.push({ gloss, dialects });
  }

  if (!lemma && !primaryGloss) return null;

  // Determine if the word is Syriac-only:
  // All senses must have ONLY Syriac dialect codes (60, 65)
  const syriacOnly =
    senses.length > 0 &&
    senses.every(
      (s) =>
        s.dialects.length > 0 &&
        s.dialects.every((d) => SYRIAC_DIALECT_CODES.has(d))
    );

  return {
    lemma,
    gloss: primaryGloss,
    pos,
    syriacOnly,
    senses,
  };
}

// ── In-memory lexicon cache (survives across chapters within a session) ──
const lexiconCache = new Map<string, WordGloss | null>();

function lexCacheKey(coord: string, wordIndex: number): string {
  return `${coord}:${wordIndex}`;
}

/**
 * Fetch and parse gloss data for a single word from CAL.
 * Results are cached in memory so duplicate lookups never re-fetch.
 */
export async function fetchWordGloss(
  coord: string,
  wordIndex: number
): Promise<WordGloss | null> {
  const key = lexCacheKey(coord, wordIndex);
  if (lexiconCache.has(key)) return lexiconCache.get(key)!;
  try {
    const resp = await fetch(
      `/cal-proxy/getlex.php?coord=${coord}&word=${wordIndex}`
    );
    if (!resp.ok) {
      lexiconCache.set(key, null);
      return null;
    }
    const html = await resp.text();
    const result = parseGlossHTML(html);
    lexiconCache.set(key, result);
    return result;
  } catch {
    lexiconCache.set(key, null);
    return null;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Batch-fetch glosses for unique words in a chapter.
 * Deduplicates by word text so repeated words only fetch once.
 * Throttled to 2 concurrent requests with a 300ms pause between batches
 * to be respectful to the CAL server.
 *
 * Returns a Map<wordText, WordGloss>.
 */
export async function fetchChapterGlosses(
  words: { text: string; coord: string; wordIndex: number }[],
  onProgress?: (done: number, total: number) => void
): Promise<Map<string, WordGloss>> {
  const concurrency = 2;
  const batchDelay = 300; // ms between batches

  // Deduplicate by word text, keeping first occurrence
  const unique = new Map<string, { coord: string; wordIndex: number }>();
  for (const w of words) {
    if (!unique.has(w.text)) {
      unique.set(w.text, { coord: w.coord, wordIndex: w.wordIndex });
    }
  }

  const entries = [...unique.entries()];
  const results = new Map<string, WordGloss>();
  let done = 0;

  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency);
    const promises = batch.map(async ([text, { coord, wordIndex }]) => {
      const gloss = await fetchWordGloss(coord, wordIndex);
      if (gloss) {
        results.set(text, gloss);
      }
      done++;
      onProgress?.(done, entries.length);
    });
    await Promise.all(promises);

    // Polite pause between batches (skip after last batch)
    if (i + concurrency < entries.length) {
      await delay(batchDelay);
    }
  }

  return results;
}
