import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Access API key from environment variables
const apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(apiKey);

// Default safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Function to generate knowledge
export async function generateKnowledgeWithGemini(question: string): Promise<string> {
  try {
    // For text-only input, use the gemini-1.5-pro model (updated from gemini-pro)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `You are a helpful, educational assistant. Answer the following question thoroughly but concisely in a way that would be useful for learning. Format your response with clear paragraphs, bullet points where appropriate, and use markdown for emphasis.
    
    Question: ${question}`;
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      safetySettings,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 800,
      },
    });
    
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

// Function to generate flashcards
export async function generateFlashcardsWithGemini(text: string): Promise<{ flashcards: Array<{ question: string, answer: string }> }> {
  try {
    // For text-only input, use the gemini-1.5-pro model (updated from gemini-pro)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `You are a helpful, educational assistant. Your task is to generate flashcards from the provided text. Create between 3-8 flashcards with clear questions and concise answers. Return your response as a JSON object with a 'flashcards' array containing objects with 'question' and 'answer' fields.

    For example:
    {
      "flashcards": [
        {
          "question": "What is photosynthesis?",
          "answer": "The process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water."
        },
        {
          "question": "What are the products of photosynthesis?",
          "answer": "Glucose and oxygen."
        }
      ]
    }
    
    Generate flashcards from this text: ${text}`;
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      safetySettings,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });
    
    const response = result.response;
    const responseText = response.text();
    
    // Extract the JSON part from the response
    let jsonStr = responseText;
    
    // If the response contains markdown code blocks, extract the JSON part
    if (responseText.includes("```json")) {
      jsonStr = responseText.split("```json")[1].split("```")[0].trim();
    } else if (responseText.includes("```")) {
      jsonStr = responseText.split("```")[1].split("```")[0].trim();
    }
    
    try {
      const flashcards = JSON.parse(jsonStr);
      return flashcards;
    } catch (parseError) {
      console.error("Error parsing JSON from Gemini response:", parseError);
      throw new Error("Failed to parse Gemini response into valid JSON");
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}