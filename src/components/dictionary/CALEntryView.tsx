import { useState, useMemo } from 'react';
import type { DictRefs, CALMeaning } from '../../types/cal-dictionary';
import { useCALDictionaryStore } from '../../stores/calDictionaryStore';
import { useDictionaryStore } from '../../stores/dictionaryStore';
import { usePdfNavigationStore } from '../../stores/pdfNavigationStore';
import { parseDictRef } from '../../utils/parseDictRef';
import { DictRefConfigModal } from './DictRefConfigModal';

/** Full names for dictionary abbreviation keys */
const DICT_LABELS: Record<keyof DictRefs, string> = {
  ls2: 'Brockelmann (LS2)',
  ps: 'Payne-Smith (Thesaurus)',
  jps: 'J. Payne-Smith (Compendious)',
  djpa: 'Sokoloff (DJPA)',
  djba: 'Sokoloff (DJBA)',
  md: 'Mandaic Dict.',
  jastrow: 'Jastrow',
  levy: 'Levy',
  tal: 'Tal',
  audo: 'Audo',
  bb: 'Bar Bahlul',
  ba: 'Bar Ali',
  dnwsi: 'DNWSI',
  diso: 'DISO',
  schult: 'Schulthess',
  dja: 'DJA',
  qumran: 'Qumran',
};

