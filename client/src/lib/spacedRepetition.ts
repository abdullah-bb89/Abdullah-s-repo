// Spaced Repetition System for flashcards
// Based on SM-2 algorithm (SuperMemo 2) with modifications for ease of implementation
// See: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2

// Knowledge levels for spacing algorithm
export enum KnowledgeLevel {
  NEW = 0,         // Never seen before
  LEARNING = 1,    // Just started learning
  REVIEWING = 2,   // In review phase
  MASTERED = 3,    // Well understood
}

// Feedback types from the user
export enum FeedbackType {
  CONFUSED = 0,    // "😵 Confused" - Didn't know at all
  NOT_SURE = 1,    // "🤔 Not sure" - Remembered with difficulty
  GOT_IT = 2,      // "😊 Got it!" - Remembered correctly
  EASY = 3,        // "🔄 Review Again" - Very easy
}

interface CardReviewData {
  cardId: string | number;
  knowledgeLevel: KnowledgeLevel;
  easinessFactor: number;       // How easy is the card to remember (1.3 = hardest, 2.5 = easiest)
  consecutiveCorrect: number;   // How many times in a row the card was remembered correctly
  nextReviewDate: Date;         // When to review the card next
  lastReviewDate: Date | null;  // When the card was last reviewed
}

// Default intervals for each review (in days)
const DEFAULT_INTERVALS = [0, 1, 3, 7, 14, 30, 60, 120];

// Convert reaction emoji to feedback type
export function reactionToFeedback(reaction: string): FeedbackType {
  switch (reaction.toLowerCase()) {
    case "confused":
      return FeedbackType.CONFUSED;
    case "not sure":
      return FeedbackType.NOT_SURE;
    case "got it!":
      return FeedbackType.GOT_IT;
    case "review again":
      return FeedbackType.EASY;
    default:
      return FeedbackType.NOT_SURE;
  }
}

// Initialize a new card review data
export function initCardReview(cardId: string | number): CardReviewData {
  return {
    cardId,
    knowledgeLevel: KnowledgeLevel.NEW,
    easinessFactor: 2.5,  // Default easiness factor (SuperMemo's recommendation)
    consecutiveCorrect: 0,
    nextReviewDate: new Date(), // Review immediately
    lastReviewDate: null,
  };
}

// Get all card review data from local storage
export function getAllCardReviews(): Record<string, CardReviewData> {
  const storedData = localStorage.getItem('flashcard-reviews');
  if (!storedData) return {};
  
  try {
    const parsedData = JSON.parse(storedData);
    
    // Convert date strings back to Date objects
    Object.values(parsedData).forEach((card: any) => {
      card.nextReviewDate = new Date(card.nextReviewDate);
      card.lastReviewDate = card.lastReviewDate ? new Date(card.lastReviewDate) : null;
    });
    
    return parsedData;
  } catch (e) {
    console.error("Failed to parse card review data", e);
    return {};
  }
}

// Save all card review data to local storage
export function saveAllCardReviews(reviews: Record<string, CardReviewData>): void {
  localStorage.setItem('flashcard-reviews', JSON.stringify(reviews));
}

// Get card review data for a specific card
export function getCardReview(cardId: string | number): CardReviewData {
  const allReviews = getAllCardReviews();
  return allReviews[cardId.toString()] || initCardReview(cardId);
}

// Save card review data for a specific card
export function saveCardReview(review: CardReviewData): void {
  const allReviews = getAllCardReviews();
  allReviews[review.cardId.toString()] = review;
  saveAllCardReviews(allReviews);
}

