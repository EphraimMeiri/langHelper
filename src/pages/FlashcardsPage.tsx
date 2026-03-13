import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/layout/Header.tsx';
import { DeckSelector } from '../components/flashcards/DeckSelector.tsx';
import { DeckCreator } from '../components/flashcards/DeckCreator.tsx';
import { StudySession } from '../components/flashcards/StudySession.tsx';
import { useLanguageStore } from '../stores/languageStore.ts';
import { useTableStore } from '../stores/tableStore.ts';
import { useFlashcardStore } from '../stores/flashcardStore.ts';
import { useSettingsStore } from '../stores/settingsStore.ts';
import type { Flashcard, Deck, Rating } from '../types/flashcard.ts';

export function FlashcardsPage() {
  const currentLang = useLanguageStore((s) => s.getCurrentLanguage());
  const { tables, loadTablesForLanguage } = useTableStore();
  const {
    cards,
    decks,
    progress,
    reviewHistory,
    createDeck,
    deleteDeck,
    recordReview,
    getDeckCards,
  } = useFlashcardStore();
  const { syriacVocalization } = useSettingsStore();

  const [mode, setMode] = useState<'select' | 'create' | 'study'>('select');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  const languageTables = useMemo(() => {
    if (!currentLang) return [];
    return tables.filter((table) => table.languageId === currentLang.id);
  }, [tables, currentLang]);

  useEffect(() => {
    if (currentLang) {
      loadTablesForLanguage(currentLang.id);
    }
  }, [currentLang?.id, loadTablesForLanguage]);

  const selectedDeck = useMemo(
    () => decks.find((deck) => deck.id === selectedDeckId) || null,
    [decks, selectedDeckId]
  );

  const handleCreateDeck = (deck: Deck, newCards: Flashcard[]) => {
    createDeck(deck, newCards);
    setSelectedDeckId(deck.id);
    setMode('select');
  };

  const handleStartDeck = (deckId: string) => {
    setSelectedDeckId(deckId);
    setMode('study');
  };

  const handleReview = (cardId: string, rating: Rating) => {
    recordReview(cardId, rating);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Flashcards" subtitle="Spaced repetition review" />

      <div className="flex-1 p-6">
        {mode === 'select' && (
          <DeckSelector
            decks={decks}
            cards={cards}
            progress={progress}
            reviewHistory={reviewHistory}
            currentLanguageId={currentLang?.id}
            onCreateDeck={() => setMode('create')}
            onStartDeck={handleStartDeck}
            onDeleteDeck={deleteDeck}
          />
        )}

        {mode === 'create' && currentLang && (
          <DeckCreator
            currentLang={currentLang}
            languageTables={languageTables}
            syriacVocalization={syriacVocalization}
            onCreateDeck={handleCreateDeck}
            onCancel={() => setMode('select')}
          />
        )}

        {mode === 'study' && selectedDeck && (
          <StudySession
            deck={selectedDeck}
            currentLang={currentLang}
            getDeckCards={getDeckCards}
            progress={progress}
            onReview={handleReview}
            onBack={() => setMode('select')}
          />
        )}
      </div>
    </div>
  );
}
