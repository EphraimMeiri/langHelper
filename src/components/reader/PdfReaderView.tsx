import { useCallback, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ParseInput } from '../parsing/ParseInput';
import { StepByStepView } from '../parsing/StepByStepView';
import { useParseAction } from '../../hooks/useParseAction';
import { useParsingStore } from '../../stores/parsingStore';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2];

// Escape a string for safe injection into HTML attributes / text
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Wrap each whitespace-separated word in str with a clickable span. Returns HTML.
function wrapWords(str: string): string {
  if (!str) return str;
  // Keep whitespace runs as-is, wrap word runs.
  return str.replace(/(\S+)/g, (m) => {
    const safe = escapeHtml(m);
    return `<span class="pdf-word" data-word="${safe}">${safe}</span>`;
  });
}

export function PdfReaderView() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [zoomIndex, setZoomIndex] = useState(2);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const runParse = useParseAction();
  const isLoadingParse = useParsingStore((s) => s.isLoading);

  const zoom = ZOOM_STEPS[zoomIndex];

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    setFileName(file.name);
    setPageNum(1);
    setPdfError(null);
    e.target.value = '';
  };

  const handlePageContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const wordEl = target.closest('.pdf-word') as HTMLElement | null;
      if (!wordEl) return;
      const word = wordEl.getAttribute('data-word') || wordEl.textContent || '';
      // Strip surrounding punctuation
      const cleaned = word.replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, '');
      if (!cleaned) return;
      setInputValue(cleaned);
      runParse(cleaned);
    },
    [runParse]
  );

  const customTextRenderer = useCallback(
    ({ str }: { str: string; itemIndex: number }) => wrapWords(str),
    []
  );

  return (
    <div className="flex-1 overflow-hidden flex">
      {/* Left: PDF pane */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-700">
        {/* PDF toolbar */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelected}
            className="hidden"
          />
          <button
            onClick={handlePickFile}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {pdfUrl ? 'Change PDF' : 'Open PDF'}
          </button>
          {fileName && (
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[16rem]">
              {fileName}
            </span>
          )}

          {pdfUrl && numPages && (
            <>
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                  disabled={pageNum <= 1}
                  className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  &larr;
                </button>
                <input
                  type="number"
                  value={pageNum}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (n >= 1 && n <= numPages) setPageNum(n);
                  }}
                  min={1}
                  max={numPages}
                  className="w-14 px-1 py-1 text-sm text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">/ {numPages}</span>
                <button
                  onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
                  disabled={pageNum >= numPages}
                  className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  &rarr;
                </button>
              </div>

              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
                  disabled={zoomIndex <= 0}
                  className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  -
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
                  disabled={zoomIndex >= ZOOM_STEPS.length - 1}
                  className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </>
          )}

          {isLoadingParse && (
            <span className="text-xs text-blue-600 dark:text-blue-400 ml-auto">Parsing…</span>
          )}
        </div>

        {/* PDF render area */}
        <div
          className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4 flex justify-center pdf-word-layer"
          onClick={handlePageContainerClick}
        >
          {!pdfUrl && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <p className="mb-2">No PDF loaded.</p>
              <p className="text-sm">Click "Open PDF" to import a file. Click any word to parse it.</p>
            </div>
          )}

          {pdfError && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg p-4">
              {pdfError}
            </div>
          )}

          {pdfUrl && (
            <Document
              file={pdfUrl}
              onLoadSuccess={({ numPages }) => {
                setNumPages(numPages);
                setPdfError(null);
              }}
              onLoadError={(err) => setPdfError(err.message || 'Failed to load PDF')}
              loading={
                <div className="text-gray-500 dark:text-gray-400 py-8">Loading PDF…</div>
              }
            >
              <Page
                pageNumber={pageNum}
                scale={zoom}
                customTextRenderer={customTextRenderer}
                renderAnnotationLayer={false}
              />
            </Document>
          )}
        </div>
      </div>

      {/* Right: Parse pane */}
      <div className="w-[28rem] flex flex-col overflow-hidden bg-white dark:bg-gray-800">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Parse
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Click a word in the PDF, or edit and re-parse.
          </p>
        </div>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <ParseInput value={inputValue} onValueChange={setInputValue} />
        </div>
        <div className="flex-1 overflow-auto p-4">
          <StepByStepView />
        </div>
      </div>
    </div>
  );
}
