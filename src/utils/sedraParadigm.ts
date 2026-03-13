export interface SedraParadigmStem {
  key: string;
  label: string;
  syriac?: string;
}

export interface SedraParadigmForm {
  stem: string;
  tense: string;
  png: string;
  form: string;
}

export interface SedraParadigm {
  lexemeId: number;
  root?: string;
  classLabel?: string;
  stems: SedraParadigmStem[];
  forms: SedraParadigmForm[];
}

const TENSE_MAP: Record<string, string> = {
  perfect: 'past',
  imperfect: 'future',
  imperative: 'imperative',
  infinitive: 'infinitive',
  'active participle': 'active-participle',
  'passive participle': 'passive-participle',
};

const PNG_MAP: Record<string, string> = {
  S3M: '3ms',
  S3F: '3fs',
  S2M: '2ms',
  S2F: '2fs',
  S1: '1s',
  P3M: '3mp',
  P3F: '3fp',
  P2M: '2mp',
  P2F: '2fp',
  P1: '1p',
};

const STEM_LABEL_MAP: Array<{ match: RegExp; key: string }> = [
  { match: /p.?al/i, key: 'peal' },
  { match: /pa.?el/i, key: 'pael' },
  { match: /aph.?el|aph.?al/i, key: 'aphel' },
  { match: /ethp.?el/i, key: 'ethpeel' },
  { match: /ethpa.?al/i, key: 'ethpaal' },
  { match: /ettaph.?al/i, key: 'ettaphal' },
  { match: /eshtaph.?al/i, key: 'eshtaphal' },
  { match: /shaph.?el|shaph.?al/i, key: 'shafel' },
];

function normalizeStemKey(label: string): string {
  for (const entry of STEM_LABEL_MAP) {
    if (entry.match.test(label)) {
      return entry.key;
    }
  }
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeTenseLabel(label: string): string {
  const normalized = label.toLowerCase().trim();
  return TENSE_MAP[normalized] || normalized;
}

function normalizePngLabel(label: string): string {
  const normalized = label.toUpperCase().trim();
  return PNG_MAP[normalized] || normalized.toLowerCase();
}

function cleanFormText(text: string): string {
  return text.replace(/\s+/g, '').replace(/\*/g, '').trim();
}

function extractStemLabel(raw: string): string {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  const parts = cleaned.split(' ');
  if (parts.length > 1 && /^[0-9]+[a-z]$/i.test(parts[0])) {
    parts.shift();
  }
  return parts.join(' ').trim();
}

export function parseSedraParadigmHtml(html: string, lexemeId: number): SedraParadigm | null {
  if (!html) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return null;

  const header = doc.querySelector('h2');
  const root = header?.querySelector('.selectableFont')?.textContent?.trim() || undefined;
  const classLabel = header?.textContent?.split('-')[1]?.trim();

  const headerCells = Array.from(table.querySelectorAll('thead tr.tableHeader th'));
  const stems: SedraParadigmStem[] = [];

  for (const cell of headerCells.slice(2)) {
    const syriac = cell.querySelector('.selectableFont')?.textContent?.trim();
    const textContent = cell.textContent || '';
    const label = extractStemLabel(textContent);
    const key = normalizeStemKey(label);
    stems.push({ key, label, syriac });
  }

  const forms: SedraParadigmForm[] = [];
  let currentTense = '';

  const rows = Array.from(table.querySelectorAll('tbody tr'));
  for (const row of rows) {
    const ths = Array.from(row.querySelectorAll('th'));
    if (ths.length === 0) continue;

    if (ths.length === 2) {
      currentTense = normalizeTenseLabel(ths[0].textContent || '');
    }

    const pngLabel = ths[ths.length - 1].textContent || '';
    const png = normalizePngLabel(pngLabel);

    const cells = Array.from(row.querySelectorAll('td'));
    for (let i = 0; i < cells.length; i++) {
      const stem = stems[i];
      if (!stem) continue;

      const formText = cleanFormText(cells[i].textContent || '');
      if (!formText || formText === '-') continue;

      forms.push({
        stem: stem.key,
        tense: currentTense,
        png,
        form: formText,
      });
    }
  }

  return {
    lexemeId,
    root,
    classLabel,
    stems,
    forms,
  };
}
