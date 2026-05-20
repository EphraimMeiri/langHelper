import { useState } from 'react';
import { ScriptInput } from '../common/ScriptInput';
import { useParsingStore } from '../../stores/parsingStore';
import { useLanguageStore } from '../../stores/languageStore';
import { useParseAction } from '../../hooks/useParseAction';

interface ParseInputProps {
  value?: string;
  onValueChange?: (v: string) => void;
}

export function ParseInput({ value: controlledValue, onValueChange }: ParseInputProps = {}) {
  const [localValue, setLocalValue] = useState('');
  const isControlled = controlledValue !== undefined;
  const inputValue = isControlled ? controlledValue! : localValue;
  const setInputValue = (v: string) => {
    if (isControlled) onValueChange?.(v);
    else setLocalValue(v);
  };

  const { getCurrentLanguage } = useLanguageStore();
  const { isLoading, history } = useParsingStore();
  const runParse = useParseAction();

  const currentLang = getCurrentLanguage();

  const handleParse = () => {
    if (!inputValue.trim()) return;
    runParse(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleParse();
    }
  };

  const handleHistoryClick = (input: string) => {
    setInputValue(input);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <ScriptInput
            value={inputValue}
            onChange={setInputValue}
            onKeyDown={handleKeyDown}
            placeholder={`Enter ${currentLang?.name || 'Syriac'} word to parse...`}
            script={currentLang?.script || 'syriac'}
            className="w-full text-2xl"
          />
        </div>
        <button
          onClick={handleParse}
          disabled={isLoading || !inputValue.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? 'Parsing...' : 'Parse'}
        </button>
      </div>

      {/* Recent history */}
      {history.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Recent:</span>
          {history.slice(0, 8).map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleHistoryClick(item.input)}
              className={`px-2 py-1 text-sm rounded border transition-colors ${
                item.success
                  ? 'border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/30'
                  : 'border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30'
              } ${
                currentLang?.script === 'syriac' ? 'font-syriac' : 'font-hebrew'
              }`}
              dir={currentLang?.direction || 'rtl'}
            >
              {item.input}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
