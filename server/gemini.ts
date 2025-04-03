import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Access API key from environment variables
// Use trim() to remove any whitespace that might have been included when setting the key
const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';

console.log('GEMINI_API_KEY available:', !!apiKey); // Debug - don't log actual key

if (!apiKey) {
  console.error('GEMINI_API_KEY environment variable is not set or empty');
  // Use a fallback approach instead of throwing an error
  console.warn('Using fallback for API functionality - some features may be limited');
}

// Initialize the Gemini API client with key or empty string (will fail gracefully later)
const genAI = new GoogleGenerativeAI(apiKey || '');

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
  // If no API key is available, return a message about it
  if (!apiKey) {
    return "To use AI-generated content, please set up your GEMINI_API_KEY in the environment variables. This application requires a valid Google Gemini AI API key to generate knowledge.";
  }

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
    
    // Return a more user-friendly error message
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return "Error: Invalid or expired Gemini API key. Please update your API key in the environment settings.";
      }
      
      if (error.message.includes("quota")) {
        return "Error: Gemini API quota exceeded. Please try again later or upgrade your API plan.";
      }
    }
    
    throw error;
  }
}

// Function to generate flashcards with enhanced customization
export async function generateFlashcardsWithGemini(text: string): Promise<{ 
  flashcards: Array<{ 
    question: string, 
    answer: string, 
    backgroundColor?: string,
    textColor?: string,
    font?: string,
    difficulty?: string,
    tags?: string[]
  }>,
  setInfo?: {
    title?: string,
    description?: string,
    category?: string,
    defaultCardStyle?: string
  }
}> {
  // If no API key is available, return sample flashcards with a notice
  if (!apiKey) {
    return {
      flashcards: [
        {
          question: "API Key Required",
          answer: "To generate flashcards with AI, please set up your GEMINI_API_KEY in the environment variables.",
          backgroundColor: "#f8e5e5",
          textColor: "#c62828",
          font: "sans-serif",
          difficulty: "medium",
          tags: ["Setup", "Configuration"]
        },
        {
          question: "How to get a Gemini API Key?",
          answer: "Visit the Google AI Studio website, create an account, and generate an API key for the Gemini model.",
          backgroundColor: "#e5f6ff",
          textColor: "#0277bd",
          font: "sans-serif",
          difficulty: "easy",
          tags: ["Setup", "Google"]
        }
      ],
      setInfo: {
        title: "API Configuration Required",
        description: "Information about setting up the required API key for this application",
        category: "Configuration"
      }
    };
  }

  try {
    // For text-only input, use the gemini-1.5-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `You are a helpful, educational assistant. Your task is to generate enhanced flashcards from the provided text. Create between 3-8 flashcards with clear questions and concise answers.

    Return your response as a JSON object with:
    1. A 'flashcards' array containing flashcard objects with the following fields:
       - 'question': The main question (required)
       - 'answer': The answer to the question (required)
       - 'backgroundColor': A suitable HEX color code for the card (optional)
       - 'textColor': A complementary HEX color code for the text (optional)
       - 'font': A font suggestion like 'serif', 'sans-serif', or 'monospace' (optional)
       - 'difficulty': A difficulty level - 'easy', 'medium', or 'hard' (optional)
       - 'tags': An array of 1-3 relevant topic tags (optional)
    
    2. A 'setInfo' object containing:
       - 'title': A concise title for this flashcard set (optional)
       - 'description': A brief description of what this set covers (optional)
       - 'category': A category for the flashcard set such as "Science", "History", etc. (optional)

    For example:
    {
      "flashcards": [
        {
          "question": "What is photosynthesis?",
          "answer": "The process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water.",
          "backgroundColor": "#e6f7e9",
          "textColor": "#2c5e2e",
          "font": "sans-serif",
          "difficulty": "medium",
          "tags": ["Biology", "Plants", "Energy"]
        },
        {
          "question": "What are the products of photosynthesis?",
          "answer": "Glucose and oxygen.",
          "backgroundColor": "#e1f5fe",
          "textColor": "#0277bd",
          "font": "sans-serif",
          "difficulty": "easy",
          "tags": ["Biology", "Chemistry"]
        }
      ],
      "setInfo": {
        "title": "Photosynthesis Fundamentals",
        "description": "Basic concepts of how plants convert light energy to chemical energy",
        "category": "Biology"
      }
    }
    
    Analyze and generate flashcards from this text: ${text}`;
    
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
      
      // Ensure consistent structure even if some fields are missing
      if (!flashcards.setInfo) {
        flashcards.setInfo = {};
      }
      
      // Clean up any unexpected properties
      flashcards.flashcards = flashcards.flashcards.map((card: any) => ({
        question: card.question,
        answer: card.answer,
        backgroundColor: card.backgroundColor,
        textColor: card.textColor,
        font: card.font,
        difficulty: card.difficulty,
        tags: card.tags || []
      }));
      
      return flashcards;
    } catch (parseError) {
      console.error("Error parsing JSON from Gemini response:", parseError);
      throw new Error("Failed to parse Gemini response into valid JSON");
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    
    // For specific errors, provide informative flashcards rather than failing
    if (error instanceof Error) {
      if (error.message.includes("API key") || error.message.includes("invalid key")) {
        return {
          flashcards: [
            {
              question: "API Key Error",
              answer: "Your Gemini API key appears to be invalid or expired. Please update it in the environment settings.",
              backgroundColor: "#f8e5e5",
              textColor: "#c62828",
              font: "sans-serif",
              difficulty: "medium", 
              tags: ["Error", "Configuration"]
            }
          ],
          setInfo: {
            title: "API Key Issue",
            description: "There's a problem with your Gemini API key",
            category: "Errors"
          }
        };
      }
      
      if (error.message.includes("quota")) {
        return {
          flashcards: [
            {
              question: "API Quota Exceeded",
              answer: "You've reached your quota limit for the Gemini API. Please try again later or upgrade your plan.",
              backgroundColor: "#fff8e1",
              textColor: "#ff8f00",
              font: "sans-serif",
              difficulty: "medium",
              tags: ["Error", "Quota"]
            }
          ],
          setInfo: {
            title: "API Usage Limit",
            description: "Information about your Gemini API usage limitations",
            category: "Errors"
          }
        };
      }
    }
    
    throw error;
  }
}