import { useEffect, useMemo, useRef, useState } from 'react';
import { HighlightedForm } from './HighlightedForm';
import { useParsingStore } from '../../stores/parsingStore';
import { conclusionToString } from '../../types/parsing';
import type { ParseStep } from '../../types/parsing';
import { useLanguageStore } from '../../stores/languageStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { formatSyriacText } from '../../utils/syriacText';
import { buildSedraSteps } from '../../utils/parsing/sedraSteps';
import type { SedraWord } from '../../services/sedraApi';
import { getGloss } from '../../services/sedraApi';

export function StepByStepView() {
  const {
    currentResult,
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    autoPlay,
    setAutoPlay,
  } = useParsingStore();
  const { getCurrentLanguage } = useLanguageStore();
  const { syriacVocalization, showVowels } = useSettingsStore();
  const currentLang = getCurrentLanguage();
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && currentResult) {
      autoPlayRef.current = setInterval(() => {
        if (currentStep < currentResult.steps.length - 1) {
          nextStep();
        } else {
          setAutoPlay(false);
        }
      }, 1500);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, currentStep, currentResult, nextStep, setAutoPlay]);

  if (!currentResult) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        Enter a word above to see step-by-step parsing
      </div>
    );
  }

  // Rule-based steps only (exclude the opaque sedra_lookup step — results are shown below)
  const ruleSteps = currentResult.steps.filter(s => s.rule.id !== 'sedra_lookup');
  const activeStep = ruleSteps[currentStep];

  // Cumulative highlights up to current step
  const cumulativeHighlights = ruleSteps
    .slice(0, currentStep + 1)
    .flatMap(s => s.highlights);

  const hasSedra = currentResult.sedraResults && currentResult.sedraResults.length > 0;
  const hasRuleSteps = ruleSteps.length > 0;

  return (
    <div className="space-y-6">
      {/* Form display — only shown when there are rule steps to navigate */}
      {hasRuleSteps && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <div className="mb-4">
              <HighlightedForm
                form={currentResult.input}
                highlights={cumulativeHighlights}
                showLabels={true}
              />
            </div>
            {activeStep && (
              <div className="text-lg text-gray-700 dark:text-gray-300 mt-6">
                {conclusionToString(activeStep.cumulativeConclusion)}
              </div>
            )}
          </div>

          {/* Step controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <span className="text-gray-600 dark:text-gray-400">
              Step {currentStep + 1} of {ruleSteps.length}
            </span>
            <button
              onClick={nextStep}
              disabled={currentStep >= ruleSteps.length - 1}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className={`px-4 py-2 rounded-lg transition-colors ${autoPlay
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {autoPlay ? 'Stop' : 'Auto Play'}
            </button>
          </div>

          {/* Step list */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
            {ruleSteps.map((step, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`p-4 cursor-pointer transition-colors ${idx === currentStep
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500'
                  : idx < currentStep
                    ? 'bg-green-50/50 dark:bg-green-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${idx < currentStep
                      ? 'bg-green-500 text-white'
                      : idx === currentStep
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {idx < currentStep ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {step.rule.id.startsWith('table_match') ? (
                        <span className="text-green-600 dark:text-green-400">Table Match</span>
                      ) : (
                        <span>Rule: {step.rule.id}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {step.explanation}
                    </div>
                    {step.matched && step.highlights.length > 0 && (
                      <div className="mt-2">
                        <span
                          className={`text-lg ${currentLang?.script === 'syriac' ? 'font-syriac' : 'font-hebrew'}`}
                          dir={currentLang?.direction || 'rtl'}
                        >
                          <HighlightedForm form={currentResult.input} highlights={step.highlights} />
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {conclusionToString(step.cumulativeConclusion) || '—'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!hasRuleSteps && !hasSedra && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500 dark:text-gray-400">
          No parsing steps available
        </div>
      )}

      {/* SEDRA results section */}
      {currentResult.sedraResults && currentResult.sedraResults.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-purple-900 dark:text-purple-200 mb-4">
            SEDRA Database Results
          </h3>

          {currentResult.sedraGloss && (
            <div className="mb-4 text-lg">
              <span className="text-gray-600 dark:text-gray-400">Meaning: </span>
              <span className="font-medium text-gray-900 dark:text-white">
                "{currentResult.sedraGloss}"
              </span>
            </div>
          )}

          <div className="space-y-3">
            {currentResult.sedraResults.map((result, idx) => (
              <SedraResultCard
                key={idx}
                result={result}
                idx={idx}
                fontClass={currentLang?.script === 'syriac' ? 'font-syriac' : 'font-hebrew'}
                vocalized={formatSyriacText(
                  syriacVocalization === 'eastern'
                    ? result.eastern || result.western || result.syriac
                    : result.western || result.eastern || result.syriac,
                  { showVowels }
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Matched forms from local tables */}
      {currentResult.matchedForms.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-green-900 dark:text-green-200 mb-4">
            Local Table Matches
          </h3>

          <div className="space-y-2">
            {currentResult.matchedForms.map((match, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700"
              >
                <span
                  className={`text-lg ${currentLang?.script === 'syriac' ? 'font-syriac' : 'font-hebrew'
                    }`}
                  dir="rtl"
                >
                  {match.form}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {match.stem} {match.tense} {match.personNumberGender}
                </span>
                <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                  {Math.round(match.confidence * 100)}% match
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEDRA Full Paradigm */}
      {currentResult.sedraParadigm && (
        <ParadigmTable
          paradigm={currentResult.sedraParadigm}
          currentForm={currentResult.input}
          script={currentLang?.script || 'syriac'}
          direction={currentLang?.direction || 'rtl'}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SEDRA result card with expandable step-by-step breakdown
// ---------------------------------------------------------------------------
function SedraResultCard({
  result,
  idx,
  fontClass,
  vocalized,
}: {
  result: SedraWord;
  idx: number;
  fontClass: string;
  vocalized: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const steps = useMemo(() => buildSedraSteps(result), [result]);
  const engGloss = getGloss(result);

  // Build multilingual gloss rows from result.glosses
  const glossRows = useMemo(() => {
    if (!result.glosses) return [];
    return Object.entries(result.glosses).map(([lang, val]) => ({
      lang,
      text: Array.isArray(val) ? val.join(', ') : val,
    }));
  }, [result.glosses]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700 overflow-hidden">
      {/* Header row */}
      <div className="p-4">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-xs font-medium text-purple-500 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded">
            Parse {idx + 1}
          </span>
          <span className={`text-xl ${fontClass}`} dir="rtl">
            {vocalized}
          </span>
          {engGloss && (
            <span className="text-gray-500 dark:text-gray-400 text-sm">"{engGloss}"</span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          {result.kaylo && (
            <div><span className="text-gray-500 dark:text-gray-400">Stem: </span><span className="font-medium">{result.kaylo}</span></div>
          )}
          {result.tense && (
            <div><span className="text-gray-500 dark:text-gray-400">Tense: </span><span className="font-medium">{result.tense}</span></div>
          )}
          {result.person && (
            <div><span className="text-gray-500 dark:text-gray-400">Person: </span><span className="font-medium">{result.person}</span></div>
          )}
          {result.gender && (
            <div><span className="text-gray-500 dark:text-gray-400">Gender: </span><span className="font-medium">{result.gender}</span></div>
          )}
          {result.number && (
            <div><span className="text-gray-500 dark:text-gray-400">Number: </span><span className="font-medium">{result.number}</span></div>
          )}
          {result.state && (
            <div><span className="text-gray-500 dark:text-gray-400">State: </span><span className="font-medium">{result.state}</span></div>
          )}
        </div>
        {/* Multilingual glosses table */}
        {glossRows.length > 0 && (
          <table className="mt-3 text-sm w-full">
            <tbody>
              {glossRows.map(({ lang, text }) => (
                <tr key={lang} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="pr-3 py-1 text-gray-400 dark:text-gray-500 w-10 align-top">{lang}</td>
                  <td className="py-1 text-gray-700 dark:text-gray-300">{text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Expandable step breakdown */}
      {steps.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-2 text-sm text-left bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 border-t border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 transition-colors flex items-center justify-between"
          >
            <span>Morphological breakdown</span>
            <span>{expanded ? '−' : '+'}</span>
          </button>

          {expanded && (
            <div className="divide-y divide-purple-100 dark:divide-purple-800">
              {steps.map((step) => (
                <MorphStep
                  key={step.stepNumber}
                  step={step}
                  input={result.syriac}
                  fontClass={fontClass}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MorphStep({
  step,
  input,
  fontClass,
}: {
  step: ParseStep;
  input: string;
  fontClass: string;
}) {
  const labelColors: Record<string, string> = {
    sedra_root: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    sedra_kaylo: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    sedra_png: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
  };
  const color = labelColors[step.rule.id] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';

  return (
    <div className="px-4 py-3 flex items-start gap-3">
      <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded mt-0.5 ${color}`}>
        {step.stepNumber}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-700 dark:text-gray-300">{step.explanation}</div>
        {step.highlights.length > 0 && (
          <div className={`mt-1 text-lg ${fontClass}`} dir="rtl">
            <HighlightedForm form={input} highlights={step.highlights} showLabels={true} />
          </div>
        )}
      </div>
      <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 text-right mt-0.5">
        {conclusionToString(step.cumulativeConclusion)}
      </div>
    </div>
  );
}

// Paradigm table component
function ParadigmTable({
  paradigm,
  currentForm,
  script,
  direction,
}: {
  paradigm: import('../../utils/sedraParadigm').SedraParadigm;
  currentForm: string;
  script: string;
  direction: string;
}) {
  const { syriacVocalization, showVowels } = useSettingsStore();
  const [expandedStems, setExpandedStems] = useState<Set<string>>(new Set(paradigm.stems.map(s => s.key)));

  const toggleStem = (stemKey: string) => {
    setExpandedStems((prev) => {
      const next = new Set(prev);
      if (next.has(stemKey)) {
        next.delete(stemKey);
      } else {
        next.add(stemKey);
      }
      return next;
    });
  };

  // Group forms by stem and tense
  const formsByStam = useMemo(() => {
    const grouped: Record<string, Record<string, Array<{ png: string; form: string }>>> = {};
    for (const form of paradigm.forms) {
      if (!grouped[form.stem]) grouped[form.stem] = {};
      if (!grouped[form.stem][form.tense]) grouped[form.stem][form.tense] = [];
      grouped[form.stem][form.tense].push({ png: form.png, form: form.form });
    }
    return grouped;
  }, [paradigm.forms]);

  const fontClass = script === 'syriac' ? 'font-syriac' : 'font-hebrew';

  // Strip vowels for comparison
  const stripVowels = (text: string) => {
    return text.replace(/[\u0700-\u074F]/g, (char) => {
      const code = char.charCodeAt(0);
      // Keep only consonants (0x710-0x72F roughly)
      if (code >= 0x0730 && code <= 0x074F) return '';
      return char;
    });
  };

  const isCurrentForm = (form: string) => {
    return stripVowels(form) === stripVowels(currentForm) || form === currentForm;
  };

  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-indigo-900 dark:text-indigo-200">
          Full Paradigm
          {paradigm.root && (
            <span className={`ml-2 ${fontClass}`} dir={direction}>
              ({paradigm.root})
            </span>
          )}
          {paradigm.classLabel && (
            <span className="ml-2 text-sm text-indigo-600 dark:text-indigo-400">
              - {paradigm.classLabel}
            </span>
          )}
        </h3>
      </div>

      <div className="space-y-4">
        {paradigm.stems.map((stem) => {
          const stemForms = formsByStam[stem.key];
          if (!stemForms) return null;

          const isExpanded = expandedStems.has(stem.key);

          return (
            <div
              key={stem.key}
              className="bg-white dark:bg-gray-800 rounded-lg border border-indigo-200 dark:border-indigo-700 overflow-hidden"
            >
              <button
                onClick={() => toggleStem(stem.key)}
                className="w-full px-4 py-3 flex items-center justify-between bg-indigo-100 dark:bg-indigo-800/50 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-indigo-900 dark:text-indigo-200">
                    {stem.label || stem.key}
                  </span>
                  {stem.syriac && (
                    <span className={`${fontClass} text-lg`} dir={direction}>
                      {stem.syriac}
                    </span>
                  )}
                </div>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {isExpanded ? '−' : '+'}
                </span>
              </button>

              {isExpanded && (
                <div className="p-4 space-y-4">
                  {Object.entries(stemForms).map(([tense, forms]) => (
                    <div key={tense}>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 capitalize">
                        {tense.replace(/-/g, ' ')}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {forms.map((form, idx) => {
                          const isCurrent = isCurrentForm(form.form);
                          return (
                            <div
                              key={idx}
                              className={`p-2 rounded text-center ${isCurrent
                                  ? 'bg-yellow-100 dark:bg-yellow-900/50 border-2 border-yellow-400'
                                  : 'bg-gray-50 dark:bg-gray-700'
                                }`}
                            >
                              <div
                                className={`${fontClass} text-lg`}
                                dir={direction}
                              >
                                {formatSyriacText(form.form, {
                                  showVowels,
                                  vowelStyle: syriacVocalization,
                                })}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {form.png}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
