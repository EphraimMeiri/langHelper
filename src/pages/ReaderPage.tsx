import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '../components/layout/Header';
import { useCALReaderStore } from '../stores/calReaderStore';
import { useSettingsStore, getFontSizeClass } from '../stores/settingsStore';
import { CAL_TEXTS, searchTexts, findText, getTextsByGroup } from '../utils/calTextCatalog';
import { getCacheStats, clearCache } from '../utils/calCache';
import type { CALWord, CALTextInfo, CALWordGloss } from '../types/cal-reader';

// Session-level cache for lexicon HTML to avoid re-fetching on repeated clicks
const lexiconHTMLCache = new Map<string, string>();

export function ReaderPage() {
  const {
    chapter,
    fileCode,
    chapterNum,
    isLoading,
    error,
    fromCache,
    glossProgress,
    showGlosses,
    selectedWordCoord,
    selectedWordText,
    loadChapter,
    goToNextChapter,
    goToPrevChapter,
    fetchGlosses,
    fetchVerseGlosses,
    setShowGlosses,
    selectWord,
    clearWordSelection,
    bookmarks,
    addBookmark,
    removeBookmark,
  } = useCALReaderStore();

  const fontSize = useSettingsStore((s) => s.fontSize);
  const fontClass = getFontSizeClass(fontSize);

  const [chapterInput, setChapterInput] = useState(String(chapterNum));
  const [lexiconHTML, setLexiconHTML] = useState<string | null>(null);
  const [lexiconLoading, setLexiconLoading] = useState(false);

  // Load chapter on mount if nothing loaded
  useEffect(() => {
    if (!chapter && !isLoading) {
      loadChapter(fileCode, chapterNum);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync chapter input when navigating
  useEffect(() => {
    setChapterInput(String(chapterNum));
  }, [chapterNum]);

  const handleGo = useCallback(() => {
    const ch = parseInt(chapterInput, 10);
    if (ch > 0) {
      loadChapter(fileCode, ch);
    }
  }, [fileCode, chapterInput, loadChapter]);

  const handleChapterKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleGo();
    },
    [handleGo]
  );

  const handleSelectText = useCallback(
    (text: CALTextInfo) => {
      loadChapter(text.fileCode, 1);
    },
    [loadChapter]
  );

  // Fetch lexicon entry for a word (with session cache)
  const handleWordClick = useCallback(
    async (word: CALWord) => {
      selectWord(word.coord, word.text);
      const cacheKey = `${word.coord}:${word.wordIndex}`;
      const cached = lexiconHTMLCache.get(cacheKey);
      if (cached) {
        setLexiconHTML(cached);
        return;
      }
      setLexiconLoading(true);
      setLexiconHTML(null);
      try {
        const resp = await fetch(
          `/cal-proxy/getlex.php?coord=${word.coord}&word=${word.wordIndex}`
        );
        if (resp.ok) {
          const html = await resp.text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const links = doc.querySelectorAll('a[href]');
          for (const link of links) {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('/')) {
              link.setAttribute('href', `/cal-proxy/${href}`);
            }
          }
          const result = doc.body?.innerHTML || '<p>No content</p>';
          lexiconHTMLCache.set(cacheKey, result);
          setLexiconHTML(result);
        } else {
          setLexiconHTML('<p>Failed to load lexicon entry.</p>');
        }
      } catch {
        setLexiconHTML('<p>Error loading lexicon entry.</p>');
      } finally {
        setLexiconLoading(false);
      }
    },
    [selectWord]
  );

  const currentTextInfo = findText(fileCode);
  const isBookmarked = bookmarks.some(
    (b) => b.fileCode === fileCode && b.chapter === chapterNum
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Reader"
        subtitle={
          chapter
            ? `${currentTextInfo?.name || `Text ${fileCode}`} — Chapter ${chapterNum}`
            : 'CAL Text Reader'
        }
      />

      {/* Controls bar */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex flex-wrap items-center gap-3">
        {/* Searchable text picker */}
        <TextPicker
          currentFileCode={fileCode}
          onSelect={handleSelectText}
        />

        {/* Chapter input */}
        <div className="flex items-center gap-1">
          <label className="text-sm text-gray-600 dark:text-gray-400">Ch.</label>
          <input
            type="number"
            value={chapterInput}
            onChange={(e) => setChapterInput(e.target.value)}
            onKeyDown={handleChapterKeyDown}
            min={1}
            className="w-16 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-center"
          />
        </div>

        <button
          onClick={handleGo}
          disabled={isLoading}
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Go
        </button>

        {/* Nav arrows */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={goToPrevChapter}
            disabled={isLoading || !chapter?.prevChapter}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
            title="Previous chapter"
          >
            &larr; Prev
          </button>
          <button
            onClick={goToNextChapter}
            disabled={isLoading || !chapter?.nextChapter}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
            title="Next chapter"
          >
            Next &rarr;
          </button>
        </div>

        {/* Cache indicator */}
        {fromCache && (
          <span className="text-xs text-green-600 dark:text-green-400" title="Loaded from local cache">
            cached
          </span>
        )}

        {/* Gloss controls */}
        {chapter && (
          <div className="flex items-center gap-2">
            {!chapter.glosses ? (
              <button
                onClick={fetchGlosses}
                disabled={glossProgress !== null}
                className="px-3 py-1.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 disabled:opacity-50 transition-colors"
                title="Fetch English glosses for Syriac-specific words (makes requests to CAL)"
              >
                {glossProgress
                  ? `Glossing ${glossProgress[0]}/${glossProgress[1]}...`
                  : 'Fetch glosses'}
              </button>
            ) : (
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGlosses}
                  onChange={(e) => setShowGlosses(e.target.checked)}
                  className="w-3 h-3"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Syriac-only glosses
                </span>
              </label>
            )}
          </div>
        )}

        {/* Bookmark */}
        {chapter && (
          <button
            onClick={() => {
              if (isBookmarked) {
                removeBookmark(fileCode, chapterNum);
              } else {
                addBookmark(
                  `${currentTextInfo?.abbreviation || fileCode} ${chapterNum}`
                );
              }
            }}
            className={`ml-auto px-3 py-1.5 text-sm rounded-lg transition-colors ${
              isBookmarked
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this chapter'}
          >
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Text pane */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading && (
            <div className="text-gray-500 dark:text-gray-400 py-8 text-center">
              Loading chapter...
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg p-4 mb-4">
              {error}
            </div>
          )}

          {chapter && !isLoading && (
            <div className="space-y-4 max-w-4xl mx-auto">
              {chapter.verses.map((verse) => {
                // Does this verse have all its words glossed already?
                const verseFullyGlossed = chapter.glosses &&
                  verse.words.every((w) => w.text in chapter.glosses!);

                return (
                  <div key={verse.ref} className="flex gap-3 items-start">
                    <div className="flex flex-col items-end min-w-[3rem] shrink-0 pt-1">
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-mono select-none">
                        {verse.ref}
                      </span>
                      {showGlosses && !verseFullyGlossed && glossProgress === null && (
                        <button
                          onClick={() => fetchVerseGlosses(verse.ref)}
                          className="text-[0.6rem] text-amber-500 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 mt-0.5 leading-none"
                          title="Fetch glosses for this verse"
                        >
                          gloss
                        </button>
                      )}
                    </div>
                    <p
                      className={`font-syriac ${fontClass} leading-relaxed flex-1`}
                      dir="rtl"
                    >
                      {verse.words.map((word, idx) => {
                        const gloss = showGlosses && chapter.glosses?.[word.text];
                        const isSyrOnly = gloss && gloss.syriacOnly;
                        return (
                          <span key={`${word.coord}-${word.wordIndex}`}>
                            <WordSpan
                              word={word}
                              gloss={isSyrOnly ? gloss : undefined}
                              isSelected={
                                selectedWordCoord === word.coord &&
                                selectedWordText === word.text
                              }
                              onClick={handleWordClick}
                            />
                            {idx < verse.words.length - 1 && ' '}
                          </span>
                        );
                      })}
                    </p>
                  </div>
                );
              })}

              {chapter.verses.length === 0 && (
                <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No verses found in this chapter. The text may not be available or the chapter number may be invalid.
                </div>
              )}
            </div>
          )}

          {!chapter && !isLoading && !error && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <p className="mb-2">Select a text and chapter above to begin reading.</p>
              <p className="text-sm">
                Texts are loaded from the Comprehensive Aramaic Lexicon (CAL) database.
              </p>
            </div>
          )}
        </div>

        {/* Lexicon side panel */}
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Lexicon
            </h3>
            {selectedWordText && (
              <button
                onClick={clearWordSelection}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4">
            {selectedWordText && (
              <div className="mb-3 text-center">
                <span className="font-syriac text-2xl" dir="rtl">
                  {selectedWordText}
                </span>
              </div>
            )}
            {lexiconLoading && (
              <div className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">
                Loading...
              </div>
            )}
            {lexiconHTML && !lexiconLoading && (
              <div
                className="cal-lexicon-content text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: lexiconHTML }}
              />
            )}
            {!selectedWordText && !lexiconLoading && (
              <div className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
                Click a word in the text to see its lexicon entry.
              </div>
            )}
          </div>

          {/* Bookmarks */}
          {bookmarks.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Bookmarks
              </h4>
              <div className="space-y-1 max-h-32 overflow-auto">
                {bookmarks.map((b) => (
                  <button
                    key={`${b.fileCode}-${b.chapter}`}
                    onClick={() => loadChapter(b.fileCode, b.chapter)}
                    className="w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cache stats */}
          <CacheInfo />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline word with optional Syriac-only gloss
// ---------------------------------------------------------------------------
function WordSpan({
  word,
  gloss,
  isSelected,
  onClick,
}: {
  word: CALWord;
  gloss?: CALWordGloss;
  isSelected: boolean;
  onClick: (word: CALWord) => void;
}) {
  if (gloss) {
    return (
      <ruby
        onClick={() => onClick(word)}
        className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/20 ${
          isSelected ? 'bg-blue-200 dark:bg-blue-800/40' : ''
        }`}
      >
        {word.text}
        <rp>(</rp>
        <rt
          className="text-[0.5em] font-sans text-amber-700 dark:text-amber-400 font-normal leading-none"
          dir="ltr"
        >
          {gloss.gloss}
        </rt>
        <rp>)</rp>
      </ruby>
    );
  }

  return (
    <span
      onClick={() => onClick(word)}
      className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30 ${
        isSelected ? 'bg-blue-200 dark:bg-blue-800/40' : ''
      }`}
    >
      {word.text}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Searchable text picker dropdown
// ---------------------------------------------------------------------------
function TextPicker({
  currentFileCode,
  onSelect,
}: {
  currentFileCode: string;
  onSelect: (text: CALTextInfo) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentText = findText(currentFileCode);

  const filtered = useMemo(() => searchTexts(query), [query]);
  const grouped = useMemo(() => {
    if (query.trim()) return null; // flat list when searching
    return getTextsByGroup();
  }, [query]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else {
      setQuery('');
    }
  }, [open]);

  const handleSelect = (text: CALTextInfo) => {
    onSelect(text);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors min-w-[200px] text-left flex items-center justify-between gap-2"
      >
        <span className="truncate">
          {currentText ? `${currentText.name} (${currentText.abbreviation})` : currentFileCode}
        </span>
        <span className="text-gray-400 text-xs">{open ? '\u25B2' : '\u25BC'}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-96 max-h-[70vh] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 flex flex-col overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search texts by name, abbreviation, or category..."
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Results */}
          <div className="flex-1 overflow-auto">
            {query.trim() ? (
              // Flat search results
              filtered.length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No texts match "{query}"
                </div>
              ) : (
                filtered.map((t) => (
                  <TextRow
                    key={t.fileCode}
                    text={t}
                    isActive={t.fileCode === currentFileCode}
                    showGroup
                    onClick={() => handleSelect(t)}
                  />
                ))
              )
            ) : (
              // Grouped browse
              grouped && [...grouped.entries()].map(([group, texts]) => (
                <div key={group}>
                  <div className="sticky top-0 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
                    {group}
                  </div>
                  {texts.map((t) => (
                    <TextRow
                      key={t.fileCode}
                      text={t}
                      isActive={t.fileCode === currentFileCode}
                      onClick={() => handleSelect(t)}
                    />
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer count */}
          <div className="px-3 py-1.5 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
            {query.trim() ? `${filtered.length} of ` : ''}{CAL_TEXTS.length} texts
          </div>
        </div>
      )}
    </div>
  );
}

function TextRow({
  text,
  isActive,
  showGroup,
  onClick,
}: {
  text: CALTextInfo;
  isActive: boolean;
  showGroup?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-2 ${
        isActive ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-500' : ''
      }`}
    >
      <span className="text-gray-400 dark:text-gray-500 font-mono text-xs w-16 shrink-0">
        {text.fileCode}
      </span>
      <span className="truncate flex-1">
        {text.name}
      </span>
      <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
        {text.abbreviation}
      </span>
      {showGroup && (
        <span className="text-xs text-gray-300 dark:text-gray-600 truncate max-w-24">
          {text.group.split(' > ').pop()}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Cache info panel
// ---------------------------------------------------------------------------
function CacheInfo() {
  const [stats, setStats] = useState<{ count: number; sizeBytes: number } | null>(null);

  useEffect(() => {
    getCacheStats().then(setStats);
  }, []);

  if (!stats || stats.count === 0) return null;

  const sizeStr =
    stats.sizeBytes < 1024
      ? `${stats.sizeBytes} B`
      : stats.sizeBytes < 1024 * 1024
        ? `${(stats.sizeBytes / 1024).toFixed(1)} KB`
        : `${(stats.sizeBytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Cache: {stats.count} chapters ({sizeStr})
        </span>
        <button
          onClick={async () => {
            await clearCache();
            setStats({ count: 0, sizeBytes: 0 });
          }}
          className="text-xs text-red-400 hover:text-red-600 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
