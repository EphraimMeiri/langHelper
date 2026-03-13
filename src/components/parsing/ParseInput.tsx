import { useState, useCallback } from 'react';
import { ScriptInput } from '../common/ScriptInput';
import { useParsingStore } from '../../stores/parsingStore';
import { useLanguageStore } from '../../stores/languageStore';
import { useTableStore } from '../../stores/tableStore';
import { parseForm } from '../../utils/parsing/parseEngine';
import { generateRulesFromTables } from '../../utils/parsing/ruleGenerator';
import { getBuiltinRulesForLanguage } from '../../utils/parsing/builtinRules';

export function ParseInput() {
  const [inputValue, setInputValue] = useState('');
  const { getCurrentLanguage } = useLanguageStore();
  const { tables } = useTableStore();
  const {
    setInput,
    setResult,
    setLoading,
    setError,
    isLoading,
    useSedra,
    useLocalTables,
    getRuleSet,
    setRuleSet,
    addToHistory,
    history,
  } = useParsingStore();

  const currentLang = getCurrentLanguage();

  const handleParse = useCallback(async () => {
    if (!inputValue.trim()) return;

    setInput(inputValue);
    setLoading(true);
    setError(null);

    try {
      // Get or generate rule set
      let ruleSet = currentLang ? getRuleSet(currentLang.id) : null;

      // Generate rules from tables if not available
      if (!ruleSet && currentLang && tables.length > 0) {
        const languageTables = tables.filter(t => t.languageId === currentLang.id);
        if (languageTables.length > 0) {
          ruleSet = generateRulesFromTables(languageTables, currentLang.id);
          setRuleSet(currentLang.id, ruleSet);
        }
      }

      // Fall back to built-in rules if no custom rules
      if (!ruleSet && currentLang) {
        ruleSet = getBuiltinRulesForLanguage(currentLang.id);
      }

      // Filter tables for current language
      const languageTables = currentLang
        ? tables.filter(t => t.languageId === currentLang.id)
        : tables;

      // Parse the form
      const result = await parseForm(inputValue, ruleSet, languageTables, {
        useSedra,
        useLocalTables,
      });

      setResult(result);
      addToHistory(inputValue, result.success);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Parse failed';
      setError(message);
      addToHistory(inputValue, false);
    } finally {
      setLoading(false);
    }
  }, [
    inputValue,
    currentLang,
    tables,
    useSedra,
    useLocalTables,
    getRuleSet,
    setRuleSet,
    setInput,
    setResult,
    setLoading,
    setError,
    addToHistory,
  ]);

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
