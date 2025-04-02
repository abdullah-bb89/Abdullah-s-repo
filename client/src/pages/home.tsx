import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { type FlashcardGeneration } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import KnowledgeForm from "@/components/knowledge/KnowledgeForm";
import KnowledgeResult from "@/components/knowledge/KnowledgeResult";
import FlashCard from "@/components/flashcards/FlashCard";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [_, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [knowledgeResult, setKnowledgeResult] = useState("");
  const [flashcards, setFlashcards] = useState<FlashcardGeneration | null>(null);
  const [saving, setSaving] = useState(false);

  // Auth redirect effect
  useEffect(() => {
    if (!loading && !user) {
      // Redirect to auth page if not authenticated
      setLocation("/auth");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const handleKnowledgeGenerated = (question: string, answer: string) => {
    setCurrentQuestion(question);
    setKnowledgeResult(answer);
    setFlashcards(null);
  };

  const handleFlashcardsCreated = (generatedFlashcards: FlashcardGeneration) => {
    setFlashcards(generatedFlashcards);
    
    // Scroll to flashcards section
    setTimeout(() => {
      document.getElementById("flashcards-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSaveFlashcards = async () => {
    if (!user || !flashcards || !currentQuestion || !knowledgeResult) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No flashcards to save or user not logged in",
      });
      return;
    }

    setSaving(true);
    try {
      // Create a title from the question
      const title = currentQuestion.length > 50 
        ? currentQuestion.substring(0, 50) + "..." 
        : currentQuestion;

      // Use setInfo from Gemini if available, otherwise use defaults
      const setInfo = flashcards.setInfo || {};
      
      await apiRequest("POST", "/api/flashcard-sets", {
        userId: user.id,
        title: setInfo.title || title,
        originalQuestion: currentQuestion,
        originalAnswer: knowledgeResult,
        flashcards: flashcards.flashcards,
        description: setInfo.description || null,
        category: setInfo.category || null,
        isPublic: false, // Default to private
        defaultCardStyle: setInfo.defaultCardStyle || null
      });
      
      // Invalidate the query to refresh the saved sets
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/flashcard-sets`] });
      
      toast({
        title: "Success",
        description: "Flashcards saved successfully",
      });
    } catch (error) {
      let message = "Failed to save flashcards";
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        <div className="py-6">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Knowledge Explorer</h1>
            <p className="mt-1 text-sm text-gray-500">Ask anything and turn knowledge into flashcards</p>
            
            <div className="mt-6">
              <KnowledgeForm onKnowledgeGenerated={handleKnowledgeGenerated} />
            </div>
            
            {knowledgeResult && (
              <KnowledgeResult 
                answer={knowledgeResult} 
                onFlashcardsCreated={handleFlashcardsCreated} 
              />
            )}
            
            {flashcards && flashcards.flashcards.length > 0 && (
              <div id="flashcards-section" className="mt-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Flashcards</h2>
                  <Button 
                    className="bg-green-500 hover:bg-green-600"
                    onClick={handleSaveFlashcards}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Save Set
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {flashcards.flashcards.map((card, index) => (
                    <FlashCard
                      key={index}
                      question={card.question}
                      answer={card.answer}
                      index={index}
                      total={flashcards.flashcards.length}
                      backgroundColor={card.backgroundColor}
                      textColor={card.textColor}
                      font={card.font}
                      difficulty={card.difficulty}
                      tags={card.tags}
                      imageUrl={card.imageUrl}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
