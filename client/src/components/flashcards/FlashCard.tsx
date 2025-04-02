import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface FlashCardProps {
  question: string;
  answer: string;
  index: number;
  total: number;
}

export default function FlashCard({ question, answer, index, total }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

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
          <Card className="w-full h-full p-6 flex flex-col">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{question}</h3>
            <div className="flex-grow flex items-center justify-center">
              <p className="text-gray-500 text-sm">Click to reveal answer</p>
            </div>
            <div className="w-full flex justify-end mt-4">
              <Badge variant="outline" className="bg-primary-100 text-primary-800 hover:bg-primary-100">
                Card {index + 1}/{total}
              </Badge>
            </div>
          </Card>
        </div>

        <div 
          className={`absolute w-full h-full backface-hidden transform rotate-y-180 ${
            isFlipped ? "" : "pointer-events-none"
          }`}
        >
          <Card className="w-full h-full p-6 flex flex-col bg-primary-50">
            <div className="flex-grow overflow-auto">
              <p className="text-gray-700">{answer}</p>
            </div>
            <div className="w-full flex justify-end mt-4">
              <Badge variant="outline" className="bg-primary-100 text-primary-800 hover:bg-primary-100">
                Click to flip back
              </Badge>
            </div>
          </Card>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .transition-transform {
          transition: transform 0.6s;
        }
        .duration-600 {
          transition-duration: 600ms;
        }
      `}</style>
    </div>
  );
}
