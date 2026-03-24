import { useState, useEffect, useRef } from 'react';
import type { ScriptType } from '../../types/language.ts';
import { useTransliterationStore } from '../../stores/transliterationStore.ts';
import type { TranslitMapping } from '../../utils/transliteration.ts';

interface KeyRemapDialogProps {
  char: string;
  keyName: string;
  script: ScriptType;
  keyType: 'consonants' | 'vowels';
  anchorRect: DOMRect;
  onClose: () => void;
}

export function KeyRemapDialog({
  char,
  keyName,
  script,
  keyType,
  anchorRect,
  onClose,
}: KeyRemapDialogProps) {
  const { getMappings, updateMapping, addMapping } = useTransliterationStore();

  // Find existing mapping for this char
  const mappings = getMappings(script);
  const allMappings: TranslitMapping[] = [...mappings.consonants, ...mappings.vowels];
  const existing = allMappings.find((m) => m.char === char);

  const [english, setEnglish] = useState(existing?.latin ?? '');
  const [hebrew, setHebrew] = useState(existing?.hebrewShortcut ?? '');

  const dialogRef = useRef<HTMLDivElement>(null);
  const englishRef = useRef<HTMLInputElement>(null);

  // Position the dialog near the key
  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(anchorRect.bottom + 6, window.innerHeight - 200),
    left: Math.max(4, Math.min(anchorRect.left, window.innerWidth - 260)),
    zIndex: 1000,
  };

  useEffect(() => {
    englishRef.current?.focus();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', escHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', escHandler);
    };
  }, [onClose]);

  const handleSave = () => {
    if (script !== 'syriac' && script !== 'hebrew') { onClose(); return; }

    const mappingList = keyType === 'consonants' ? mappings.consonants : mappings.vowels;
    const idx = mappingList.findIndex((m) => m.char === char);

    if (idx !== -1) {
      updateMapping(script, keyType, idx, { latin: english, hebrewShortcut: hebrew || undefined });
    } else {
      // Not yet in the list — add it
      addMapping(script, keyType, { char, name: keyName, latin: english, hebrewShortcut: hebrew || undefined });
    }
    onClose();
  };

  const fontClass = script === 'syriac' ? 'font-syriac' : 'font-hebrew';

  return (
    <div
      ref={dialogRef}
      style={style}
      className="w-60 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Remap key</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs">✕</button>
      </div>

      {/* The character being remapped */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-2xl ${fontClass} text-gray-900 dark:text-white`}>
          {char.trim() || '◌' + char}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{keyName}</span>
      </div>

      {/* English shortcut */}
      <div className="mb-2">
        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
          English shortcut
        </label>
        <input
          ref={englishRef}
          type="text"
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
          placeholder="e.g. sh, T, q"
          maxLength={4}
        />
      </div>

      {/* Hebrew shortcut */}
      <div className="mb-3">
        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
          Hebrew shortcut
        </label>
        <input
          type="text"
          value={hebrew}
          onChange={(e) => setHebrew(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          dir="rtl"
          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-hebrew focus:ring-1 focus:ring-blue-500 focus:outline-none"
          placeholder="Hebrew char or nikud"
          maxLength={2}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
        <button
          onClick={onClose}
          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
