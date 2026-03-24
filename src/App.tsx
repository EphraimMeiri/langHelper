import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { TablesPage } from './pages/TablesPage.tsx';
import { ParsePage } from './pages/ParsePage.tsx';
import { DictionaryPage } from './pages/DictionaryPage.tsx';
import { FlashcardsPage } from './pages/FlashcardsPage.tsx';
import { ReaderPage } from './pages/ReaderPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { useLanguageStore } from './stores/languageStore.ts';
import { useSettingsStore } from './stores/settingsStore.ts';

export default function App() {
  const { loadLanguages, isLoading, languages } = useLanguageStore();
  const darkMode = useSettingsStore((s) => s.darkMode);

  // Apply dark mode
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode === 'dark') {
      root.classList.add('dark');
    } else if (darkMode === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [darkMode]);

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">
          Loading languages...
        </div>
      </div>
    );
  }

  if (languages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Lang Helper
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No languages configured yet.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Add language configuration files to data/languages/
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/tables" replace />} />
            <Route path="/tables" element={<TablesPage />} />
            <Route path="/parse" element={<ParsePage />} />
            <Route path="/dictionary" element={<DictionaryPage />} />
            <Route path="/flashcards" element={<FlashcardsPage />} />
            <Route path="/reader" element={<ReaderPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
