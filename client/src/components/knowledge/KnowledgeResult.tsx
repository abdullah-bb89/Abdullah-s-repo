import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateFlashcards } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { type FlashcardGeneration } from "@shared/schema";

interface KnowledgeResultProps {
  answer: string;
  onFlashcardsCreated: (flashcards: FlashcardGeneration) => void;
}

export default function KnowledgeResult({ answer, onFlashcardsCreated }: KnowledgeResultProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateFlashcards = async () => {
    setIsLoading(true);
    try {
      const flashcards = await generateFlashcards(answer);
      onFlashcardsCreated(flashcards);
    } catch (error) {
      let message = "Failed to generate flashcards";
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <h2 className="text-lg font-medium text-gray-900">Here's what I found</h2>
        <div 
          className="mt-3 prose prose-sm text-gray-700"
          dangerouslySetInnerHTML={{ __html: answer }}
        />
        <div className="mt-5">
          <Button
            onClick={handleCreateFlashcards}
            className="inline-flex items-center bg-amber-500 hover:bg-amber-600"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Create Flashcards
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
