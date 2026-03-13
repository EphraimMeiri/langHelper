import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Flashcard, Deck, CardProgress, Rating } from '../types/flashcard';
import { calculateNextSM2, createInitialSM2State } from '../types/flashcard';

interface ReviewHistoryEntry {
  reviewed: number;
  correct: number;
}

interface FlashcardStore {
  cards: Flashcard[];
  decks: Deck[];
  progress: Record<string, CardProgress>;
  reviewHistory: Record<string, ReviewHistoryEntry>;

  createDeck: (deck: Deck, cards: Flashcard[]) => void;
  deleteDeck: (deckId: string) => void;
  recordReview: (cardId: string, rating: Rating) => void;
  getDeckCards: (deckId: string) => Flashcard[];
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useFlashcardStore = create<FlashcardStore>()(
  persist(
    (set, get) => ({
      cards: [],
      decks: [],
      progress: {},
      reviewHistory: {},

      createDeck: (deck, newCards) => {
        const { cards, decks, progress } = get();
        const now = new Date().toISOString();

        const updatedDeck: Deck = {
          ...deck,
          createdAt: deck.createdAt || now,
          updatedAt: now,
        };

        const nextCards = [...cards, ...newCards];
        const nextProgress = { ...progress };

        for (const card of newCards) {
          if (!nextProgress[card.id]) {
            nextProgress[card.id] = {
              cardId: card.id,
              sm2: createInitialSM2State(),
              totalReviews: 0,
              correctReviews: 0,
              createdAt: now,
              updatedAt: now,
            };
          }
        }

        set({
          cards: nextCards,
          decks: [...decks.filter((d) => d.id !== deck.id), updatedDeck],
          progress: nextProgress,
        });
      },

      deleteDeck: (deckId) => {
        const { cards, decks, progress } = get();
        const deck = decks.find((d) => d.id === deckId);
        if (!deck) return;

        // Find card IDs that belong only to this deck
        const otherDecks = decks.filter((d) => d.id !== deckId);
        const cardIdsInOtherDecks = new Set(otherDecks.flatMap((d) => d.cardIds));
        const orphanedCardIds = new Set(
          deck.cardIds.filter((id) => !cardIdsInOtherDecks.has(id))
        );

        // Remove orphaned cards and their progress
        const nextCards = cards.filter((c) => !orphanedCardIds.has(c.id));
        const nextProgress = { ...progress };
        for (const id of orphanedCardIds) {
          delete nextProgress[id];
        }

        set({
          decks: otherDecks,
          cards: nextCards,
          progress: nextProgress,
        });
      },

      recordReview: (cardId, rating) => {
        const { progress, reviewHistory } = get();
        const now = new Date().toISOString();
        const today = getTodayKey();

        const current = progress[cardId] || {
          cardId,
          sm2: createInitialSM2State(),
          totalReviews: 0,
          correctReviews: 0,
          createdAt: now,
          updatedAt: now,
        };

        const nextSm2 = calculateNextSM2(current.sm2, rating);
        const isCorrect = rating >= 3;

        const nextProgress: CardProgress = {
          ...current,
          sm2: nextSm2,
          totalReviews: current.totalReviews + 1,
          correctReviews: current.correctReviews + (isCorrect ? 1 : 0),
          updatedAt: now,
        };

        const existingHistory = reviewHistory[today] || { reviewed: 0, correct: 0 };
        const nextHistory = {
          ...reviewHistory,
          [today]: {
            reviewed: existingHistory.reviewed + 1,
            correct: existingHistory.correct + (isCorrect ? 1 : 0),
          },
        };

        set({
          progress: { ...progress, [cardId]: nextProgress },
          reviewHistory: nextHistory,
        });
      },

      getDeckCards: (deckId) => {
        const { cards, decks } = get();
        const deck = decks.find((d) => d.id === deckId);
        if (!deck) return [];
        return cards.filter((card) => deck.cardIds.includes(card.id));
      },
    }),
    {
      name: 'lang-helper-flashcards',
      partialize: (state) => ({
        cards: state.cards,
        decks: state.decks,
        progress: state.progress,
        reviewHistory: state.reviewHistory,
      }),
    }
  )
);
