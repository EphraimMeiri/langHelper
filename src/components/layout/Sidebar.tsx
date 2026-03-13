import { NavLink } from 'react-router-dom';
import { useLanguageStore } from '../../stores/languageStore.ts';

const navItems = [
  { path: '/tables', label: 'Tables', icon: '📊' },
  { path: '/parse', label: 'Parse', icon: '🔍' },
  { path: '/dictionary', label: 'Dictionary', icon: '📖' },
  { path: '/flashcards', label: 'Flashcards', icon: '🎴' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const { languages, currentLanguageId, setCurrentLanguage, getCurrentLanguage } =
    useLanguageStore();
  const currentLang = getCurrentLanguage();

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Lang Helper
        </h1>
        {currentLang && (
          <p
            className="text-sm text-gray-500 dark:text-gray-400 mt-1"
            dir={currentLang.direction}
          >
            {currentLang.nativeName}
          </p>
        )}
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Language
        </label>
        <select
          value={currentLanguageId || ''}
          onChange={(e) => setCurrentLanguage(e.target.value)}
          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {languages.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        Hebrew • Syriac • Aramaic
      </div>
    </aside>
  );
}
