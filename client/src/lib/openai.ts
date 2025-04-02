import { apiRequest } from "./queryClient";
import type { FlashcardGeneration } from "@shared/schema";

// Generate knowledge from a question
export async function generateKnowledge(question: string): Promise<string> {
  const response = await apiRequest("POST", "/api/knowledge/generate", { question });
  const data = await response.json();
  return data.answer;
}

// Generate flashcards from text
export async function generateFlashcards(text: string): Promise<FlashcardGeneration> {
  const response = await apiRequest("POST", "/api/flashcards/generate", { text });
  const data = await response.json();
  return data;
}
