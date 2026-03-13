/**
 * Parse a CAL dictionary reference string into a PDF page number.
 * Returns null if the reference cannot be parsed into a page.
 *
 * Reference format patterns:
 *   Simple number:      "429"           → 429         (ps, dnwsi, diso, qumran, jastrow)
 *   Page + suffix:      "552a", "357f"  → 552, 357    (djpa, djba, md, tal, dja, jps)
 *   Page[column]:       "1150[554]"     → 1150        (ls2, schult)
 *   Volume:page:        "1:397"         → 397         (levy, audo)
 *   Page:line:          "1030:20"       → 1030        (bb, ba)
 *   Prefix + number:    "S 338"         → 338         (ps supplement)
 *   Multiple refs (;):  "752:1; 895:2"  → 752         (first ref only)
 */
export function parseDictRef(calDictKey: string, refValue: string): number | null {
  if (!refValue || !refValue.trim()) return null;

  const trimmed = refValue.trim();

  // Handle multiple refs separated by ';' — take the first one
  const firstRef = trimmed.split(';')[0].trim();

  // Skip clearly non-numeric text references (e.g., "cited in PS", "see also...")
  // but allow prefix patterns like "S 338"
  if (/^[a-zA-Z]{2,}/.test(firstRef) && !/^[A-Za-z]\s+\d/.test(firstRef)) {
    return null;
  }

  // Format: "S 338" or similar prefix + space + number
  const prefixMatch = firstRef.match(/^[A-Za-z]+\s+(\d+)/);
  if (prefixMatch) {
    return parseInt(prefixMatch[1], 10);
  }

  // Format: contains ':' — either volume:page or page:line
  if (firstRef.includes(':')) {
    const parts = firstRef.split(':');
    if (['levy', 'audo'].includes(calDictKey)) {
      // volume:page — take the last numeric part
      const pagePart = parts[parts.length - 1].replace(/[^0-9]/g, '');
      return pagePart ? parseInt(pagePart, 10) : null;
    }
    // bb, ba, and others: page:line — take the first numeric part
    const pagePart = parts[0].replace(/[^0-9]/g, '');
    return pagePart ? parseInt(pagePart, 10) : null;
  }

  // Format: page[column] — take the number before '['
  const bracketMatch = firstRef.match(/^(\d+)\[/);
  if (bracketMatch) {
    return parseInt(bracketMatch[1], 10);
  }

  // Format: page + optional letter suffix ("552a", "100b", "357f")
  const pageSuffixMatch = firstRef.match(/^(\d+)[a-zA-Z]?$/);
  if (pageSuffixMatch) {
    return parseInt(pageSuffixMatch[1], 10);
  }

  // Last resort: extract any leading number
  const leadingNum = firstRef.match(/^(\d+)/);
  return leadingNum ? parseInt(leadingNum[1], 10) : null;
}
