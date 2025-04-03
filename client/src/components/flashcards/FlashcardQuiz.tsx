import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, X, Trophy, ArrowRight, ThumbsUp, ThumbsDown, BrainCircuit, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type FlashcardGeneration } from "@shared/schema";
import EmojiReactions from "./EmojiReactions";
import { useLocation } from "wouter";

interface FlashcardQuizProps {
  flashcards: FlashcardGeneration;
  onQuizComplete: (score: number, total: number) => void;
  onCancel: () => void;
}

interface QuizQuestion {
  question: string;
  correctAnswer: string;
  options: string[];
  difficulty?: string;
  tags?: string[];
  backgroundColor?: string;
  textColor?: string;
}

export default function FlashcardQuiz({ flashcards, onQuizComplete, onCancel }: FlashcardQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [, setLocation] = useLocation();
  
  // Convert flashcards to quiz questions on component mount
  useEffect(() => {
    if (flashcards && flashcards.flashcards) {
      const quizQuestions = flashcards.flashcards.map(card => {
        // Generate 3 incorrect options using parts of other cards' answers
        const otherAnswers = flashcards.flashcards
          .filter(otherCard => otherCard.answer !== card.answer)
          .map(otherCard => {
            // Get first sentence or up to 100 characters
            const answerSnippet = otherCard.answer.split('.')[0].substring(0, 100);
            return answerSnippet;
          });
        
        // Shuffle and take up to 3 incorrect answers
        const incorrectOptions = otherAnswers
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        
        // All options including correct answer
        const allOptions = [...incorrectOptions, card.answer].sort(() => Math.random() - 0.5);
        
        return {
          question: card.question,
          correctAnswer: card.answer,
          options: allOptions,
          difficulty: card.difficulty,
          tags: card.tags,
          backgroundColor: card.backgroundColor,
          textColor: card.textColor
        };
      });
      
      setQuestions(quizQuestions);
    }
  }, [flashcards]);

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);
    
    if (option === questions[currentQuestionIndex].correctAnswer) {
      setScore(prevScore => prevScore + 1);
    }
  };

  const handleNextQuestion = () => {
    // The score for the current question was already updated in handleOptionSelect
    // So we don't need to update it again here
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Quiz completed
      setIsCompleted(true);
      
      // Use the current score since it was already updated in handleOptionSelect
      onQuizComplete(score, questions.length);
    }
  };

  if (!questions.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isCompleted) {
    // Score is already updated in handleOptionSelect, no need to calculate it again
    const percentage = Math.round((score / questions.length) * 100);
    
    // Get appropriate feedback based on score
    const getFeedback = () => {
      if (percentage >= 80) {
        return {
          title: "Outstanding!",
          message: "You've mastered this topic! Great job!",
          color: 'var(--color-neon-lime)',
          icon: <ThumbsUp className="h-8 w-8" />
        };
      } else if (percentage >= 60) {
        return {
          title: "Well Done!",
          message: "You have a good understanding of this topic!",
          color: 'var(--color-blazing-amber)',
          icon: <ThumbsUp className="h-8 w-8" />
        };
      } else {
        return {
          title: "Keep Learning!",
          message: "You're on your way to understanding this topic.",
          color: 'var(--color-razor-crimson)',
          icon: <BrainCircuit className="h-8 w-8" />
        };
      }
    };
    
    const feedback = getFeedback();
    
    return (
      <Card className="mt-6 quiz-container border-0 shadow-2xl overflow-hidden">
        <div className="h-3" style={{ backgroundColor: feedback.color }}></div>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="relative mb-8 inline-block">
              <div className="absolute -inset-4 rounded-full opacity-40"
                style={{ 
                  background: `radial-gradient(circle, ${
                    percentage >= 70 ? 'rgba(198, 255, 0, 0.4)' : 'rgba(255, 160, 0, 0.4)'
                  } 0%, transparent 70%)`,
                  animation: 'pulseSoft 2s infinite'
                }}
              ></div>
              <div className="w-20 h-20 rounded-full flex items-center justify-center relative"
                style={{ 
                  backgroundColor: percentage >= 70 ? 'var(--color-neon-lime)' : 'var(--color-blazing-amber)',
                  color: 'black'
                }}
              >
                <Trophy className="h-12 w-12" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-blazing-amber)' }}>
              Quiz Completed!
            </h2>
            <p className="text-xl text-white mb-4">
              You scored <span className="font-bold">{score}</span> out of <span className="font-bold">{questions.length}</span>
            </p>
            
            <div className="w-40 h-40 mx-auto mb-6 relative">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-gray-700 opacity-20"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
                <circle
                  className="transition-all duration-300 ease-in-out"
                  strokeWidth="10"
                  strokeDasharray={252}
                  strokeDashoffset={252 - (percentage / 100) * 252}
                  strokeLinecap="round"
                  stroke={feedback.color}
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                  style={{
                    transform: 'rotate(-90deg)',
                    transformOrigin: 'center',
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-bold" style={{ color: feedback.color }}>
                  {percentage}%
                </span>
              </div>
            </div>
            
            <div className="p-4 rounded-lg mb-6 animate-fadeIn" 
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-center mb-2">
                <div className="mr-3" style={{ color: feedback.color }}>
                  {feedback.icon}
                </div>
                <h3 className="text-2xl font-bold" style={{ color: feedback.color }}>
                  {feedback.title}
                </h3>
              </div>
              <p className="text-white text-opacity-90">
                {feedback.message}
              </p>
              
              <div className="mt-4">
                <p className="text-sm text-white text-opacity-70">
                  Express how you feel about this quiz:
                </p>
                <EmojiReactions 
                  questionId="quiz-result" 
                  size="md"
                  className="justify-center mt-3"
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-center gap-4">
              <Button 
                onClick={onCancel} 
                className="px-6 py-5 font-medium text-base rounded-lg transition-all duration-200 hover:scale-105"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: 'white'
                }}
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Return to Knowledge
              </Button>
              
              <Button 
                onClick={() => setLocation("/")}
                className="px-6 py-5 font-medium text-base rounded-lg transition-all duration-200 hover:scale-105"
                style={{ 
                  backgroundColor: 'var(--color-blazing-amber)',
                  color: 'black'
                }}
              >
                <span className="mr-2">✓</span>
                Finish
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = Math.round(((currentQuestionIndex) / questions.length) * 100);
  
  // Determine card styles based on flashcard properties
  const cardStyle = {
    backgroundColor: currentQuestion.backgroundColor || "#ffffff",
    color: currentQuestion.textColor || "#1f2937",
  };

  // Get difficulty color
  const difficultyColor = currentQuestion.difficulty ? 
    (currentQuestion.difficulty.toLowerCase() === "easy" ? "bg-green-100 text-green-800" :
     currentQuestion.difficulty.toLowerCase() === "medium" ? "bg-yellow-100 text-yellow-800" :
     currentQuestion.difficulty.toLowerCase() === "hard" ? "bg-red-100 text-red-800" : 
     "bg-blue-100 text-blue-800") : "";
  
  // Handle emoji reaction
  const handleReaction = (reaction: string) => {
    // In a more advanced implementation, this could be used to adjust 
    // the spaced repetition algorithm for this particular question
    console.log(`User reacted with ${reaction} to question ${currentQuestionIndex}`);
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-blazing-amber)' }}>Quiz Challenge</h2>
        <Badge 
          variant="outline"
          className="bg-opacity-20 text-white border-opacity-30"
          style={{ backgroundColor: 'var(--color-razor-crimson)', borderColor: 'var(--color-razor-crimson)' }}
        >
          Question {currentQuestionIndex + 1} of {questions.length}
        </Badge>
      </div>
      
      <Progress 
        value={progress} 
        className="h-2"
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.1)', 
          '--progress-background': 'var(--color-razor-crimson)' 
        } as React.CSSProperties}
      />
      
      <Card className="overflow-hidden border-0 shadow-xl quiz-container">
        <div className="h-2" style={{ backgroundColor: 'var(--color-blazing-amber)' }}></div>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2"
              style={{ backgroundColor: 'var(--color-razor-crimson)' }}
            >
              <BrainCircuit className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-xl font-medium text-white">{currentQuestion.question}</h3>
            
            {currentQuestion.difficulty && (
              <Badge variant="outline" className="ml-auto text-white border-opacity-30"
                style={{ 
                  backgroundColor: 
                    currentQuestion.difficulty.toLowerCase() === "easy" ? 'rgba(34, 197, 94, 0.2)' :
                    currentQuestion.difficulty.toLowerCase() === "medium" ? 'rgba(234, 179, 8, 0.2)' :
                    'rgba(239, 68, 68, 0.2)',
                  borderColor:
                    currentQuestion.difficulty.toLowerCase() === "easy" ? 'rgba(34, 197, 94, 0.6)' :
                    currentQuestion.difficulty.toLowerCase() === "medium" ? 'rgba(234, 179, 8, 0.6)' :
                    'rgba(239, 68, 68, 0.6)'
                }}
              >
                {currentQuestion.difficulty}
              </Badge>
            )}
          </div>
          
          <div className="space-y-3 mt-6">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`quiz-option ${
                  selectedOption === option ? 'selected' : ''
                } ${
                  isAnswered && option === currentQuestion.correctAnswer ? 'correct' : ''
                } ${
                  isAnswered && selectedOption === option && option !== currentQuestion.correctAnswer ? 'incorrect' : ''
                }`}
                onClick={() => handleOptionSelect(option)}
              >
                <div className="flex items-center justify-between">
                  <p className="text-white">{option}</p>
                  {isAnswered && option === currentQuestion.correctAnswer && (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {isAnswered && selectedOption === option && option !== currentQuestion.correctAnswer && (
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <X className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {isAnswered && (
            <div className="mt-6 pt-4 border-t border-white border-opacity-10">
              <p className="text-white text-opacity-90 mb-3 font-medium">How well do you know this?</p>
              <EmojiReactions 
                questionId={`quiz-${currentQuestionIndex}`} 
                onReaction={handleReaction}
                size="md"
                className="justify-start"
              />
            </div>
          )}
          
          <div className="mt-6 flex justify-between">
            <Button 
              onClick={onCancel} 
              className="rounded-lg border-0"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.1)', 
                color: 'white' 
              }}
            >
              Cancel Quiz
            </Button>
            <Button 
              onClick={handleNextQuestion} 
              disabled={!isAnswered}
              className={`rounded-lg ${!isAnswered ? "opacity-50" : ""} transition-all duration-200 hover:scale-105`}
              style={{ 
                backgroundColor: 'var(--color-blazing-amber)',
                color: 'black',
                fontWeight: '600'
              }}
            >
              {currentQuestionIndex < questions.length - 1 ? (
                <>
                  Next Question
                  <ArrowRight className="ml-1 h-4 w-4" />
                </>
              ) : (
                "Finish Quiz"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
        <div className="flex items-center">
          <ThumbsUp className="h-4 w-4 mr-1 text-green-400" />
          <span>Score: {score} correct</span>
        </div>
        <div className="flex items-center">
          <span>{questions.length - currentQuestionIndex - 1} questions remaining</span>
        </div>
      </div>
    </div>
  );
}