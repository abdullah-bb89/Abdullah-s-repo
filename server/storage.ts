import { 
  users, type User, type InsertUser,
  flashcards, type Flashcard, type InsertFlashcard,
  flashcardSets, type FlashcardSet, type InsertFlashcardSet 
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private flashcards: Map<number, Flashcard>;
  private flashcardSets: Map<number, FlashcardSet>;
  private currentUserId: number;
  private currentFlashcardId: number;
  private currentFlashcardSetId: number;

  constructor() {
    this.users = new Map();
    this.flashcards = new Map();
    this.flashcardSets = new Map();
    this.currentUserId = 1;
    this.currentFlashcardId = 1;
    this.currentFlashcardSetId = 1;
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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Flashcard operations
  async createFlashcard(insertFlashcard: InsertFlashcard): Promise<Flashcard> {
    const id = this.currentFlashcardId++;
    const flashcard: Flashcard = { ...insertFlashcard, id };
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
    const flashcardSet: FlashcardSet = { 
      ...insertFlashcardSet, 
      id, 
      createdAt: now
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
}

export const storage = new MemStorage();
