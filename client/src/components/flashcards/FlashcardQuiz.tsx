import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, X, Trophy, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type FlashcardGeneration } from "@shared/schema";

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
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Quiz completed
      setIsCompleted(true);
      onQuizComplete(score + (selectedOption === questions[currentQuestionIndex].correctAnswer ? 1 : 0), questions.length);
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
    const finalScore = score + (selectedOption === questions[currentQuestionIndex]?.correctAnswer ? 1 : 0);
    const percentage = Math.round((finalScore / questions.length) * 100);
    
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="text-center">
            <Trophy className="h-16 w-16 mx-auto text-yellow-500" />
            <h2 className="text-2xl font-bold mt-4">Quiz Completed!</h2>
            <p className="text-lg mt-2">
              Your score: {finalScore} out of {questions.length} ({percentage}%)
            </p>
            
            <Progress value={percentage} className="mt-4" />
            
            <div className="mt-6 flex justify-center gap-4">
              <Button onClick={onCancel} variant="outline">
                Return to Flashcards
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

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Quiz Mode</h2>
        <Badge variant="outline">Question {currentQuestionIndex + 1} of {questions.length}</Badge>
      </div>
      
      <Progress value={progress} />
      
      <Card style={cardStyle}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-medium">{currentQuestion.question}</h3>
            
            {currentQuestion.difficulty && (
              <Badge variant="outline" className={difficultyColor}>
                {currentQuestion.difficulty}
              </Badge>
            )}
          </div>
          
          <div className="space-y-3 mt-6">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`p-4 rounded-md border transition-all cursor-pointer ${
                  selectedOption === option
                    ? isAnswered && option === currentQuestion.correctAnswer
                      ? "border-green-500 bg-green-50"
                      : isAnswered && option !== currentQuestion.correctAnswer
                      ? "border-red-500 bg-red-50"
                      : "border-blue-500 bg-blue-50"
                    : isAnswered && option === currentQuestion.correctAnswer
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleOptionSelect(option)}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm">{option}</p>
                  {isAnswered && option === currentQuestion.correctAnswer && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                  {isAnswered && selectedOption === option && option !== currentQuestion.correctAnswer && (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-between">
            <Button onClick={onCancel} variant="outline">
              Cancel Quiz
            </Button>
            <Button 
              onClick={handleNextQuestion} 
              disabled={!isAnswered}
              className={!isAnswered ? "opacity-50" : ""}
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
      
      <div className="flex justify-between text-sm text-gray-500">
        <div>Score: {score} correct</div>
        <div>{questions.length - currentQuestionIndex - 1} questions remaining</div>
      </div>
    </div>
  );
}