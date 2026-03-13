import { useState } from 'react';
import { Header } from '../components/layout/Header.tsx';
import { ParseInput } from '../components/parsing/ParseInput.tsx';
import { StepByStepView } from '../components/parsing/StepByStepView.tsx';
import { DecisionTreeView } from '../components/parsing/DecisionTreeView.tsx';
import { RuleEditor } from '../components/parsing/RuleEditor.tsx';
import { useParsingStore } from '../stores/parsingStore.ts';
import { useLanguageStore } from '../stores/languageStore.ts';

export function ParsePage() {
  const currentLang = useLanguageStore((s) => s.getCurrentLanguage());
  const { viewMode, setViewMode, useSedra, setUseSedra, useLocalTables, setUseLocalTables, error } =
    useParsingStore();
  const [showRuleEditor, setShowRuleEditor] = useState(false);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Parse Form"
        subtitle="Analyze verb morphology with SEDRA API and decision tree"
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Input section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            {currentLang ? (
              <ParseInput />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Select a language first.
              </p>
            )}

            {/* Error display */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {/* Settings bar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSedra}
                  onChange={(e) => setUseSedra(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Use SEDRA API
                </span>
                <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">
                  Online
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLocalTables}
                  onChange={(e) => setUseLocalTables(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Search local tables
                </span>
              </label>

              <div className="ml-auto">
                <button
                  onClick={() => setShowRuleEditor(!showRuleEditor)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {showRuleEditor ? 'Hide Rule Editor' : 'Edit Rules'}
                </button>
              </div>
            </div>
          </div>

          {/* Rule editor (collapsible) */}
          {showRuleEditor && (
            <div className="mb-6">
              <RuleEditor onClose={() => setShowRuleEditor(false)} />
            </div>
          )}

          {/* Results view */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="border-b border-gray-200 dark:border-gray-700 px-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setViewMode('step-by-step')}
                  className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                    viewMode === 'step-by-step'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Step by Step
                </button>
                <button
                  onClick={() => setViewMode('tree')}
                  className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                    viewMode === 'tree'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Decision Tree
                </button>
              </div>
            </div>

            <div className="p-6">
              {viewMode === 'step-by-step' ? <StepByStepView /> : <DecisionTreeView />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
