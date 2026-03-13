import { useRef, useState } from 'react';
import { Header } from '../components/layout/Header.tsx';
import { TransliterationEditor } from '../components/settings/TransliterationEditor.tsx';
import {
  useSettingsStore,
  type SyriacFont,
  type HebrewFont,
  type FontSize,
} from '../stores/settingsStore.ts';

const SYRIAC_FONTS: { value: SyriacFont; label: string; sample: string }[] = [
  { value: 'estrangela', label: 'Estrangela', sample: 'ܐܒܓܕܗܘܙܚܛܝܟܠ' },
  { value: 'serto', label: 'Serto (Western)', sample: 'ܐܒܓܕܗܘܙܚܛܝܟܠ' },
  { value: 'east-syriac', label: 'East Syriac (Madnhaya)', sample: 'ܐܒܓܕܗܘܙܚܛܝܟܠ' },
];

const HEBREW_FONTS: { value: HebrewFont; label: string; sample: string }[] = [
  { value: 'default', label: 'Noto Sans Hebrew', sample: 'אבגדהוזחטיכל' },
  { value: 'frank-ruehl', label: 'Frank Ruehl', sample: 'אבגדהוזחטיכל' },
  { value: 'david', label: 'David', sample: 'אבגדהוזחטיכל' },
];

const FONT_SIZES: { value: FontSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'Extra Large' },
];

