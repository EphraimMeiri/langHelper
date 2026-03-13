import { useEffect, useMemo, useState } from 'react';
import { ScriptInput } from '../common/ScriptInput.tsx';
import type { LanguageConfig } from '../../types/language.ts';
import type { VerbTable } from '../../types/verb.ts';
import type { Flashcard, Deck } from '../../types/flashcard.ts';
import { listVerbLexemes, fetchLexemeParadigmHtml } from '../../services/sedraApi.ts';
import type { SedraVerbLexemeListItem } from '../../services/sedraApi.ts';
import { parseSedraParadigmHtml, type SedraParadigm } from '../../utils/sedraParadigm.ts';
import {
  generateCardsFromTable,
  generateCardsFromSedraParadigm,
  type CardDirection,
} from '../../utils/flashcardGenerator.ts';
import type { SyriacVocalization } from '../../stores/settingsStore.ts';

function buildDeckSources(cards: Flashcard[]): Deck['sources'] {
  const sources = new Map<string, Deck['sources'][number]>();
  for (const card of cards) {
    const key = `${card.source.tableId}|${card.source.stem || ''}|${card.source.tense || ''}|${card.source.personNumberGender || ''}`;
    if (!sources.has(key)) {
      sources.set(key, card.source);
    }
  }
  return Array.from(sources.values());
}

function toggleSetValue<T>(set: Set<T>, value: T, setter: (next: Set<T>) => void) {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  setter(next);
}

interface DeckCreatorProps {
  currentLang: LanguageConfig;
  languageTables: VerbTable[];
  syriacVocalization: SyriacVocalization;
  onCreateDeck: (deck: Deck, cards: Flashcard[]) => void;
  onCancel: () => void;
}

