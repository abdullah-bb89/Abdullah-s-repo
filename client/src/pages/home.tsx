import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { type FlashcardGeneration } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Loader2, BookOpen, PenTool } from "lucide-react";
import Header from "@/components/layout/Header";
import KnowledgeForm from "@/components/knowledge/KnowledgeForm";
import KnowledgeResult from "@/components/knowledge/KnowledgeResult";
import FlashCard from "@/components/flashcards/FlashCard";
import FlashcardQuiz from "@/components/flashcards/FlashcardQuiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const [_, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [knowledgeResult, setKnowledgeResult] = useState("");
  const [flashcards, setFlashcards] = useState<FlashcardGeneration | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Quiz-related state
  const [quizMode, setQuizMode] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState({ score: 0, total: 0 });
  const [directQuizGenerated, setDirectQuizGenerated] = useState(false);

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
      
      // Make sure user exists or create a test user if in development
      let userId = user.id;
      
      // For testing without user - ensures we can save flashcards even without a valid user
      if (process.env.NODE_ENV === 'development' && !user.id) {
        console.log('Development mode: Using test user ID');
        userId = 1; // Default test user ID
      }
      
      await apiRequest("POST", "/api/flashcard-sets", {
        userId: userId,
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
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/flashcard-sets`] });
      
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

  // Quiz mode handlers
  const handleStartQuiz = () => {
    if (!flashcards || flashcards.flashcards.length < 3) {
      toast({
        title: "Not enough flashcards",
        description: "You need at least 3 flashcards to start a quiz.",
        variant: "destructive"
      });
      return;
    }
    
    setQuizMode(true);
    setQuizCompleted(false);
    
    // Scroll to quiz section
    setTimeout(() => {
      document.getElementById("quiz-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };
  
  const handleCancelQuiz = () => {
    setQuizMode(false);
    setQuizCompleted(false);
    
    // Reset direct quiz state if needed
    if (directQuizGenerated) {
      setDirectQuizGenerated(false);
    }
  };
  
  const handleQuizComplete = (score: number, total: number) => {
    setQuizCompleted(true);
    setQuizScore({ score, total });
    
    toast({
      title: "Quiz completed!",
      description: `You scored ${score} out of ${total} questions.`,
    });
  };
  
  // Direct quiz generation handler
  const handleDirectQuizRequested = (question: string, knowledge: string, generatedFlashcards: FlashcardGeneration) => {
    // Set all the necessary state in one go
    setCurrentQuestion(question);
    setKnowledgeResult(knowledge);
    setFlashcards(generatedFlashcards);
    setQuizMode(true);
    setDirectQuizGenerated(true);
    
    // Scroll to quiz section after short delay to allow rendering
    setTimeout(() => {
      document.getElementById("quiz-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    
    toast({
      title: "Quiz Created",
      description: "Quiz has been generated based on your topic. Good luck!",
    });
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
              <KnowledgeForm 
                onKnowledgeGenerated={handleKnowledgeGenerated}
                onQuizRequested={handleDirectQuizRequested}
              />
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
                  <div className="flex gap-2">
                    {!quizMode && (
                      <Button 
                        className="bg-amber-500 hover:bg-amber-600 flex items-center"
                        onClick={handleStartQuiz}
                      >
                        <PenTool className="h-4 w-4 mr-1" />
                        Start Quiz
                      </Button>
                    )}
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
                </div>
                
                {!quizMode ? (
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
                ) : (
                  <div id="quiz-section" className="mt-4">
                    <FlashcardQuiz 
                      flashcards={flashcards}
                      onQuizComplete={handleQuizComplete}
                      onCancel={handleCancelQuiz}
                    />
                  </div>
                )}
                
                {quizCompleted && (
                  <Card className="mt-6">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <h3 className="text-xl font-medium">Quiz Results</h3>
                        <p className="mt-2">
                          You scored {quizScore.score} out of {quizScore.total} ({Math.round((quizScore.score / quizScore.total) * 100)}%)
                        </p>
                        <div className="mt-4 flex justify-center space-x-4">
                          <Button onClick={handleCancelQuiz} variant="outline">
                            <BookOpen className="mr-2 h-4 w-4" />
                            {directQuizGenerated ? "Return to Home" : "Return to Flashcards"}
                          </Button>
                          <Button onClick={handleStartQuiz}>
                            <PenTool className="mr-2 h-4 w-4" />
                            Try Again
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
