import { 
  users, type User, type InsertUser,
  flashcards, type Flashcard, type InsertFlashcard,
  flashcardSets, type FlashcardSet, type InsertFlashcardSet,
  quizScores, type QuizScore, type InsertQuizScore
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Flashcard operations
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  getFlashcardsBySetId(setId: number): Promise<Flashcard[]>;
  
  // Flashcard set operations
  createFlashcardSet(set: InsertFlashcardSet): Promise<FlashcardSet>;
  getFlashcardSetsByUserId(userId: number): Promise<FlashcardSet[]>;
  getFlashcardSet(id: number): Promise<FlashcardSet | undefined>;
  deleteFlashcardSet(id: number): Promise<void>;
  
  // Quiz score operations
  createQuizScore(score: InsertQuizScore): Promise<QuizScore>;
  getQuizScoresByUserId(userId: number): Promise<QuizScore[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private flashcards: Map<number, Flashcard>;
  private flashcardSets: Map<number, FlashcardSet>;
  private quizScores: Map<number, QuizScore>;
  private currentUserId: number;
  private currentFlashcardId: number;
  private currentFlashcardSetId: number;
  private currentQuizScoreId: number;

  constructor() {
    this.users = new Map();
    this.flashcards = new Map();
    this.flashcardSets = new Map();
    this.quizScores = new Map();
    this.currentUserId = 1;
    this.currentFlashcardId = 1;
    this.currentFlashcardSetId = 1;
    this.currentQuizScoreId = 1;
    
    // Create a default test user to fix the "User not found" issue
    const testUser: User = {
      id: 1,
      username: "testuser",
      email: "test@example.com",
      password: null,
      displayName: "Test User",
      photoURL: null,
      firebaseUid: "test-firebase-uid"
    };
    this.users.set(testUser.id, testUser);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    
    // Ensure null values for nullable fields
    const user: User = { 
      ...insertUser, 
      id,
      displayName: insertUser.displayName ?? null,
      password: insertUser.password ?? null,
      photoURL: insertUser.photoURL ?? null,
      firebaseUid: insertUser.firebaseUid ?? null
    };
    
    this.users.set(id, user);
    return user;
  }

  // Flashcard operations
  async createFlashcard(insertFlashcard: InsertFlashcard): Promise<Flashcard> {
    const id = this.currentFlashcardId++;
    
    // Ensure null values for nullable fields
    const flashcard: Flashcard = { 
      ...insertFlashcard, 
      id,
      backgroundColor: insertFlashcard.backgroundColor ?? null,
      textColor: insertFlashcard.textColor ?? null,
      font: insertFlashcard.font ?? null,
      difficulty: insertFlashcard.difficulty ?? null,
      tags: insertFlashcard.tags ?? [],
      imageUrl: insertFlashcard.imageUrl ?? null
    };
    
    this.flashcards.set(id, flashcard);
    return flashcard;
  }

  async getFlashcardsBySetId(setId: number): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values()).filter(
      (flashcard) => flashcard.setId === setId,
    );
  }

  // Flashcard set operations
  async createFlashcardSet(insertFlashcardSet: InsertFlashcardSet): Promise<FlashcardSet> {
    const id = this.currentFlashcardSetId++;
    const now = new Date();
    
    // Ensure null values for nullable fields
    const flashcardSet: FlashcardSet = { 
      ...insertFlashcardSet, 
      id, 
      createdAt: now,
      description: insertFlashcardSet.description ?? null,
      category: insertFlashcardSet.category ?? null,
      isPublic: insertFlashcardSet.isPublic ?? false,
      defaultCardStyle: insertFlashcardSet.defaultCardStyle ?? null
    };
    
    this.flashcardSets.set(id, flashcardSet);
    return flashcardSet;
  }

  async getFlashcardSetsByUserId(userId: number): Promise<FlashcardSet[]> {
    return Array.from(this.flashcardSets.values())
      .filter((set) => set.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by newest first
  }

  async getFlashcardSet(id: number): Promise<FlashcardSet | undefined> {
    return this.flashcardSets.get(id);
  }

  async deleteFlashcardSet(id: number): Promise<void> {
    // Delete the set
    this.flashcardSets.delete(id);
    
    // Delete all associated flashcards
    Array.from(this.flashcards.entries())
      .filter(([_, flashcard]) => flashcard.setId === id)
      .forEach(([flashcardId, _]) => this.flashcards.delete(flashcardId));
  }

  // Quiz score operations
  async createQuizScore(insertQuizScore: InsertQuizScore): Promise<QuizScore> {
    const id = this.currentQuizScoreId++;
    const now = new Date();
    
    // Ensure null values for nullable fields
    const quizScore: QuizScore = { 
      ...insertQuizScore, 
      id, 
      createdAt: now,
      quizContent: insertQuizScore.quizContent ?? null
    };
    
    this.quizScores.set(id, quizScore);
    return quizScore;
  }

  async getQuizScoresByUserId(userId: number): Promise<QuizScore[]> {
    return Array.from(this.quizScores.values())
      .filter((score) => score.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by newest first
  }
}

export const storage = new MemStorage();
