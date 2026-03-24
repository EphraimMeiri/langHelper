import type { CALChapter, CALVerse, CALWord } from '../types/cal-reader';

/**
 * Fetch a CAL chapter via the dev proxy and parse the HTML into structured data.
 */
export async function fetchCALChapter(
  fileCode: string,
  chapter: number,
  cset = 'S'
): Promise<CALChapter> {
  const url = `/cal-proxy/get_a_chapter.php?file=${fileCode}&sub=${chapter}&cset=${cset}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch CAL chapter: ${resp.status}`);
  const html = await resp.text();
  return parseCALHTML(html, fileCode, chapter, cset);
}

/**
 * Parse the raw HTML from a CAL chapter page into structured data.
 *
 * CAL page structure:
 * - Text is in a <table> inside a <div align="right"><span class="syr">
 * - Each verse is a <tr> with two <td>s:
 *   1. Verse reference in <BDO dir="rtl"> (displayed reversed, e.g. " 10:51" = 15:01)
 *      Optionally wrapped in a comment link <a href="comment.php?coord=...">
 *   2. Word links: <a href="getlex.php?coord=...&word=...">ܣyriac text</a>
 * - Navigation: "previous chapter" / "next chapter" links
 */
export function parseCALHTML(
  html: string,
  fileCode: string,
  chapter: number,
  cset: string
): CALChapter {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Extract text name from the file info line (e.g. "62002: P Ex")
  const bodyText = doc.body?.textContent || '';
  const fileInfoMatch = bodyText.match(new RegExp(`${fileCode}:\\s*(.+?)\\s*(?:click|$)`, 'm'));
  const title = fileInfoMatch ? fileInfoMatch[1].trim() : doc.title || `Text ${fileCode}`;

  // Find prev/next chapter links
  let prevChapter: number | null = null;
  let nextChapter: number | null = null;
  const links = doc.querySelectorAll('a');
  for (const link of links) {
    const href = link.getAttribute('href') || '';
    if (href.includes('get_a_chapter.php') && href.includes(`file=${fileCode}`)) {
      const subMatch = href.match(/sub=(\d+)/);
      if (subMatch) {
        const sub = parseInt(subMatch[1], 10);
        const text = link.textContent?.trim().toLowerCase() || '';
        if (text.includes('prev')) {
          prevChapter = sub;
        } else if (text.includes('next')) {
          nextChapter = sub;
        }
      }
    }
  }

  const verses: CALVerse[] = [];

  // Find the main text table inside <div align="right">
  const textDiv = doc.querySelector('div[align="right"]');
  if (!textDiv) {
    return { title, fileCode, chapter, cset, verses, prevChapter, nextChapter };
  }

  const rows = textDiv.querySelectorAll('tr');
  for (const row of rows) {
    const cells = row.querySelectorAll('td');
    if (cells.length < 2) continue;

    const refCell = cells[0];
    const wordCell = cells[1];

    // Extract verse reference from <BDO dir="rtl"> — text is displayed reversed
    // e.g. " 10:51" is actually chapter 15 verse 01
    const bdo = refCell.querySelector('bdo');
    let verseNum = '';
    if (bdo) {
      const bdoText = bdo.textContent?.trim() || '';
      // The BDO text is the verse:chapter reversed, e.g. "10:51" = 15:01
      // Parse the coordinate from the getlex links instead for accuracy
      const firstWordLink = wordCell.querySelector('a[href*="getlex.php"]');
      if (firstWordLink) {
        const coordMatch = firstWordLink.getAttribute('href')?.match(/coord=(\d+)/);
        if (coordMatch) {
          const coord = coordMatch[1];
          // Coordinate format: fileCode(5) + chapter(2) + verse(2)
          // e.g. 620021501 = file 62002, chapter 15, verse 01
          const verseCode = coord.slice(-2);
          verseNum = `${chapter}:${parseInt(verseCode, 10)}`;
        }
      }
      if (!verseNum) {
        // Fallback: reverse the BDO text
        verseNum = bdoText;
      }
    }

    // Extract comment coord
    const commentLink = refCell.querySelector('a[href*="comment.php"]');
    const commentCoord = commentLink?.getAttribute('href')?.match(/coord=(\d+)/)?.[1] || '';

    // Extract words
    const wordLinks = wordCell.querySelectorAll('a[href*="getlex.php"]');
    const words: CALWord[] = [];
    for (const wl of wordLinks) {
      const href = wl.getAttribute('href') || '';
      const coordMatch = href.match(/coord=(\d+)/);
      const wordMatch = href.match(/word=(\d+)/);
      const text = wl.textContent?.trim() || '';
      if (coordMatch && wordMatch && text) {
        words.push({
          coord: coordMatch[1],
          wordIndex: parseInt(wordMatch[1], 10),
          text,
        });
      }
    }

    if (words.length > 0) {
      verses.push({ ref: verseNum, words, commentCoord });
    }
  }

  return { title, fileCode, chapter, cset, verses, prevChapter, nextChapter };
}
