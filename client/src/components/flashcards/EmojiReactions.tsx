import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { reactionToFeedback, processReview, getNextReviewDateText, getKnowledgeLevelText } from "@/lib/spacedRepetition";

interface EmojiReaction {
  emoji: string;
  label: string;
  count: number;
  selected: boolean;
}

interface EmojiReactionsProps {
  questionId: number | string;
  onReaction?: (reaction: string) => void;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export default function EmojiReactions({
  questionId,
  onReaction,
  size = "md",
  showLabels = true,
  style,
  className,
}: EmojiReactionsProps) {
  const [reactions, setReactions] = useState<EmojiReaction[]>([
    { emoji: "😊", label: "Got it!", count: 0, selected: false },
    { emoji: "🤔", label: "Not sure", count: 0, selected: false },
    { emoji: "😵", label: "Confused", count: 0, selected: false },
    { emoji: "🔄", label: "Review Again", count: 0, selected: false },
  ]);
  
  const { toast } = useToast();
  
  // Load existing reactions from localStorage
  useEffect(() => {
    const savedReactions = localStorage.getItem(`reactions-${questionId}`);
    if (savedReactions) {
      try {
        const parsedReactions = JSON.parse(savedReactions);
        setReactions(parsedReactions);
      } catch (e) {
        console.error("Failed to parse saved reactions", e);
      }
    }
  }, [questionId]);
  
  // Save reactions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`reactions-${questionId}`, JSON.stringify(reactions));
  }, [reactions, questionId]);
  
  const handleReaction = (index: number) => {
    setReactions(prev => {
      const newReactions = [...prev];
      
      // If already selected, unselect it
      if (newReactions[index].selected) {
        newReactions[index].selected = false;
        newReactions[index].count = Math.max(0, newReactions[index].count - 1);
      } else {
        // Unselect any previously selected reaction
        newReactions.forEach((r, i) => {
          if (r.selected && i !== index) {
            r.selected = false;
          }
        });
        
        // Select the new reaction
        newReactions[index].selected = true;
        newReactions[index].count += 1;
        
        // Process for spaced repetition
        const feedback = reactionToFeedback(newReactions[index].label);
        const reviewData = processReview(questionId, feedback);
        
        // Generate message with next review information
        const nextReviewText = getNextReviewDateText(questionId);
        const knowledgeLevel = getKnowledgeLevelText(questionId);
        
        // Show toast message based on the reaction
        toast({
          title: `${newReactions[index].emoji} ${newReactions[index].label}`,
          description: `${getFeedbackMessage(newReactions[index].label)} ${nextReviewText}. Knowledge level: ${knowledgeLevel}`,
        });
        
        // Call the callback if provided
        if (onReaction) {
          onReaction(newReactions[index].label);
        }
      }
      
      return newReactions;
    });
  };
  
  const getFeedbackMessage = (label: string): string => {
    switch (label) {
      case "Got it!":
        return "Great! This card will be shown less frequently.";
      case "Not sure":
        return "This card will be shown again soon to help you learn.";
      case "Confused":
        return "Don't worry, you'll see this card more often to practice.";
      case "Review Again":
        return "We'll make sure to review this card in your next session.";
      default:
        return "Your feedback helps optimize your learning experience.";
    }
  };
  
  // Determine size classes
  const sizeClasses = {
    sm: "text-lg p-1",
    md: "text-2xl p-2",
    lg: "text-3xl p-3",
  };
  
  return (
    <div 
      className={`flex items-center justify-center gap-2 ${className || ""}`} 
      style={style}
    >
      {reactions.map((reaction, index) => (
        <div key={index} className="flex flex-col items-center">
          <motion.button
            className={`rounded-full ${sizeClasses[size]} ${
              reaction.selected 
                ? "bg-white bg-opacity-20 ring-2 ring-white ring-opacity-50" 
                : "bg-white bg-opacity-10 hover:bg-opacity-15"
            } transition-all duration-200`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleReaction(index)}
          >
            <span role="img" aria-label={reaction.label}>
              {reaction.emoji}
            </span>
            
            {reaction.count > 0 && (
              <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {reaction.count}
              </span>
            )}
          </motion.button>
          
          {showLabels && (
            <span className="text-xs mt-1 text-white text-opacity-80">
              {reaction.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}