// Process card review with user feedback
export function processReview(cardId: string | number, feedback: FeedbackType): CardReviewData {
  const review = getCardReview(cardId);
  const now = new Date();
  
  // Update review based on feedback
  if (feedback === FeedbackType.CONFUSED) {
    // Reset if user didn't remember
    review.consecutiveCorrect = 0;
    review.knowledgeLevel = KnowledgeLevel.LEARNING;
    review.easinessFactor = Math.max(1.3, review.easinessFactor - 0.3);
    review.nextReviewDate = new Date(now.getTime() + 1000 * 60 * 60 * 4); // Review in 4 hours
  } else {
    // User remembered to some degree
    review.consecutiveCorrect++;
    
    // Adjust difficulty based on how easily the user remembered
    const qualityOfRecall = feedback + 2; // Convert to SM-2 quality (2-5 scale)
    review.easinessFactor = Math.max(1.3, 
      review.easinessFactor + (0.1 - (5 - qualityOfRecall) * (0.08 + (5 - qualityOfRecall) * 0.02))
    );
    
    // Update knowledge level
    if (feedback >= FeedbackType.GOT_IT) {
      if (review.knowledgeLevel < KnowledgeLevel.MASTERED) {
        review.knowledgeLevel++;
      }
    }
    
    // Calculate next review interval
    let interval = 1; // Default 1 day
    
    if (review.knowledgeLevel === KnowledgeLevel.NEW) {
      interval = 1; // First review after 1 day
    } else if (review.knowledgeLevel === KnowledgeLevel.LEARNING) {
      interval = 3; // 3 days for learning cards
    } else if (review.knowledgeLevel === KnowledgeLevel.REVIEWING) {
      // If in review phase, use interval from consecutive correct answers
      interval = DEFAULT_INTERVALS[Math.min(review.consecutiveCorrect, DEFAULT_INTERVALS.length - 1)];
    } else if (review.knowledgeLevel === KnowledgeLevel.MASTERED) {
      // For mastered cards, use a longer interval modified by easiness factor
      interval = DEFAULT_INTERVALS[Math.min(review.consecutiveCorrect, DEFAULT_INTERVALS.length - 1)];
      interval = Math.round(interval * review.easinessFactor);
    }
    
    // Apply minimum interval based on feedback
    if (feedback === FeedbackType.NOT_SURE) {
      interval = Math.max(1, Math.floor(interval * 0.7)); // Review sooner if not confident
    } else if (feedback === FeedbackType.EASY) {
      interval = Math.floor(interval * 1.3); // Review later if very easy
    }
    
    // Calculate next review date
    review.nextReviewDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * interval);
  }
  
  review.lastReviewDate = now;
  saveCardReview(review);
  return review;
}

// Get cards due for review
export function getDueCards(): string[] {
  const allReviews = getAllCardReviews();
  const now = new Date();
  
  return Object.values(allReviews)
    .filter(review => review.nextReviewDate <= now)
    .map(review => review.cardId.toString());
}

// Get cards due for review soon (within next X days)
export function getUpcomingReviews(days = 3): string[] {
  const allReviews = getAllCardReviews();
  const now = new Date();
  const futureDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * days);
  
  return Object.values(allReviews)
    .filter(review => review.nextReviewDate > now && review.nextReviewDate <= futureDate)
    .map(review => review.cardId.toString());
}

// Get review statistics (for analytics)
export function getReviewStats() {
  const allReviews = getAllCardReviews();
  const reviews = Object.values(allReviews);
  
  return {
    totalCards: reviews.length,
    newCards: reviews.filter(r => r.knowledgeLevel === KnowledgeLevel.NEW).length,
    learningCards: reviews.filter(r => r.knowledgeLevel === KnowledgeLevel.LEARNING).length,
    reviewingCards: reviews.filter(r => r.knowledgeLevel === KnowledgeLevel.REVIEWING).length,
    masteredCards: reviews.filter(r => r.knowledgeLevel === KnowledgeLevel.MASTERED).length,
    dueCards: getDueCards().length,
    upcomingCards: getUpcomingReviews().length,
  };
}

// Get the next review date as a formatted string
export function getNextReviewDateText(cardId: string | number): string {
  const review = getCardReview(cardId);
  const now = new Date();
  const reviewDate = review.nextReviewDate;
  
  // If review is overdue
  if (reviewDate <= now) {
    return "Due now";
  }
  
  const diffTime = Math.abs(reviewDate.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) {
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return `Due in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
  } else if (diffDays === 1) {
    return "Due tomorrow";
  } else if (diffDays < 7) {
    return `Due in ${diffDays} days`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Due in ${weeks} week${weeks === 1 ? '' : 's'}`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `Due in ${months} month${months === 1 ? '' : 's'}`;
  }
}

// Get text representation of knowledge level
export function getKnowledgeLevelText(cardId: string | number): string {
  const review = getCardReview(cardId);
  
  switch (review.knowledgeLevel) {
    case KnowledgeLevel.NEW:
      return "New";
    case KnowledgeLevel.LEARNING:
      return "Learning";
    case KnowledgeLevel.REVIEWING:
      return "Reviewing";
    case KnowledgeLevel.MASTERED:
      return "Mastered";
    default:
      return "Unknown";
  }
}