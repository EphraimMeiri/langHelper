import { useCallback } from 'react';
import { useParsingStore } from '../stores/parsingStore';
import { useLanguageStore } from '../stores/languageStore';
import { useTableStore } from '../stores/tableStore';
import { parseForm } from '../utils/parsing/parseEngine';
import { generateRulesFromTables } from '../utils/parsing/ruleGenerator';
import { getBuiltinRulesForLanguage } from '../utils/parsing/builtinRules';

export function useParseAction() {
  const { getCurrentLanguage } = useLanguageStore();
  const { tables } = useTableStore();
  const {
    setInput,
    setResult,
    setLoading,
    setError,
    useSedra,
    useLocalTables,
    getRuleSet,
    setRuleSet,
    addToHistory,
  } = useParsingStore();

  return useCallback(
    async (input: string) => {
      const value = input.trim();
      if (!value) return;
      const currentLang = getCurrentLanguage();

      setInput(value);
      setLoading(true);
      setError(null);

      try {
        let ruleSet = currentLang ? getRuleSet(currentLang.id) : null;

        if (!ruleSet && currentLang && tables.length > 0) {
          const languageTables = tables.filter((t) => t.languageId === currentLang.id);
          if (languageTables.length > 0) {
            ruleSet = generateRulesFromTables(languageTables, currentLang.id);
            setRuleSet(currentLang.id, ruleSet);
          }
        }

        if (!ruleSet && currentLang) {
          ruleSet = getBuiltinRulesForLanguage(currentLang.id);
        }

        const languageTables = currentLang
          ? tables.filter((t) => t.languageId === currentLang.id)
          : tables;

        const result = await parseForm(value, ruleSet, languageTables, {
          useSedra,
          useLocalTables,
        });

        setResult(result);
        addToHistory(value, result.success);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Parse failed';
        setError(message);
        addToHistory(value, false);
      } finally {
        setLoading(false);
      }
    },
    [
      getCurrentLanguage,
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
    ]
  );
}
