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
    <Card className="mt-8 rounded-xl shadow-xl overflow-hidden border-0"
      style={{ 
        background: 'linear-gradient(145deg, rgba(69, 90, 100, 0.9) 0%, rgba(38, 50, 56, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div className="h-2" style={{ backgroundColor: 'var(--color-blazing-amber)' }}></div>
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
            style={{ backgroundColor: 'var(--color-blazing-amber)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="black">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'white' }}>Knowledge Generated</h2>
        </div>
        
        <div 
          className="mt-4 px-4 py-5 rounded-lg prose prose-invert max-w-none"
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.2)',
            color: 'white',
            fontSize: '1.05rem',
            lineHeight: '1.6'
          }}
          dangerouslySetInnerHTML={{ __html: answer }}
        />
        
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleCreateFlashcards}
            className="rounded-lg h-12 px-6 transition-all duration-200 hover:scale-[1.02] flex items-center"
            style={{ 
              backgroundColor: 'var(--color-blazing-amber)',
              color: 'black',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Quiz...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Create Quiz from Knowledge
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