export function SettingsPage() {
  const {
    syriacFont,
    hebrewFont,
    fontSize,
    showVowels,
    showSegmentColors,
    darkMode,
    keyboardDefaultOpen,
    syriacVocalization,
    setSyriacFont,
    setHebrewFont,
    setFontSize,
    setShowVowels,
    setShowSegmentColors,
    setDarkMode,
    setKeyboardDefaultOpen,
    setSyriacVocalization,
  } = useSettingsStore();

  const [dataMessage, setDataMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportAll = () => {
    try {
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: localStorage.getItem('lang-helper-settings'),
        tables: localStorage.getItem('lang-helper-tables'),
        flashcards: localStorage.getItem('lang-helper-flashcards'),
        parsing: localStorage.getItem('lang-helper-parsing'),
        transliteration: localStorage.getItem('lang-helper-transliteration'),
        language: localStorage.getItem('lang-helper-language'),
        dictionaries: localStorage.getItem('lang-helper-dictionaries'),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lang-helper-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setDataMessage({ type: 'success', text: 'Data exported successfully.' });
    } catch {
      setDataMessage({ type: 'error', text: 'Failed to export data.' });
    }
  };

  const handleImportData = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.version || !data.exportedAt) {
          setDataMessage({ type: 'error', text: 'Invalid backup file format.' });
          return;
        }

        const storeKeys = ['settings', 'tables', 'flashcards', 'parsing', 'transliteration', 'language', 'dictionaries'] as const;
        for (const key of storeKeys) {
          const storeKey = `lang-helper-${key}`;
          if (data[key]) {
            localStorage.setItem(storeKey, typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]));
          }
        }

        setDataMessage({ type: 'success', text: 'Data imported successfully. Reloading...' });
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        setDataMessage({ type: 'error', text: 'Failed to parse backup file.' });
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be selected again
    e.target.value = '';
  };

  const handleClearAll = () => {
    if (!confirm('Are you sure you want to clear ALL data? This includes tables, flashcard progress, parsing rules, and settings. This cannot be undone.')) {
      return;
    }
    if (!confirm('This is your last chance. All data will be permanently deleted. Continue?')) {
      return;
    }

    const storeKeys = [
      'lang-helper-settings',
      'lang-helper-tables',
      'lang-helper-flashcards',
      'lang-helper-parsing',
      'lang-helper-transliteration',
      'lang-helper-language',
      'lang-helper-dictionaries',
    ];
    for (const key of storeKeys) {
      localStorage.removeItem(key);
    }

    setDataMessage({ type: 'success', text: 'All data cleared. Reloading...' });
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Settings" subtitle="Customize fonts and display options" />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Syriac Font */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Syriac Font
            </h3>
            <div className="space-y-3">
              {SYRIAC_FONTS.map((font) => (
                <label
                  key={font.value}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    syriacFont === font.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="syriacFont"
                      value={font.value}
                      checked={syriacFont === font.value}
                      onChange={() => setSyriacFont(font.value)}
                      className="text-blue-600"
                    />
                    <span className="font-medium">{font.label}</span>
                  </div>
                  <span
                    className={`text-2xl ${
                      font.value === 'estrangela'
                        ? 'font-syriac-estrangela'
                        : font.value === 'serto'
                        ? 'font-syriac-serto'
                        : 'font-syriac-east'
                    }`}
                    dir="rtl"
                  >
                    {font.sample}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Hebrew Font */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Hebrew Font
            </h3>
            <div className="space-y-3">
              {HEBREW_FONTS.map((font) => (
                <label
                  key={font.value}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    hebrewFont === font.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="hebrewFont"
                      value={font.value}
                      checked={hebrewFont === font.value}
                      onChange={() => setHebrewFont(font.value)}
                      className="text-blue-600"
                    />
                    <span className="font-medium">{font.label}</span>
                  </div>
                  <span
                    className="text-2xl font-hebrew"
                    dir="rtl"
                    style={{
                      fontFamily:
                        font.value === 'default'
                          ? "'Noto Sans Hebrew', serif"
                          : font.value === 'frank-ruehl'
                          ? "'Frank Ruehl CLM', 'Noto Sans Hebrew', serif"
                          : "'David CLM', 'David', 'Noto Sans Hebrew', serif",
                    }}
                  >
                    {font.sample}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Font Size
            </h3>
            <div className="flex gap-2">
              {FONT_SIZES.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setFontSize(size.value)}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    fontSize === size.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
              <p
                className={`font-syriac ${
                  fontSize === 'small'
                    ? 'text-lg'
                    : fontSize === 'medium'
                    ? 'text-xl'
                    : fontSize === 'large'
                    ? 'text-2xl'
                    : 'text-3xl'
                }`}
                dir="rtl"
              >
                ܩܛܰܠ - ܢܶܩܛܽܘܠ - ܩܳܛܶܠ
              </p>
            </div>
          </div>

          {/* Display Options */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Display Options
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="font-medium">Syriac vowel style</span>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="syriacVocalization"
                      value="western"
                      checked={syriacVocalization === 'western'}
                      onChange={() => setSyriacVocalization('western')}
                    />
                    <span>Western (Serto)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="syriacVocalization"
                      value="eastern"
                      checked={syriacVocalization === 'eastern'}
                      onChange={() => setSyriacVocalization('eastern')}
                    />
                    <span>Eastern (Madnhaya)</span>
                  </label>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Convert vowels to match the selected Syriac vocalization system.
                </p>
              </div>

              <label className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Show vowel marks</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Display diacritical vowel marks on verb forms
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showVowels}
                  onChange={(e) => setShowVowels(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Show segment colors</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Color-code root letters, prefixes, and suffixes
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showSegmentColors}
                  onChange={(e) => setShowSegmentColors(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Open keyboard by default</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Automatically show on-screen keyboard when focusing input fields
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={keyboardDefaultOpen}
                  onChange={(e) => setKeyboardDefaultOpen(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </label>
            </div>
          </div>

          {/* Transliteration Mappings */}
          <TransliterationEditor />

          {/* Theme */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Theme
            </h3>
            <div className="flex gap-2">
              {(['system', 'light', 'dark'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setDarkMode(mode)}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    darkMode === mode
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark'}
                </button>
              ))}
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Data Management
            </h3>
            {dataMessage && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                dataMessage.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}>
                {dataMessage.text}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileSelected}
            />
            <div className="space-y-3">
              <button
                onClick={handleExportAll}
                className="w-full py-2 px-4 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="font-medium">Export all data</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Download all tables, settings, and progress as JSON
                </p>
              </button>
              <button
                onClick={handleImportData}
                className="w-full py-2 px-4 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="font-medium">Import data</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Restore from a previously exported JSON file
                </p>
              </button>
              <button
                onClick={handleClearAll}
                className="w-full py-2 px-4 text-left bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
              >
                <span className="font-medium">Clear all data</span>
                <p className="text-sm text-red-500 dark:text-red-400">
                  Remove all saved tables, progress, and settings
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
