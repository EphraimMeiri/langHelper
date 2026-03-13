export type CardSide = 'form' | 'parse';

export interface FlashcardSource {
  tableId: string;
  stem?: string;
  tense?: string;
  personNumberGender?: string;
}

export interface Flashcard {
  id: string;
  languageId: string;
  front: string;
  back: string;
  source: FlashcardSource;
  tags: string[];
}

export interface SM2State {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReview?: string;
}

export interface CardProgress {
  cardId: string;
  sm2: SM2State;
  totalReviews: number;
  correctReviews: number;
  createdAt: string;
  updatedAt: string;
}

export type Rating = 0 | 1 | 2 | 3 | 4 | 5;

export interface ReviewSession {
  id: string;
  deckId: string;
  startedAt: string;
  completedAt?: string;
  cardsReviewed: number;
  cardsCorrect: number;
}

export interface Deck {
  id: string;
  languageId: string;
  name: string;
  description?: string;
  sources: FlashcardSource[];
  cardIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardStats {
  totalCards: number;
  dueToday: number;
  reviewedToday: number;
  correctToday: number;
  streak: number;
  lastStudyDate?: string;
}

export function createInitialSM2State(): SM2State {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
  };
}

export function calculateNextSM2(
  state: SM2State,
  rating: Rating
): SM2State {
  const { easeFactor, interval, repetitions } = state;
  const now = new Date();

  if (rating < 3) {
    return {
      easeFactor,
      interval: 1,
      repetitions: 0,
      nextReview: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      lastReview: now.toISOString(),
    };
  }

  const newEF = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
  );

  let newInterval: number;
  if (repetitions === 0) {
    newInterval = 1;
  } else if (repetitions === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(interval * newEF);
  }

  return {
    easeFactor: newEF,
    interval: newInterval,
    repetitions: repetitions + 1,
    nextReview: new Date(
      now.getTime() + newInterval * 24 * 60 * 60 * 1000
    ).toISOString(),
    lastReview: now.toISOString(),
  };
}

export function isDueForReview(progress: CardProgress): boolean {
  return new Date(progress.sm2.nextReview) <= new Date();
}

export function getDueCards(progressMap: Map<string, CardProgress>): string[] {
  const now = new Date();
  const dueIds: string[] = [];

  for (const [cardId, progress] of progressMap) {
    if (new Date(progress.sm2.nextReview) <= now) {
      dueIds.push(cardId);
    }
  }

  return dueIds.sort((a, b) => {
    const pa = progressMap.get(a)!;
    const pb = progressMap.get(b)!;
    return (
      new Date(pa.sm2.nextReview).getTime() -
      new Date(pb.sm2.nextReview).getTime()
    );
  });
}
