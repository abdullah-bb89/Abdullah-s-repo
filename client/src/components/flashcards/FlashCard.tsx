import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tag } from "lucide-react";

interface FlashCardProps {
  question: string;
  answer: string;
  index: number;
  total: number;
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
  backgroundColor = "#ffffff", 
  textColor = "#1f2937", 
  font = "sans-serif",
  difficulty,
  tags = [],
  imageUrl
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

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
