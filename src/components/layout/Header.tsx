import { useLanguageStore } from '../../stores/languageStore.ts';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const currentLang = useLanguageStore((s) => s.getCurrentLanguage());

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {currentLang && (
          <div
            className="text-right"
            dir={currentLang.direction}
          >
            <span
              className={`text-2xl ${
                currentLang.script === 'syriac' ? 'font-syriac' : 'font-hebrew'
              }`}
            >
              {currentLang.nativeName}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
