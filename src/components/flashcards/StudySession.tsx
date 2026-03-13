import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Flashcard, Deck, Rating, CardProgress } from '../../types/flashcard.ts';
import { getDueCards } from '../../types/flashcard.ts';
import type { LanguageConfig } from '../../types/language.ts';

const SYRIAC_CHAR = /[\u0700-\u074F]/;
const HEBREW_CHAR = /[\u0590-\u05FF]/;

function isScriptOnly(text: string, script: 'syriac' | 'hebrew'): boolean {
  const matcher = script === 'syriac' ? SYRIAC_CHAR : HEBREW_CHAR;
  return matcher.test(text) && !/[A-Za-z]/.test(text);
}

interface StudySessionProps {
  deck: Deck;
  currentLang: LanguageConfig | null;
  getDeckCards: (deckId: string) => Flashcard[];
  progress: Record<string, CardProgress>;
  onReview: (cardId: string, rating: Rating) => void;
  onBack: () => void;
}

export function StudySession({
  deck,
  currentLang,
  getDeckCards,
  progress,
  onReview,
  onBack,
}: StudySessionProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const dueCards = useMemo(() => {
    const deckCards = getDeckCards(deck.id);
    if (deckCards.length === 0) return [];

    const deckMap = new Map(deckCards.map((card) => [card.id, card]));
    const progressMap = new Map(Object.entries(progress).map(([id, value]) => [id, value]));
    const dueIds = getDueCards(progressMap).filter((id) => deckMap.has(id));
    return dueIds.map((id) => deckMap.get(id)!).filter(Boolean);
  }, [deck.id, getDeckCards, progress]);

  const currentCard = dueCards[0] || null;

  const handleReview = useCallback(
    (rating: Rating) => {
      if (!currentCard) return;
      onReview(currentCard.id, rating);
      setIsFlipped(false);
    },
    [currentCard, onReview]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          setIsFlipped((prev) => !prev);
          break;
        case '1':
          e.preventDefault();
          handleReview(1);
          break;
        case '2':
          e.preventDefault();
          handleReview(3);
          break;
        case '3':
          e.preventDefault();
          handleReview(4);
          break;
        case '4':
          e.preventDefault();
          handleReview(5);
          break;
        case 'Escape':
          e.preventDefault();
          onBack();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReview, onBack]);

  const renderCardText = (text: string) => {
    const script = currentLang?.script === 'hebrew' ? 'hebrew' : 'syriac';
    const isScriptText = isScriptOnly(text, script);
    const fontClass = script === 'syriac' ? 'font-syriac' : 'font-hebrew';
    return (
      <div
        className={`text-center whitespace-pre-line ${isScriptText ? `${fontClass} text-4xl` : 'text-lg'}`}
        dir={isScriptText ? currentLang?.direction : 'ltr'}
      >
        {text}
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Studying</div>
          <div className="text-lg font-medium">{deck.name}</div>
        </div>
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Back to decks
        </button>
      </div>

      {currentCard ? (
        <>
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 min-h-[300px] flex items-center justify-center cursor-pointer hover:shadow-xl transition-shadow"
          >
            {renderCardText(isFlipped ? currentCard.back : currentCard.front)}
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => handleReview(1)}
              className="px-6 py-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
            >
              Again
            </button>
            <button
              onClick={() => handleReview(3)}
              className="px-6 py-3 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
            >
              Hard
            </button>
            <button
              onClick={() => handleReview(4)}
              className="px-6 py-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
            >
              Good
            </button>
            <button
              onClick={() => handleReview(5)}
              className="px-6 py-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              Easy
            </button>
          </div>

          <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
            {dueCards.length} due cards remaining
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">All caught up for this deck.</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to decks
          </button>
        </div>
      )}
    </div>
  );
}
