import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { type FlashcardGeneration } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Loader2, BookOpen, Brain, Lightbulb, PenTool } from "lucide-react";
import Header from "@/components/layout/Header";
import KnowledgeForm from "@/components/knowledge/KnowledgeForm";
import KnowledgeResult from "@/components/knowledge/KnowledgeResult";
import FlashcardQuiz from "@/components/flashcards/FlashcardQuiz";
import DueReviews from "@/components/flashcards/DueReviews";
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
    <div className="min-h-screen flex flex-col" 
      style={{ 
        backgroundColor: 'var(--color-midnight-blue)'
      }}
    >
      <Header />
      
      <main className="flex-grow">
        <div className="py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Hero Section with Artwork */}
            <div className="text-center mb-12 animate-fadeIn">
              <div className="h-28 w-28 mx-auto relative mb-6">
                <div className="absolute inset-0 rounded-full animate-pulse-soft"
                  style={{ 
                    background: 'radial-gradient(circle, rgba(216, 27, 96, 0.7) 0%, rgba(216, 27, 96, 0) 70%)'
                  }}
                ></div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain className="h-16 w-16" style={{ color: 'var(--color-blazing-amber)' }} />
                </div>
              </div>
              
              <h1 className="text-5xl font-bold mb-4 animate-slideUp"
                style={{ 
                  color: 'white',
                  textShadow: '0 0 15px rgba(255, 160, 0, 0.5)'
                }}
              >
                <span style={{ color: 'var(--color-blazing-amber)' }}>Quiz</span>Genius
              </h1>
              
              <div className="max-w-2xl mx-auto">
                <p className="text-xl text-white text-opacity-90 mb-8 animate-slideUp delay-100">
                  Learn anything. Test your knowledge. See how much you've mastered.
                </p>
                
                <div className="flex justify-center gap-6 mb-10 animate-slideUp delay-200">
                  <div className="flex items-center glass-card px-4 py-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                      style={{ backgroundColor: 'var(--color-blazing-amber)' }}
                    >
                      <Lightbulb className="h-4 w-4 text-black" />
                    </div>
                    <div className="text-left">
                      <p className="text-white text-opacity-90 text-sm">Learn new topics</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center glass-card px-4 py-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                      style={{ backgroundColor: 'var(--color-razor-crimson)' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="white">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-white text-opacity-90 text-sm">Test yourself with quizzes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Knowledge Form */}
            <div className="transform transition-all duration-500 hover:scale-[1.01] animate-slideUp delay-300">
              <KnowledgeForm 
                onKnowledgeGenerated={handleKnowledgeGenerated}
                onQuizRequested={handleDirectQuizRequested}
              />
            </div>
            
            {/* Knowledge Result */}
            {knowledgeResult && (
              <div className="mt-10 animate-fadeIn">
                <KnowledgeResult 
                  answer={knowledgeResult} 
                  onFlashcardsCreated={handleFlashcardsCreated} 
                />
              </div>
            )}
            
            {/* Quiz Section */}
            {flashcards && flashcards.flashcards.length > 0 && (
              <div id="quiz-section" className="mt-12 animate-slideUp">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold inline-block relative"
                    style={{ color: 'var(--color-blazing-amber)' }}
                  >
                    {quizMode ? "Test Your Knowledge" : "Ready for a Quiz?"}
                    <div className="absolute bottom-0 left-0 w-full h-1 rounded"
                      style={{ backgroundColor: 'var(--color-razor-crimson)' }}
                    ></div>
                  </h2>
                  
                  {!quizMode && !directQuizGenerated && (
                    <div className="mt-6">
                      <p className="text-white text-opacity-80 mb-5 max-w-2xl mx-auto">
                        Challenge yourself with a quiz based on the knowledge you just learned!
                      </p>
                      <Button 
                        className="px-6 py-5 text-base rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
                        style={{ 
                          backgroundColor: 'var(--color-razor-crimson)',
                          color: 'white',
                          boxShadow: '0 4px 14px rgba(216, 27, 96, 0.5)'
                        }}
                        onClick={handleStartQuiz}
                      >
                        <Brain className="h-5 w-5 mr-2" />
                        Start Quiz Challenge
                      </Button>
                    </div>
                  )}
                </div>
                
                {quizMode && (
                  <div className="mt-4 quiz-container p-6">
                    <FlashcardQuiz 
                      flashcards={flashcards}
                      onQuizComplete={handleQuizComplete}
                      onCancel={handleCancelQuiz}
                    />
                  </div>
                )}
                
                {/* Quiz Results */}
                {quizCompleted && (
                  <Card className="mt-10 overflow-hidden border-0 shadow-2xl quiz-container" 
                    style={{ 
                      borderRadius: '1rem'
                    }}
                  >
                    <div className="h-3" style={{ backgroundColor: 'var(--color-razor-crimson)' }}></div>
                    <CardContent className="p-8">
                      <div className="text-center">
                        <div className="relative mb-10 inline-block">
                          <div className="absolute -inset-3 rounded-full opacity-50"
                            style={{ 
                              background: `radial-gradient(circle, ${
                                quizScore.score/quizScore.total >= 0.7 ? 'rgba(198, 255, 0, 0.5)' : 'rgba(255, 160, 0, 0.5)'
                              } 0%, transparent 70%)`,
                              animation: 'pulseSoft 2s infinite'
                            }}
                          ></div>
                          <div className="relative inline-flex items-center justify-center w-28 h-28 rounded-full"
                            style={{ 
                              backgroundColor: quizScore.score/quizScore.total >= 0.7 ? 'var(--color-neon-lime)' : 'var(--color-blazing-amber)',
                              boxShadow: `0 0 20px ${quizScore.score/quizScore.total >= 0.7 ? 'rgba(198, 255, 0, 0.5)' : 'rgba(255, 160, 0, 0.5)'}`
                            }}
                          >
                            <span className="text-4xl font-bold text-black">
                              {Math.round((quizScore.score / quizScore.total) * 100)}%
                            </span>
                          </div>
                        </div>
                        
                        <h3 className="text-3xl font-bold mb-3" style={{ color: 'var(--color-blazing-amber)' }}>
                          {quizScore.score/quizScore.total >= 0.8 ? "Outstanding!" : 
                           quizScore.score/quizScore.total >= 0.6 ? "Well Done!" : "Keep Learning!"}
                        </h3>
                        <p className="text-xl text-white mb-6">
                          You scored <span className="font-bold">{quizScore.score}</span> out of <span className="font-bold">{quizScore.total}</span> questions
                        </p>
                        
                        {quizScore.score/quizScore.total >= 0.8 && (
                          <p className="text-lg mb-6" style={{ color: 'var(--color-neon-lime)' }}>
                            Excellent work! You've mastered this topic!
                          </p>
                        )}
                        
                        {quizScore.score/quizScore.total >= 0.6 && quizScore.score/quizScore.total < 0.8 && (
                          <p className="text-lg mb-6" style={{ color: 'var(--color-blazing-amber)' }}>
                            Good job! You have a solid understanding of this topic.
                          </p>
                        )}
                        
                        {quizScore.score/quizScore.total < 0.6 && (
                          <p className="text-lg mb-6" style={{ color: 'var(--color-razor-crimson)' }}>
                            Keep practicing! You're on your way to understanding this topic.
                          </p>
                        )}
                        
                        <div className="mt-8 flex flex-wrap justify-center gap-4">
                          <Button 
                            onClick={handleCancelQuiz} 
                            className="px-5 py-3 rounded-xl transition-all duration-200 hover:scale-105"
                            style={{ 
                              backgroundColor: 'rgba(255,255,255,0.15)',
                              color: 'white'
                            }}
                          >
                            <BookOpen className="mr-2 h-4 w-4" />
                            Return to Knowledge
                          </Button>
                          <Button 
                            onClick={handleStartQuiz}
                            className="px-5 py-3 rounded-xl transition-all duration-200 hover:scale-105"
                            style={{ 
                              backgroundColor: 'var(--color-blazing-amber)',
                              color: 'black',
                              fontWeight: 'bold'
                            }}
                          >
                            <Brain className="mr-2 h-4 w-4" />
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
      
      {/* Animated Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
        <div className="animate-float-slow absolute top-10 left-[10%] w-24 h-24 rounded-full opacity-10" 
          style={{ backgroundColor: 'var(--color-razor-crimson)' }}></div>
        <div className="animate-float absolute top-[20%] right-[5%] w-32 h-32 rounded-full opacity-10" 
          style={{ backgroundColor: 'var(--color-blazing-amber)' }}></div>
        <div className="animate-float-slow absolute bottom-[15%] left-[15%] w-40 h-40 rounded-full opacity-10" 
          style={{ backgroundColor: 'var(--color-neon-lime)' }}></div>
        <div className="animate-float absolute bottom-[25%] right-[20%] w-20 h-20 rounded-full opacity-10" 
          style={{ backgroundColor: 'var(--color-razor-crimson)' }}></div>
      </div>
      
      {/* Due Reviews Floating UI */}
      <DueReviews />
    </div>
  );
}
