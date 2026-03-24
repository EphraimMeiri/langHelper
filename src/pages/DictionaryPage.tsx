import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Header } from '../components/layout/Header.tsx';
import { ScriptInput } from '../components/common/ScriptInput.tsx';
import { useLanguageStore } from '../stores/languageStore.ts';
import { useDictionaryStore } from '../stores/dictionaryStore.ts';
import { usePdfNavigationStore } from '../stores/pdfNavigationStore.ts';
import { findBestPage, sortAnchors } from '../types/dictionary.ts';
import { CALSearch } from '../components/dictionary/CALSearch.tsx';
import { CALEntryView } from '../components/dictionary/CALEntryView.tsx';
import {
  hasFileSystemAccess,
  pickPdfFile,
  saveFileHandle,
  getFileHandle,
  restoreBlobUrl,
} from '../utils/pdfStorage.ts';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2];

type DictTab = 'cal' | 'pdf';

export function DictionaryPage() {
  const currentLang = useLanguageStore((s) => s.getCurrentLanguage());
  const [activeTab, setActiveTab] = useState<DictTab>('cal');
  const pendingNavigation = usePdfNavigationStore((s) => s.pendingNavigation);
  const clearNavigation = usePdfNavigationStore((s) => s.clearNavigation);
  const [navRequest, setNavRequest] = useState<{ dictionaryId: string; page: number } | null>(null);

  // Listen for navigation requests from CALEntryView
  useEffect(() => {
    if (pendingNavigation) {
      setActiveTab('pdf');
      setNavRequest({
        dictionaryId: pendingNavigation.dictionaryId,
        page: pendingNavigation.page,
      });
      clearNavigation();
    }
  }, [pendingNavigation, clearNavigation]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Dictionary"
        subtitle={activeTab === 'cal' ? 'CAL Comprehensive Aramaic Lexicon' : 'PDF dictionary lookup'}
      />

      {/* Tab bar */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('cal')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'cal'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            CAL Dictionary
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pdf'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            PDF Viewer
          </button>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'cal' ? (
        <CALDictionaryTab />
      ) : (
        <PDFDictionaryTab currentLang={currentLang} navRequest={navRequest} onNavHandled={() => setNavRequest(null)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CAL Dictionary Tab
// ---------------------------------------------------------------------------
function CALDictionaryTab() {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-1">
          <CALSearch />
        </div>
        <div className="lg:col-span-2">
          <CALEntryView />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PDF Dictionary Tab (existing functionality preserved)
// ---------------------------------------------------------------------------
interface PDFDictionaryTabProps {
  currentLang: ReturnType<typeof useLanguageStore.getState>['languages'][0] | null;
  navRequest?: { dictionaryId: string; page: number } | null;
  onNavHandled?: () => void;
}

function PDFDictionaryTab({ currentLang, navRequest, onNavHandled }: PDFDictionaryTabProps) {
  const {
    dictionaries,
    currentDictionaryId,
    pdfPathsRestored,
    setCurrentDictionary,
    addDictionary,
    removeDictionary,
    addAnchor,
    removeAnchor,
    setPageCount,
    setPdfPath,
    markPdfPathsRestored,
  } = useDictionaryStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomIndex, setZoomIndex] = useState(2);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<string | null>(null);

  const [showAddDict, setShowAddDict] = useState(false);
  const [newDictName, setNewDictName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const [pendingHandle, setPendingHandle] = useState<FileSystemFileHandle | null>(null);

  const [showAddAnchor, setShowAddAnchor] = useState(false);
  const [anchorPrefix, setAnchorPrefix] = useState('');
  const [anchorPage, setAnchorPage] = useState('');

  // Restore PDF blob URLs from stored file handles on mount
  useEffect(() => {
    if (pdfPathsRestored || !hasFileSystemAccess || dictionaries.length === 0) {
      if (!pdfPathsRestored) markPdfPathsRestored();
      return;
    }

    let cancelled = false;
    (async () => {
      for (const dict of dictionaries) {
        if (cancelled) break;
        const handle = await getFileHandle(dict.id);
        if (!handle) continue;
        const url = await restoreBlobUrl(handle);
        if (cancelled) break;
        // Clear stale blob URL if restoration failed so we don't pass a dead URL to react-pdf
        setPdfPath(dict.id, url ?? '');
      }
      if (!cancelled) markPdfPathsRestored();
    })();
    return () => { cancelled = true; };
  }, [pdfPathsRestored]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle incoming navigation request from CAL dict refs
  useEffect(() => {
    if (navRequest) {
      setCurrentDictionary(navRequest.dictionaryId);
      setCurrentPage(navRequest.page);
      setLookupResult(`CAL reference — page ${navRequest.page}`);
      onNavHandled?.();
    }
  }, [navRequest, setCurrentDictionary, onNavHandled]);

  const currentDict = useMemo(
    () => dictionaries.find((d) => d.id === currentDictionaryId) || null,
    [dictionaries, currentDictionaryId]
  );

  const langDictionaries = useMemo(
    () =>
      currentLang
        ? dictionaries.filter((d) => d.languageId === currentLang.id)
        : dictionaries,
    [dictionaries, currentLang]
  );

  const sortedAnchors = useMemo(
    () => (currentDict ? sortAnchors(currentDict.anchors) : []),
    [currentDict]
  );

  const zoom = ZOOM_STEPS[zoomIndex];

  const handleSearch = useCallback(() => {
    if (!currentDict || !searchTerm.trim()) return;
    const result = findBestPage(currentDict, searchTerm.trim());
    setCurrentPage(result.page);
    if (result.confidence === 'exact') {
      setLookupResult(`Exact match on page ${result.page}`);
    } else if (result.confidence === 'approximate') {
      setLookupResult(`Approximate match — page ${result.page}`);
    } else {
      setLookupResult(result.found ? `Estimated range — page ${result.page}` : 'No anchors matched');
    }
  }, [currentDict, searchTerm]);

  const handlePickFile = async () => {
    if (hasFileSystemAccess) {
      const result = await pickPdfFile();
      if (!result) return;
      setPendingFile(result.blobUrl);
      setPendingHandle(result.handle);
      if (!newDictName) {
        setNewDictName(result.fileName.replace(/\.pdf$/i, ''));
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPendingFile(url);
    setPendingHandle(null);
    if (!newDictName) {
      setNewDictName(file.name.replace(/\.pdf$/i, ''));
    }
    e.target.value = '';
  };

  const handleAddDictionary = async () => {
    if (!pendingFile || !currentLang) return;
    const name = newDictName.trim() || 'Dictionary';
    const id = addDictionary(name, currentLang.id, pendingFile);
    // Persist file handle for reload survival
    if (pendingHandle) {
      await saveFileHandle(id, pendingHandle);
    }
    setNewDictName('');
    setPendingFile(null);
    setPendingHandle(null);
    setShowAddDict(false);
    setCurrentPage(1);
  };

  const handleAddAnchor = () => {
    if (!currentDict || !anchorPrefix.trim() || !anchorPage) return;
    addAnchor(currentDict.id, {
      prefix: anchorPrefix.trim(),
      page: parseInt(anchorPage, 10),
    });
    setAnchorPrefix('');
    setAnchorPage('');
    setShowAddAnchor(false);
  };

  const relinkFileInputRef = useRef<HTMLInputElement>(null);

  const handleRelinkPdf = async () => {
    if (!currentDict) return;
    if (hasFileSystemAccess) {
      const result = await pickPdfFile();
      if (!result) return;
      setPdfPath(currentDict.id, result.blobUrl);
      await saveFileHandle(currentDict.id, result.handle);
      setPdfError(null);
    } else {
      relinkFileInputRef.current?.click();
    }
  };

  const handleRelinkFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentDict) return;
    setPdfPath(currentDict.id, URL.createObjectURL(file));
    setPdfError(null);
    e.target.value = '';
  };

  const handleDocumentLoadSuccess = ({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setPdfError(null);
    if (currentDict && currentDict.pageCount !== n) {
      setPageCount(currentDict.id, n);
    }
  };

  const maxPage = numPages || currentDict?.pageCount || 9999;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Left sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            {currentLang ? (
              <div className="space-y-2">
                <ScriptInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  script={currentLang.script}
                  direction={currentLang.direction}
                  placeholder="Enter root or word..."
                  showKeyboard={true}
                />
                <button
                  onClick={handleSearch}
                  disabled={!currentDict || !searchTerm.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                >
                  Look up
                </button>
                {lookupResult && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded p-2">
                    {lookupResult}
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="Select a language first"
                disabled
              />
            )}
          </div>

          {/* Dictionaries */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Available Dictionaries
            </h3>
            {langDictionaries.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                No dictionaries configured yet.
              </div>
            ) : (
              <div className="space-y-2 mb-3">
                {langDictionaries.map((dict) => (
                  <div
                    key={dict.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      dict.id === currentDictionaryId
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => {
                      setCurrentDictionary(dict.id);
                      setCurrentPage(1);
                    }}
                  >
                    <span className="text-sm font-medium truncate">{dict.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remove "${dict.name}"?`)) {
                          removeDictionary(dict.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 text-xs ml-2"
                      title="Remove"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showAddDict ? (
              <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                <input
                  type="text"
                  value={newDictName}
                  onChange={(e) => setNewDictName(e.target.value)}
                  placeholder="Dictionary name"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
                {/* Fallback file input for browsers without File System Access API */}
                {!hasFileSystemAccess && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileSelected}
                  />
                )}
                <button
                  onClick={handlePickFile}
                  className="w-full px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {pendingFile ? 'PDF selected' : 'Choose PDF file'}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddDictionary}
                    disabled={!pendingFile || !currentLang}
                    className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddDict(false);
                      setPendingFile(null);
                      setNewDictName('');
                    }}
                    className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddDict(true)}
                className="mt-2 w-full px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Add Dictionary
              </button>
            )}
          </div>

          {/* Page Anchors */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Page Anchors
            </h3>
            {!currentDict ? (
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                Select a dictionary to manage anchors.
              </div>
            ) : sortedAnchors.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                Add letter-to-page mappings to improve lookup accuracy.
              </div>
            ) : (
              <div className="space-y-1 mb-3 max-h-48 overflow-auto">
                {sortedAnchors.map((anchor) => (
                  <div
                    key={anchor.prefix}
                    className="flex items-center justify-between text-sm px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <span
                      className={currentLang?.script === 'syriac' ? 'font-syriac' : 'font-hebrew'}
                      dir={currentLang?.direction}
                    >
                      {anchor.prefix}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setCurrentPage(anchor.page);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        p.{anchor.page}
                      </button>
                      <button
                        onClick={() => removeAnchor(currentDict.id, anchor.prefix)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentDict && (
              showAddAnchor ? (
                <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex gap-2">
                    {currentLang ? (
                      <div className="flex-1">
                        <ScriptInput
                          value={anchorPrefix}
                          onChange={setAnchorPrefix}
                          script={currentLang.script}
                          direction={currentLang.direction}
                          placeholder="Letter(s)"
                          showKeyboard={false}
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={anchorPrefix}
                        onChange={(e) => setAnchorPrefix(e.target.value)}
                        placeholder="Letter(s)"
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      />
                    )}
                    <input
                      type="number"
                      value={anchorPage}
                      onChange={(e) => setAnchorPage(e.target.value)}
                      placeholder="Page"
                      min={1}
                      className="w-20 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-center"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddAnchor}
                      disabled={!anchorPrefix.trim() || !anchorPage}
                      className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddAnchor(false);
                        setAnchorPrefix('');
                        setAnchorPage('');
                      }}
                      className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Tip: You can also set the current page first, then add the anchor for the letter shown on that page.
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowAddAnchor(true);
                    setAnchorPage(String(currentPage));
                  }}
                  className="mt-2 w-full px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Add Anchor
                </button>
              )
            )}
          </div>
        </div>

        {/* PDF viewer */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col">
          {/* Toolbar */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                &larr;
              </button>
              <span className="text-sm">
                Page{' '}
                <input
                  type="number"
                  value={currentPage}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v >= 1 && v <= maxPage) setCurrentPage(v);
                  }}
                  className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-center"
                  min={1}
                  max={maxPage}
                />
                {numPages && (
                  <span className="text-gray-400 dark:text-gray-500 ml-1">/ {numPages}</span>
                )}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(maxPage, currentPage + 1))}
                disabled={currentPage >= maxPage}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                &rarr;
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomIndex(Math.max(0, zoomIndex - 1))}
                disabled={zoomIndex <= 0}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 text-sm"
              >
                Zoom &minus;
              </button>
              <span className="text-xs text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoomIndex(Math.min(ZOOM_STEPS.length - 1, zoomIndex + 1))}
                disabled={zoomIndex >= ZOOM_STEPS.length - 1}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 text-sm"
              >
                Zoom +
              </button>
            </div>
          </div>

          {/* PDF content */}
          <div className="flex-1 overflow-auto flex items-start justify-center p-4">
            {/* Hidden file input for re-linking on browsers without File System Access API */}
            <input
              ref={relinkFileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleRelinkFileSelected}
            />
            {currentDict && !pdfPathsRestored ? (
              <div className="text-gray-400 dark:text-gray-500 py-12">Restoring PDF files...</div>
            ) : currentDict && !currentDict.pdfPath ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <p className="mb-2 font-medium">PDF file needs to be re-linked</p>
                <p className="text-sm mb-4">
                  The file handle expired or permission was not granted. Re-select the same PDF file to continue.
                </p>
                <button
                  onClick={handleRelinkPdf}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Re-link PDF file
                </button>
              </div>
            ) : currentDict ? (
              <Document
                file={currentDict.pdfPath}
                onLoadSuccess={handleDocumentLoadSuccess}
                onLoadError={(error) => {
                  console.error('PDF load error:', error);
                  setPdfError('Failed to load PDF.');
                }}
                loading={
                  <div className="text-gray-400 dark:text-gray-500 py-12">Loading PDF...</div>
                }
                error={
                  <div className="text-center py-12">
                    <p className="text-red-500 mb-2">Failed to load PDF</p>
                    <p className="text-sm text-gray-500 mb-4">{pdfError}</p>
                    <button
                      onClick={handleRelinkPdf}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Re-link PDF file
                    </button>
                  </div>
                }
              >
                <Page
                  pageNumber={currentPage}
                  scale={zoom}
                  loading={
                    <div className="text-gray-400 py-8">Loading page {currentPage}...</div>
                  }
                />
              </Document>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <p className="mb-4">No PDF loaded</p>
                <p className="text-sm">
                  Add a dictionary using the panel on the left to view PDF pages here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
