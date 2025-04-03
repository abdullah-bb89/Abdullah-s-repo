import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tag, Clock, Brain, CheckCircle2 } from "lucide-react";
import { 
  getCardReview, 
  getNextReviewDateText, 
  getDueCards, 
  KnowledgeLevel 
} from "@/lib/spacedRepetition";

interface FlashCardProps {
  question: string;
  answer: string;
  index: number;
  total: number;
  id?: number | string; // Add optional ID for tracking review status
  backgroundColor?: string;
  textColor?: string;
  font?: string;
  difficulty?: string;
  tags?: string[];
  imageUrl?: string;
}

export default function FlashCard({ 
  question, 
  answer, 
  index, 
  total, 
  id,
  backgroundColor = "#ffffff", 
  textColor = "#1f2937", 
  font = "sans-serif",
  difficulty,
  tags = [],
  imageUrl
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCardDue, setIsCardDue] = useState(false);
  const [reviewInfo, setReviewInfo] = useState<{
    nextReview: string;
    knowledgeLevel: KnowledgeLevel;
  } | null>(null);
  
  // Check if card is due for review
  useEffect(() => {
    if (id) {
      const cardId = id.toString();
      const dueCards = getDueCards();
      setIsCardDue(dueCards.includes(cardId));
      
      const review = getCardReview(cardId);
      setReviewInfo({
        nextReview: getNextReviewDateText(cardId),
        knowledgeLevel: review.knowledgeLevel
      });
    }
  }, [id]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Generate style objects for custom styling
  const cardStyle = {
    backgroundColor: backgroundColor || "#ffffff",
    color: textColor || "#1f2937",
    fontFamily: font || "sans-serif",
    backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
    backgroundSize: imageUrl ? "cover" : undefined,
    backgroundPosition: imageUrl ? "center" : undefined,
  };

  // Get difficulty color
  const difficultyColor = difficulty ? 
    (difficulty.toLowerCase() === "easy" ? "bg-green-100 text-green-800" :
     difficulty.toLowerCase() === "medium" ? "bg-yellow-100 text-yellow-800" :
     difficulty.toLowerCase() === "hard" ? "bg-red-100 text-red-800" : 
     "bg-blue-100 text-blue-800") : "";

  return (
    <div 
      className={`h-64 rounded-xl cursor-pointer perspective-1000 ${isFlipped ? "flipped" : ""}`}
      onClick={handleFlip}
    >
      {/* Due indicator */}
      {id && isCardDue && (
        <div className="absolute top-0 right-0 mt-2 mr-2 z-20 animate-pulse">
          <div className="flex items-center justify-center w-8 h-8 rounded-full" 
            style={{ backgroundColor: 'var(--color-razor-crimson)' }}
          >
            <Clock className="h-5 w-5 text-white" />
          </div>
        </div>
      )}
      
      {/* Knowledge level indicator */}
      {id && reviewInfo && (
        <div className="absolute top-0 left-0 mt-2 ml-2 z-20">
          <div className="flex items-center justify-center w-8 h-8 rounded-full" 
            style={{ 
              backgroundColor: reviewInfo.knowledgeLevel === KnowledgeLevel.MASTERED 
                ? '#4CAF50' 
                : reviewInfo.knowledgeLevel === KnowledgeLevel.REVIEWING 
                  ? '#FFA000' 
                  : reviewInfo.knowledgeLevel === KnowledgeLevel.LEARNING 
                    ? '#2196F3' 
                    : '#9E9E9E'
            }}
          >
            <Brain className="h-5 w-5 text-white" />
          </div>
        </div>
      )}
      
      <div className="relative w-full h-full transform-style-preserve-3d transition-transform duration-600">
        <div 
          className={`absolute w-full h-full backface-hidden transform ${
            isFlipped ? "rotate-y-180 pointer-events-none" : ""
          }`}
        >
          <Card className="w-full h-full p-6 flex flex-col" style={cardStyle}>
            {imageUrl && <div className="absolute inset-0 bg-black bg-opacity-40 rounded-xl z-0"></div>}
            <div className="z-10 relative flex-grow flex flex-col">
              <h3 className={`text-lg font-medium mb-4 ${imageUrl ? "text-white" : ""}`}>{question}</h3>
              <div className="flex-grow flex items-center justify-center">
                <p className={`text-sm ${imageUrl ? "text-gray-200" : "text-gray-500"}`}>Click to reveal answer</p>
              </div>
              <div className="w-full flex flex-wrap justify-between mt-4 items-center gap-2">
                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {difficulty && (
                    <Badge variant="outline" className={`mr-1 ${difficultyColor}`}>
                      {difficulty}
                    </Badge>
                  )}
                  {tags.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="outline" className="bg-gray-100 text-gray-800">
                      {tag}
                    </Badge>
                  ))}
                  {tags.length > 3 && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-800">
                      +{tags.length - 3}
                    </Badge>
                  )}
                  
                  {/* Review Status */}
                  {id && reviewInfo && reviewInfo.knowledgeLevel > KnowledgeLevel.NEW && (
                    <Badge variant="outline" 
                      className={`ml-1 ${
                        reviewInfo.knowledgeLevel === KnowledgeLevel.MASTERED 
                          ? "bg-green-100 text-green-800" 
                          : reviewInfo.knowledgeLevel === KnowledgeLevel.REVIEWING
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {reviewInfo.knowledgeLevel === KnowledgeLevel.MASTERED 
                        ? "Mastered" 
                        : reviewInfo.knowledgeLevel === KnowledgeLevel.REVIEWING
                          ? "Reviewing"
                          : "Learning"}
                    </Badge>
                  )}
                </div>
                <Badge variant="outline" className={`${imageUrl ? "bg-white bg-opacity-20 text-white" : "bg-primary-100 text-primary-800"} hover:bg-primary-100`}>
                  Card {index + 1}/{total}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        <div 
          className={`absolute w-full h-full backface-hidden transform rotate-y-180 ${
            isFlipped ? "" : "pointer-events-none"
          }`}
        >
          <Card className="w-full h-full p-6 flex flex-col" style={{...cardStyle, backgroundColor: backgroundColor ? `${backgroundColor}dd` : "#f8fafc"}}>
            {imageUrl && <div className="absolute inset-0 bg-black bg-opacity-60 rounded-xl z-0"></div>}
            <div className="relative z-10 flex-grow flex flex-col">
              <div className="flex-grow overflow-auto">
                <p className={`${imageUrl ? "text-white" : "text-gray-700"}`}>{answer}</p>
              </div>
              <div className="w-full flex justify-between items-center mt-4">
                {/* Tags on back side */}
                <div className="flex flex-wrap gap-1">
                  {tags.length > 0 && <Tag size={16} className={`${imageUrl ? "text-gray-300" : "text-gray-500"}`} />}
                  {tags.length > 0 && <span className={`text-xs ${imageUrl ? "text-gray-300" : "text-gray-500"}`}>{tags.length} tags</span>}
                  
                  {/* Review info on back */}
                  {id && reviewInfo && (
                    <div className="ml-2 flex items-center">
                      <Clock size={14} className={`${imageUrl ? "text-gray-300" : "text-gray-500"} mr-1`} />
                      <span className={`text-xs ${imageUrl ? "text-gray-300" : "text-gray-500"}`}>
                        {reviewInfo.nextReview}
                      </span>
                    </div>
                  )}
                </div>
                <Badge variant="outline" className={`${imageUrl ? "bg-white bg-opacity-20 text-white" : "bg-primary-100 text-primary-800"} hover:bg-primary-100`}>
                  Click to flip back
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>


    </div>
  );
}
