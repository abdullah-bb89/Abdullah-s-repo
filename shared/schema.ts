import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  firebaseUid: text("firebase_uid").unique(),
});

export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  setId: integer("set_id").notNull(),
  backgroundColor: text("background_color"),
  textColor: text("text_color"),
  font: text("font"),
  imageUrl: text("image_url"),
  difficulty: text("difficulty"),
  tags: text("tags").array(),
});

export const flashcardSets = pgTable("flashcard_sets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  userId: integer("user_id").notNull(),
  originalQuestion: text("original_question").notNull(),
  originalAnswer: text("original_answer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  cardCount: integer("card_count").notNull(),
  description: text("description"),
  category: text("category"),
  isPublic: boolean("is_public").default(false),
  defaultCardStyle: text("default_card_style"), // JSON string for default styling
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertFlashcardSchema = createInsertSchema(flashcards).omit({
  id: true,
});

export const insertFlashcardSetSchema = createInsertSchema(flashcardSets).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type Flashcard = typeof flashcards.$inferSelect;

export type InsertFlashcardSet = z.infer<typeof insertFlashcardSetSchema>;
export type FlashcardSet = typeof flashcardSets.$inferSelect;

// Response schema for AI flashcard generation
export const flashcardGenerationSchema = z.object({
  flashcards: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
      font: z.string().optional(),
      difficulty: z.string().optional(),
      tags: z.array(z.string()).optional()
    })
  ),
  setInfo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    defaultCardStyle: z.string().optional()
  }).optional()
});

export type FlashcardGeneration = z.infer<typeof flashcardGenerationSchema>;
