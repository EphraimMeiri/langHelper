import { useMemo } from 'react';
import type { Deck, CardProgress } from '../../types/flashcard.ts';
import { getDueCards } from '../../types/flashcard.ts';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getStreak(reviewHistory: Record<string, { reviewed: number }>): number {
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!reviewHistory[key]?.reviewed) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

interface DeckSelectorProps {
  decks: Deck[];
  cards: { id: string; languageId: string }[];
  progress: Record<string, CardProgress>;
  reviewHistory: Record<string, { reviewed: number }>;
  currentLanguageId: string | undefined;
  onCreateDeck: () => void;
  onStartDeck: (deckId: string) => void;
  onDeleteDeck: (deckId: string) => void;
}

export function DeckSelector({
  decks,
  cards,
  progress,
  reviewHistory,
  currentLanguageId,
  onCreateDeck,
  onStartDeck,
  onDeleteDeck,
}: DeckSelectorProps) {
  const stats = useMemo(() => {
    const todayKey = getTodayKey();
    const progressMap = new Map(Object.entries(progress).map(([id, value]) => [id, value]));
    const dueIds = getDueCards(progressMap);

    const languageCards = currentLanguageId
      ? cards.filter((card) => card.languageId === currentLanguageId)
      : cards;
    const languageCardIds = new Set(languageCards.map((card) => card.id));

    const dueToday = dueIds.filter((id) => languageCardIds.has(id)).length;
    const reviewedToday = Object.values(progress).filter((entry) => {
      const lastReview = entry.sm2.lastReview;
      return lastReview?.startsWith(todayKey) && languageCardIds.has(entry.cardId);
    }).length;

    return {
      dueToday,
      reviewedToday,
      streak: getStreak(reviewHistory),
    };
  }, [cards, currentLanguageId, progress, reviewHistory]);

  const deckStats = useMemo(() => {
    const progressMap = new Map(Object.entries(progress).map(([id, value]) => [id, value]));
    const dueIds = getDueCards(progressMap);
    const dueSet = new Set(dueIds);

    return decks.map((deck) => ({
      id: deck.id,
      dueCount: deck.cardIds.filter((cardId) => dueSet.has(cardId)).length,
      total: deck.cardIds.length,
    }));
  }, [decks, progress]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Study Statistics</h3>
          <button
            onClick={onCreateDeck}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Create Deck
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.dueToday}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Due Today</div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.reviewedToday}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Reviewed Today</div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.streak}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Day Streak</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Decks</h3>
        {decks.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-6">
            <p className="mb-4">No decks available yet.</p>
            <button
              onClick={onCreateDeck}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Deck from Tables or SEDRA
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {decks.map((deck) => {
              const statsEntry = deckStats.find((entry) => entry.id === deck.id);
              return (
                <div
                  key={deck.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{deck.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {statsEntry?.dueCount ?? 0} due · {statsEntry?.total ?? 0} cards
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onStartDeck(deck.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Study
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete deck "${deck.name}"? This cannot be undone.`)) {
                          onDeleteDeck(deck.id);
                        }
                      }}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete deck"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
