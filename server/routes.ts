import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertFlashcardSchema, 
  insertFlashcardSetSchema, 
  flashcardGenerationSchema,
  type InsertFlashcardSet,
  type InsertFlashcard
} from "@shared/schema";
import OpenAI from "openai";

// Initialize OpenAI API
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key-for-development" 
});

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
      
      if (!firebaseUid || !email) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if user already exists
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        // Create username from email
        const username = email.split('@')[0] + Math.floor(Math.random() * 10000);
        
        user = await storage.createUser({
          username,
          email,
          firebaseUid,
          displayName: displayName || username,
          photoURL: photoURL || null,
          password: null,
        });
      }
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
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
      
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful, educational assistant. Answer the user's question thoroughly but concisely in a way that would be useful for learning. Format your response with clear paragraphs, bullet points where appropriate, and use markdown for emphasis."
          },
          {
            role: "user",
            content: question
          }
        ],
        temperature: 0.7,
      });
      
      const answer = completion.choices[0].message.content;
      
      res.status(200).json({ answer });
    } catch (error) {
      console.error("OpenAI API error:", error);
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
      
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful, educational assistant. Your task is to generate flashcards from the provided text. Create between 3-8 flashcards with clear questions and concise answers. Return your response as a JSON object with a 'flashcards' array containing objects with 'question' and 'answer' fields."
          },
          {
            role: "user",
            content: `Generate flashcards from this text: ${text}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
      
      const responseJson = JSON.parse(completion.choices[0].message.content);
      const flashcards = flashcardGenerationSchema.parse(responseJson);
      
      res.status(200).json(flashcards);
    } catch (error) {
      console.error("Flashcard generation error:", error);
      res.status(500).json({ message: "Failed to generate flashcards" });
    }
  });
  
  // Flashcard set routes
  app.post("/api/flashcard-sets", async (req: Request, res: Response) => {
    try {
      const { userId, title, originalQuestion, originalAnswer, flashcards } = req.body;
      
      if (!userId || !title || !originalQuestion || !originalAnswer || !flashcards || !Array.isArray(flashcards)) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create flashcard set
      const flashcardSetData: InsertFlashcardSet = {
        userId,
        title,
        originalQuestion,
        originalAnswer,
        cardCount: flashcards.length
      };
      
      const flashcardSet = await storage.createFlashcardSet(flashcardSetData);
      
      // Create flashcards
      const flashcardPromises = flashcards.map((card: {question: string, answer: string}) => {
        const flashcardData: InsertFlashcard = {
          question: card.question,
          answer: card.answer,
          setId: flashcardSet.id
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

  const httpServer = createServer(app);
  return httpServer;
}