export function DeckCreator({
  currentLang,
  languageTables,
  syriacVocalization,
  onCreateDeck,
  onCancel,
}: DeckCreatorProps) {
  const [direction, setDirection] = useState<CardDirection>('form-to-parse');
  const [deckName, setDeckName] = useState('');
  const [includeLocal, setIncludeLocal] = useState(true);
  const [includeSedra, setIncludeSedra] = useState(false);
  const [autoSelectedTables, setAutoSelectedTables] = useState(false);

  const [selectedTableIds, setSelectedTableIds] = useState<Set<string>>(
    new Set(languageTables.map((t) => t.id))
  );
  const [selectedStems, setSelectedStems] = useState<Set<string>>(new Set());
  const [selectedTenses, setSelectedTenses] = useState<Set<string>>(new Set());
  const [selectedPersons, setSelectedPersons] = useState<Set<string>>(new Set());
  const [selectedGenders, setSelectedGenders] = useState<Set<string>>(new Set());
  const [selectedNumbers, setSelectedNumbers] = useState<Set<string>>(new Set());

  const [sedraSearchTerm, setSedraSearchTerm] = useState('');
  const [sedraResults, setSedraResults] = useState<SedraVerbLexemeListItem[]>([]);
  const [sedraSelected, setSedraSelected] = useState<Set<number>>(new Set());
  const [sedraParadigms, setSedraParadigms] = useState<Record<number, SedraParadigm>>({});
  const [sedraLoading, setSedraLoading] = useState(false);
  const [sedraError, setSedraError] = useState<string | null>(null);

  useEffect(() => {
    if (!includeLocal) return;
    if (autoSelectedTables) return;
    if (languageTables.length === 0) return;
    setSelectedTableIds(new Set(languageTables.map((table) => table.id)));
    setAutoSelectedTables(true);
  }, [includeLocal, autoSelectedTables, languageTables]);

  const selectedTables = useMemo(() => {
    if (!includeLocal) return [];
    return languageTables.filter((table) => selectedTableIds.has(table.id));
  }, [languageTables, selectedTableIds, includeLocal]);

  const selectedSedraParadigms = useMemo(() => {
    if (!includeSedra) return [];
    return Array.from(sedraSelected)
      .map((id) => sedraParadigms[id])
      .filter((paradigm): paradigm is SedraParadigm => Boolean(paradigm));
  }, [sedraSelected, sedraParadigms, includeSedra]);

  const availableStems = useMemo(() => {
    const stems = new Map<string, string>();
    for (const table of selectedTables) {
      for (const stem of Object.keys(table.stems)) {
        if (!stems.has(stem)) stems.set(stem, stem);
      }
    }
    for (const paradigm of selectedSedraParadigms) {
      for (const stem of paradigm.stems) {
        if (!stems.has(stem.key)) stems.set(stem.key, stem.label || stem.key);
      }
    }
    return stems;
  }, [selectedTables, selectedSedraParadigms]);

  const availableTenses = useMemo(() => {
    const tenses = new Set<string>();
    for (const table of selectedTables) {
      for (const stem of Object.values(table.stems)) {
        for (const tense of Object.keys(stem)) {
          tenses.add(tense);
        }
      }
    }
    for (const paradigm of selectedSedraParadigms) {
      for (const form of paradigm.forms) {
        tenses.add(form.tense);
      }
    }
    return tenses;
  }, [selectedTables, selectedSedraParadigms]);

  const availableStemEntries = useMemo(
    () => Array.from(availableStems.entries()).sort((a, b) => a[0].localeCompare(b[0])),
    [availableStems]
  );

  const availableTenseEntries = useMemo(
    () => Array.from(availableTenses).sort((a, b) => a.localeCompare(b)),
    [availableTenses]
  );

  const handleSedraSearch = async () => {
    if (!sedraSearchTerm.trim()) return;
    setSedraLoading(true);
    setSedraError(null);
    try {
      const results = await listVerbLexemes(sedraSearchTerm.trim());
      setSedraResults(results);
    } catch (e) {
      setSedraError(e instanceof Error ? e.message : 'Search failed. Check your network connection.');
    } finally {
      setSedraLoading(false);
    }
  };

  const toggleSedraLexeme = async (item: SedraVerbLexemeListItem) => {
    const next = new Set(sedraSelected);
    if (next.has(item.term)) {
      next.delete(item.term);
      setSedraSelected(next);
      return;
    }
    next.add(item.term);
    setSedraSelected(next);

    if (!sedraParadigms[item.term]) {
      setSedraLoading(true);
      try {
        const html = await fetchLexemeParadigmHtml(item.term);
        if (!html) {
          setSedraError('Failed to load paradigm data.');
          return;
        }
        const parsed = parseSedraParadigmHtml(html, item.term);
        if (!parsed) {
          setSedraError('Unable to parse paradigm data.');
          return;
        }
        setSedraParadigms((prev) => ({ ...prev, [item.term]: parsed }));
      } catch (e) {
        setSedraError(e instanceof Error ? e.message : 'Failed to load paradigm.');
      } finally {
        setSedraLoading(false);
      }
    }
  };

  const generatedCards = useMemo(() => {
    const options = {
      direction,
      vowelStyle: syriacVocalization,
      includeStems: selectedStems,
      includeTenses: selectedTenses,
      includePersons: selectedPersons,
      includeGenders: selectedGenders,
      includeNumbers: selectedNumbers,
    };

    const localCards = includeLocal
      ? selectedTables.flatMap((table) => generateCardsFromTable(table, options))
      : [];
    const sedraCards = includeSedra
      ? selectedSedraParadigms.flatMap((paradigm) =>
          generateCardsFromSedraParadigm(paradigm, currentLang.id, options)
        )
      : [];

    return [...localCards, ...sedraCards];
  }, [
    currentLang,
    direction,
    syriacVocalization,
    selectedStems,
    selectedTenses,
    selectedPersons,
    selectedGenders,
    selectedNumbers,
    includeLocal,
    includeSedra,
    selectedTables,
    selectedSedraParadigms,
  ]);

  const handleCreateDeck = () => {
    if (generatedCards.length === 0) return;
    const now = new Date().toISOString();
    const name = deckName.trim() || `${currentLang.name} deck`;
    const deckId = `deck-${Date.now()}`;
    const deck: Deck = {
      id: deckId,
      languageId: currentLang.id,
      name,
      description: `Generated ${generatedCards.length} cards`,
      sources: buildDeckSources(generatedCards),
      cardIds: generatedCards.map((card) => card.id),
      createdAt: now,
      updatedAt: now,
    };
    onCreateDeck(deck, generatedCards);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Create Deck</h3>
          <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            Cancel
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Deck name</label>
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            placeholder="Syriac verb paradigms"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Card direction</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="radio" name="direction" checked={direction === 'form-to-parse'} onChange={() => setDirection('form-to-parse')} />
                <span>Form &rarr; Parsing</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="direction" checked={direction === 'parse-to-form'} onChange={() => setDirection('parse-to-form')} />
                <span>Root + Parsing &rarr; Form</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Sources</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={includeLocal} onChange={(e) => setIncludeLocal(e.target.checked)} />
                <span>Local verb tables</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={includeSedra} onChange={(e) => setIncludeSedra(e.target.checked)} />
                <span>SEDRA paradigms</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {includeLocal && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Local tables</h4>
            <button onClick={() => setSelectedTableIds(new Set(languageTables.map((t) => t.id)))} className="text-xs text-blue-600 hover:text-blue-700">
              Select all
            </button>
          </div>
          {languageTables.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">No local tables available for this language.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {languageTables.map((table) => (
                <label key={table.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedTableIds.has(table.id)} onChange={() => toggleSetValue(selectedTableIds, table.id, setSelectedTableIds)} />
                  <span>{table.classDisplayName}</span>
                  <span className="text-sm text-gray-500">({table.paradigmRoot})</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {includeSedra && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">SEDRA verb paradigms</h4>
            {sedraLoading && <span className="text-sm text-gray-500">Loading...</span>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Search consonants</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <ScriptInput
                  value={sedraSearchTerm}
                  onChange={setSedraSearchTerm}
                  script={currentLang.script}
                  direction={currentLang.direction}
                  placeholder="Enter Syriac consonants"
                  showKeyboard={false}
                />
              </div>
              <button onClick={handleSedraSearch} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Search
              </button>
            </div>
          </div>

          {sedraError && <div className="text-sm text-red-600">{sedraError}</div>}

          {sedraResults.length === 0 && sedraSelected.size === 0 && (
            <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Start - Common Verbs</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 4174, label: '\u071F\u072C\u0712', english: 'to write' },
                  { id: 4082, label: '\u0710\u0721\u072A', english: 'to say' },
                  { id: 4051, label: '\u0710\u0719\u0720', english: 'to go' },
                  { id: 4162, label: '\u071D\u0715\u0725', english: 'to know' },
                  { id: 4270, label: '\u0725\u0712\u0715', english: 'to do/make' },
                  { id: 4330, label: '\u0729\u072A\u0710', english: 'to call/read' },
                  { id: 4228, label: '\u0722\u0726\u0729', english: 'to go out' },
                  { id: 4290, label: '\u0726\u072C\u071A', english: 'to open' },
                ].map((verb) => (
                  <button
                    key={verb.id}
                    onClick={() => toggleSedraLexeme({ term: verb.id, value: verb.label, label: verb.english })}
                    disabled={sedraLoading}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      sedraSelected.has(verb.id) ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                    }`}
                  >
                    <span className="font-syriac text-base" dir="rtl">{verb.label}</span>
                    <span className="ml-2 text-gray-500 dark:text-gray-400">{verb.english}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {sedraResults.length > 0 && (
            <div className="space-y-2">
              {sedraResults.map((item) => (
                <label key={item.term} className="flex items-center gap-2">
                  <input type="checkbox" checked={sedraSelected.has(item.term)} onChange={() => toggleSedraLexeme(item)} />
                  <span className={`text-lg ${currentLang.script === 'syriac' ? 'font-syriac' : 'font-hebrew'}`} dir={currentLang.direction}>
                    {item.value}
                  </span>
                  <span className="text-sm text-gray-500">(ID {item.term})</span>
                </label>
              ))}
            </div>
          )}

          {sedraSelected.size > 0 && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selected Paradigms ({sedraSelected.size})</div>
              <div className="flex flex-wrap gap-2">
                {Array.from(sedraSelected).map((id) => {
                  const paradigm = sedraParadigms[id];
                  return (
                    <div key={id} className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm">
                      {paradigm?.root && <span className="font-syriac text-base" dir="rtl">{paradigm.root}</span>}
                      <span>ID {id}</span>
                      {paradigm && <span className="text-xs text-purple-500 dark:text-purple-400">({paradigm.forms.length} forms)</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {sedraResults.length === 0 && sedraSearchTerm && !sedraLoading && (
            <div className="text-sm text-gray-500 dark:text-gray-400">No results yet. Try another root.</div>
          )}
        </div>
      )}

      {(availableStemEntries.length > 0 || availableTenseEntries.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <h4 className="font-medium">Filters</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Leave filters empty to include all. Select specific values to filter cards.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Stems (Binyanim)</span>
                <button onClick={() => setSelectedStems(new Set(availableStems.keys()))} className="text-xs text-blue-600 hover:text-blue-700">Select all</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableStemEntries.map(([stem, label]) => (
                  <label key={stem} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selectedStems.has(stem)} onChange={() => toggleSetValue(selectedStems, stem, setSelectedStems)} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tenses</span>
                <button onClick={() => setSelectedTenses(new Set(availableTenses))} className="text-xs text-blue-600 hover:text-blue-700">Select all</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTenseEntries.map((tense) => (
                  <label key={tense} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selectedTenses.has(tense)} onChange={() => toggleSetValue(selectedTenses, tense, setSelectedTenses)} />
                    <span>{tense}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Person</span>
                <button onClick={() => setSelectedPersons(new Set(['1', '2', '3']))} className="text-xs text-blue-600 hover:text-blue-700">Select all</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[{ value: '1', label: '1st Person' }, { value: '2', label: '2nd Person' }, { value: '3', label: '3rd Person' }].map((item) => (
                  <label key={item.value} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selectedPersons.has(item.value)} onChange={() => toggleSetValue(selectedPersons, item.value, setSelectedPersons)} />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Gender</span>
                <button onClick={() => setSelectedGenders(new Set(['m', 'f', 'c']))} className="text-xs text-blue-600 hover:text-blue-700">Select all</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[{ value: 'm', label: 'Masculine' }, { value: 'f', label: 'Feminine' }, { value: 'c', label: 'Common' }].map((item) => (
                  <label key={item.value} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selectedGenders.has(item.value)} onChange={() => toggleSetValue(selectedGenders, item.value, setSelectedGenders)} />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Number</span>
                <button onClick={() => setSelectedNumbers(new Set(['s', 'p']))} className="text-xs text-blue-600 hover:text-blue-700">Select all</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[{ value: 's', label: 'Singular' }, { value: 'p', label: 'Plural' }].map((item) => (
                  <label key={item.value} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selectedNumbers.has(item.value)} onChange={() => toggleSetValue(selectedNumbers, item.value, setSelectedNumbers)} />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center justify-between">
        <div>
          <div className="font-medium">{generatedCards.length} cards ready</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {syriacVocalization === 'eastern' ? 'Eastern vowels applied' : 'Western vowels applied'}
          </div>
        </div>
        <button
          onClick={handleCreateDeck}
          disabled={generatedCards.length === 0}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          Create deck
        </button>
      </div>
    </div>
  );
}
