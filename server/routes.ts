import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertFlashcardSchema, 
  insertFlashcardSetSchema,
  insertQuizScoreSchema, 
  flashcardGenerationSchema,
  type InsertFlashcardSet,
  type InsertFlashcard,
  type InsertQuizScore
} from "@shared/schema";
import { generateKnowledgeWithGemini, generateFlashcardsWithGemini } from "./gemini";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      if (userData.username) {
        const existingUserByUsername = await storage.getUserByUsername(userData.username);
        if (existingUserByUsername) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }
      
      const user = await storage.createUser(userData);
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/firebase", async (req: Request, res: Response) => {
    try {
      const { firebaseUid, email, displayName, photoURL } = req.body;
      
      if (!firebaseUid) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if user already exists
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        // For test/mock users, handle missing email case
        const userEmail = email || "test@example.com";
        
        // Create username from email
        const username = userEmail.split('@')[0] + Math.floor(Math.random() * 10000);
        
        user = await storage.createUser({
          username,
          email: userEmail,
          firebaseUid,
          displayName: displayName || username,
          photoURL: photoURL || null,
          password: null,
        });
      }
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      
      // Log success
      console.log("Firebase auth sync successful for uid:", firebaseUid);
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Firebase auth sync error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Knowledge generation route
  app.post("/api/knowledge/generate", async (req: Request, res: Response) => {
    try {
      const { question } = req.body;
      
      if (!question || typeof question !== "string") {
        return res.status(400).json({ message: "Question is required" });
      }
      
      // Use Gemini API to generate knowledge
      const answer = await generateKnowledgeWithGemini(question);
      
      res.status(200).json({ answer });
    } catch (error) {
      console.error("Gemini API error:", error);
      
      // Check if this is a quota or error related to the API key
      if ((error as Error).message && (
          (error as Error).message.includes('quota') || 
          (error as Error).message.includes('API key') ||
          (error as Error).message.includes('invalid key')
        )) {
        return res.status(429).json({ 
          message: "API quota exceeded or invalid key. Please try again later or contact the administrator.",
          error: "api_error"
        });
      }
      
      res.status(500).json({ message: "Failed to generate knowledge" });
    }
  });
  
  // Flashcard generation route
  app.post("/api/flashcards/generate", async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== "string") {
        return res.status(400).json({ message: "Text is required" });
      }
      
      // Use Gemini API to generate flashcards
      const flashcards = await generateFlashcardsWithGemini(text);
      
      // Validate the response structure against our schema
      const validatedFlashcards = flashcardGenerationSchema.parse(flashcards);
      
      res.status(200).json(validatedFlashcards);
    } catch (error) {
      console.error("Flashcard generation error:", error);
      
      // Check if this is a quota or error related to the API key
      if ((error as Error).message && (
          (error as Error).message.includes('quota') || 
          (error as Error).message.includes('API key') ||
          (error as Error).message.includes('invalid key')
        )) {
        return res.status(429).json({ 
          message: "API quota exceeded or invalid key. Please try again later or contact the administrator.",
          error: "api_error"
        });
      }
      
      // Check if this is a JSON parsing error
      if ((error as Error).message && (error as Error).message.includes('parse')) {
        return res.status(500).json({ 
          message: "Failed to parse AI response into valid flashcards. Please try again.",
          error: "parsing_error"
        });
      }
      
      res.status(500).json({ message: "Failed to generate flashcards" });
    }
  });
  
  // Direct quiz generation endpoint
  app.post("/api/quiz/generate", async (req: Request, res: Response) => {
    try {
      const { topic } = req.body;
      
      if (!topic || typeof topic !== "string") {
        return res.status(400).json({ message: "Topic is required" });
      }
      
      // First, generate knowledge on the topic
      const knowledge = await generateKnowledgeWithGemini(topic);
      
      // Then, generate flashcards from that knowledge
      const flashcards = await generateFlashcardsWithGemini(knowledge);
      
      // Validate the response structure
      const validatedFlashcards = flashcardGenerationSchema.parse(flashcards);
      
      // Return both knowledge and flashcards
      res.status(200).json({
        knowledge,
        flashcards: validatedFlashcards
      });
    } catch (error) {
      console.error("Direct quiz generation error:", error);
      
      // Check if this is a quota or error related to the API key
      if ((error as Error).message && (
          (error as Error).message.includes('quota') || 
          (error as Error).message.includes('API key') ||
          (error as Error).message.includes('invalid key')
        )) {
        return res.status(429).json({ 
          message: "API quota exceeded or invalid key. Please try again later or contact the administrator.",
          error: "api_error"
        });
      }
      
      // Check if this is a JSON parsing error
      if ((error as Error).message && (error as Error).message.includes('parse')) {
        return res.status(500).json({ 
          message: "Failed to parse AI response. Please try again.",
          error: "parsing_error"
        });
      }
      
      res.status(500).json({ message: "Failed to generate quiz" });
    }
  });
  
  // Flashcard set routes
  app.post("/api/flashcard-sets", async (req: Request, res: Response) => {
    try {
      const { userId, title, originalQuestion, originalAnswer, flashcards, description, category, isPublic, defaultCardStyle } = req.body;
      
      if (!userId || !title || !originalQuestion || !originalAnswer || !flashcards || !Array.isArray(flashcards)) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create flashcard set with enhanced properties
      const flashcardSetData: InsertFlashcardSet = {
        userId,
        title,
        originalQuestion,
        originalAnswer,
        cardCount: flashcards.length,
        description: description || null,
        category: category || null,
        isPublic: isPublic || false,
        defaultCardStyle: defaultCardStyle || null
      };
      
      const flashcardSet = await storage.createFlashcardSet(flashcardSetData);
      
      // Create flashcards with enhanced properties
      const flashcardPromises = flashcards.map((card: {
        question: string, 
        answer: string,
        backgroundColor?: string,
        textColor?: string,
        font?: string,
        difficulty?: string,
        tags?: string[],
        imageUrl?: string
      }) => {
        const flashcardData: InsertFlashcard = {
          question: card.question,
          answer: card.answer,
          setId: flashcardSet.id,
          backgroundColor: card.backgroundColor || null,
          textColor: card.textColor || null,
          font: card.font || null,
          difficulty: card.difficulty || null,
          tags: card.tags || [],
          imageUrl: card.imageUrl || null
        };
        return storage.createFlashcard(flashcardData);
      });
      
      await Promise.all(flashcardPromises);
      
      res.status(201).json(flashcardSet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/users/:userId/flashcard-sets", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const flashcardSets = await storage.getFlashcardSetsByUserId(userId);
      
      res.status(200).json(flashcardSets);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/flashcard-sets/:setId", async (req: Request, res: Response) => {
    try {
      const setId = parseInt(req.params.setId);
      
      if (isNaN(setId)) {
        return res.status(400).json({ message: "Invalid set ID" });
      }
      
      const flashcardSet = await storage.getFlashcardSet(setId);
      
      if (!flashcardSet) {
        return res.status(404).json({ message: "Flashcard set not found" });
      }
      
      const flashcards = await storage.getFlashcardsBySetId(setId);
      
      res.status(200).json({ ...flashcardSet, flashcards });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.delete("/api/flashcard-sets/:setId", async (req: Request, res: Response) => {
    try {
      const setId = parseInt(req.params.setId);
      
      if (isNaN(setId)) {
        return res.status(400).json({ message: "Invalid set ID" });
      }
      
      const flashcardSet = await storage.getFlashcardSet(setId);
      
      if (!flashcardSet) {
        return res.status(404).json({ message: "Flashcard set not found" });
      }
      
      await storage.deleteFlashcardSet(setId);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Quiz score routes
  app.post("/api/quiz-scores", async (req: Request, res: Response) => {
    try {
      const quizScoreData = insertQuizScoreSchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUser(quizScoreData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const quizScore = await storage.createQuizScore(quizScoreData);
      
      res.status(201).json(quizScore);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/users/:userId/quiz-scores", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const quizScores = await storage.getQuizScoresByUserId(userId);
      
      res.status(200).json(quizScores);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