const DIALECT_COLORS: Record<string, string> = {
  '60': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  '65': 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  '00': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

function getDialectColor(code: string): string {
  return DIALECT_COLORS[code] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
}

/** Render CAL markup (inline <aram>, <syr>, <cpa>, <i>, <b>) to displayable JSX */
function renderMarkup(text: string): string {
  if (!text) return '';
  // Convert CAL-specific tags to styled spans
  let html = text
    .replace(/<aram>(.*?)<\/aram>/gi, '<span class="font-hebrew" dir="rtl">$1</span>')
    .replace(/<syr>(.*?)<\/syr>/gi, '<span class="font-syriac" dir="rtl">$1</span>')
    .replace(/<cpa>(.*?)<\/cpa>/gi, '<span class="font-hebrew" dir="rtl">$1</span>')
    .replace(/<mand>(.*?)<\/mand>/gi, '<span class="font-hebrew" dir="rtl">$1</span>');
  return html;
}

function MeaningBlock({ meaning }: { meaning: CALMeaning }) {
  return (
    <div className="py-2">
      <div className="flex items-start gap-2">
        {meaning.sense && (
          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-0.5 min-w-[1.5rem]">
            {meaning.sense}.
          </span>
        )}
        <div className="flex-1">
          {/* Dialect badges */}
          <div className="flex flex-wrap gap-1 mb-1">
            {meaning.dialect_names.map((name, i) => (
              <span
                key={i}
                className={`text-xs px-1.5 py-0.5 rounded ${getDialectColor(meaning.dialect_codes[i])}`}
              >
                {name}
              </span>
            ))}
          </div>
          {/* Gloss */}
          <div
            className="text-sm text-gray-800 dark:text-gray-200"
            dangerouslySetInnerHTML={{ __html: renderMarkup(meaning.gloss) }}
          />
          {/* Citations */}
          {meaning.citations.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {meaning.citations.map((cit) => (
                <div
                  key={cit.citation_id}
                  className="text-xs text-gray-500 dark:text-gray-400 pl-3 border-l-2 border-gray-200 dark:border-gray-700"
                >
                  {cit.reference && (
                    <span className="font-medium text-gray-600 dark:text-gray-300 mr-1">
                      {cit.reference}
                    </span>
                  )}
                  {cit.aramaic_hebrew && (
                    <span className="font-hebrew" dir="rtl">
                      {cit.aramaic_hebrew}
                    </span>
                  )}
                  {cit.translation && (
                    <span className="ml-1 italic">{cit.translation}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DictRefsSection({ refs }: { refs: DictRefs }) {
  const dictionaries = useDictionaryStore((s) => s.dictionaries);
  const requestNavigation = usePdfNavigationStore((s) => s.requestNavigation);
  const [showConfig, setShowConfig] = useState(false);

  const entries = Object.entries(refs).filter(
    ([, val]) => val && val.trim()
  ) as [keyof DictRefs, string][];

  // Build lookup: calDictKey → Dictionary
  const pdfByCalKey = useMemo(() => {
    const map = new Map<string, { id: string; pageOffset: number; pageCount: number }>();
    for (const d of dictionaries) {
      if (d.calDictKey) {
        map.set(d.calDictKey, { id: d.id, pageOffset: d.pageOffset ?? 0, pageCount: d.pageCount });
      }
    }
    return map;
  }, [dictionaries]);

  const handleRefClick = (calKey: string, refValue: string) => {
    const dict = pdfByCalKey.get(calKey);
    if (!dict) return;
    const page = parseDictRef(calKey, refValue);
    if (page === null) return;
    const pdfPage = Math.max(1, page + dict.pageOffset);
    const clampedPage = dict.pageCount > 0 ? Math.min(pdfPage, dict.pageCount) : pdfPage;
    requestNavigation(dict.id, clampedPage);
  };

  if (entries.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Dictionary References
        </h4>
        <button
          onClick={() => setShowConfig(true)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs px-1"
          title="Configure PDF links"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {entries.map(([key, val]) => {
          const dict = pdfByCalKey.get(key);
          const parsedPage = dict ? parseDictRef(key, val) : null;
          const hasLink = dict && parsedPage !== null;
          return (
            <div key={key} className="flex items-baseline gap-1.5 text-xs">
              <span className="font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {DICT_LABELS[key] || key}:
              </span>
              {hasLink ? (
                <button
                  onClick={() => handleRefClick(key, val)}
                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  title={`Open in PDF viewer (p.${parsedPage})`}
                >
                  {val}
                </button>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">{val}</span>
              )}
            </div>
          );
        })}
      </div>
      {showConfig && <DictRefConfigModal onClose={() => setShowConfig(false)} />}
    </div>
  );
}

function RelatedSection({ related }: { related: string[] }) {
  const { search } = useCALDictionaryStore();

  if (!related.length) return null;

  return (
    <div className="mt-3">
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
        Related Entries
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {related.map((lemma) => (
          <button
            key={lemma}
            onClick={() => search(lemma.replace(/\s+[A-Z].*$/, ''))}
            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            {lemma}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CALEntryView() {
  const { selectedEntry, isLoading, clearSelection, syriacOnly } = useCALDictionaryStore();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-gray-500 dark:text-gray-400">
        Loading entry...
      </div>
    );
  }

  if (!selectedEntry) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
        <p>Select an entry from the search results to view details.</p>
      </div>
    );
  }

  const entry = selectedEntry;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 overflow-auto max-h-[calc(100vh-160px)]">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          {/* Syriac headword */}
          {entry.lemma_syriac && (
            <h2 className="font-syriac text-3xl leading-tight" dir="rtl">
              {entry.lemma_syriac}
            </h2>
          )}
          {/* Hebrew + CAL */}
          <div className="flex items-center gap-3 mt-1">
            {entry.lemma_hebrew_word && (
              <span className="font-hebrew text-lg text-gray-600 dark:text-gray-400" dir="rtl">
                {entry.lemma_hebrew_word}
              </span>
            )}
            <span className="text-sm text-gray-400 dark:text-gray-500 font-mono">
              {entry.lemma_display}
            </span>
            {entry.pos && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                {entry.pos}
              </span>
            )}
          </div>
          {/* Formal/vocalized shapes */}
          {(entry.formal_shape || entry.vocalized_shape) && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {entry.formal_shape && <span>{entry.formal_shape}</span>}
              {entry.formal_shape && entry.vocalized_shape && <span> / </span>}
              {entry.vocalized_shape && <span>{entry.vocalized_shape}</span>}
            </div>
          )}
        </div>
        <button
          onClick={clearSelection}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg px-2"
          title="Close"
        >
          &times;
        </button>
      </div>

      {/* Primary gloss */}
      <div className="text-base font-medium text-gray-800 dark:text-gray-200 mb-3">
        {entry.primary_gloss}
      </div>

      {/* Form section */}
      {entry.form_section && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
          <span className="font-semibold text-xs uppercase text-gray-500 dark:text-gray-400">
            Forms:{' '}
          </span>
          <span dangerouslySetInnerHTML={{ __html: renderMarkup(entry.form_section) }} />
        </div>
      )}

      {/* Meanings — filter to Syriac dialects when syriacOnly is on */}
      {(() => {
        const meanings = syriacOnly
          ? entry.meanings.filter((m) =>
              m.dialect_codes.some((c) => c === '60' || c === '65')
            )
          : entry.meanings;
        return meanings.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {meanings.map((m) => (
              <MeaningBlock key={m.gloss_id} meaning={m} />
            ))}
          </div>
        ) : null;
      })()}

      {/* End notes */}
      {entry.end_notes && (
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
          <span className="font-semibold text-xs uppercase text-gray-500 dark:text-gray-400">
            Notes:{' '}
          </span>
          <span dangerouslySetInnerHTML={{ __html: renderMarkup(entry.end_notes) }} />
        </div>
      )}

      {/* Cross-reference (xref from original data) */}
      {entry.xref && (
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-xs">See also:</span>{' '}
          <span className="text-blue-600 dark:text-blue-400">{entry.xref}</span>
        </div>
      )}

      {/* Dictionary references */}
      <DictRefsSection refs={entry.dict_refs} />

      {/* Related entries */}
      <RelatedSection related={entry.related} />

      {/* Vocalizations (from ol_extra) */}
      {entry.vocalizations && Object.keys(entry.vocalizations).length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Vocalizations
          </h4>
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
            {Object.entries(entry.vocalizations).map(([key, val]) => (
              <div key={key}>
                <span className="font-medium">{key}:</span> {val}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
