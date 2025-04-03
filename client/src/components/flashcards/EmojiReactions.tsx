import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const initialReactions = [
    { emoji: "😊", label: "Got it!", count: 0, selected: false },
    { emoji: "🤔", label: "Not sure", count: 0, selected: false },
    { emoji: "😵", label: "Confused", count: 0, selected: false },
    { emoji: "🔄", label: "Review Again", count: 0, selected: false },
  ];
  
  const [reactions, setReactions] = useState<EmojiReaction[]>(initialReactions);
  const { toast } = useToast();
  
  // Load existing reactions from localStorage (only once on mount)
  useEffect(() => {
    const loadSavedReactions = () => {
      const savedReactions = localStorage.getItem(`reactions-${questionId}`);
      if (savedReactions) {
        try {
          const parsedReactions = JSON.parse(savedReactions);
          setReactions(parsedReactions);
        } catch (e) {
          console.error("Failed to parse saved reactions", e);
        }
      }
    };
    
    loadSavedReactions();
  }, [questionId]);
  
  // Save reactions to localStorage whenever they change
  useEffect(() => {
    // Only save if we're actually changing something meaningful
    if (reactions !== initialReactions) {
      localStorage.setItem(`reactions-${questionId}`, JSON.stringify(reactions));
    }
  }, [reactions, questionId, initialReactions]);
  
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
    // Create an array of possible messages for each label for more variety
    const messages = {
      "Got it!": [
        "Excellent! You're mastering this concept. We'll space out future reviews.",
        "Amazing job! Your brain is making strong connections. See you in a while!",
        "You've got this down! We'll show it less often as you continue to rock it.",
        "Awesome recall! Your knowledge is solidifying. This card will appear less frequently."
      ],
      "Not sure": [
        "Getting there! We'll bring this back soon to strengthen your memory.",
        "You're on the right track. A few more reviews will help cement this knowledge.",
        "Almost there! We'll schedule this again soon to help build your confidence.",
        "No problem! Learning is a process. We'll revisit this at the perfect time for retention."
      ],
      "Confused": [
        "That's okay! Complex topics take time. We'll review this more frequently.",
        "No worries! Even Einstein struggled at first. We'll prioritize this for more practice.",
        "Learning involves confusion - it means your brain is growing! We'll review this again soon.",
        "This is part of the learning process. We'll make sure you see this more often."
      ],
      "Review Again": [
        "Sure thing! We'll include this in your next review session.",
        "Got it! Sometimes a card just needs another look. We'll bring it back soon.",
        "Marked for priority review in your next session!",
        "Good call! Extra reviews help build stronger neural pathways."
      ]
    };
    
    // Pick a random message from the appropriate category
    const messageOptions = messages[label as keyof typeof messages] || ["Your feedback helps optimize your learning experience."];
    const randomIndex = Math.floor(Math.random() * messageOptions.length);
    
    return messageOptions[randomIndex];
  };
  
  // Determine size classes
  const sizeClasses = {
    sm: "text-lg p-1",
    md: "text-2xl p-2",
    lg: "text-3xl p-3",
  };
  
  // Define colors for each reaction to make them more visually distinct
  const reactionColors = {
    "Got it!": {
      bg: "rgba(198, 255, 0, 0.2)",
      ring: "var(--color-neon-lime)",
      hoverBg: "rgba(198, 255, 0, 0.3)",
      countBg: "var(--color-neon-lime)",
      countText: "black"
    },
    "Not sure": {
      bg: "rgba(255, 160, 0, 0.2)",
      ring: "var(--color-blazing-amber)",
      hoverBg: "rgba(255, 160, 0, 0.3)",
      countBg: "var(--color-blazing-amber)",
      countText: "black"
    },
    "Confused": {
      bg: "rgba(216, 27, 96, 0.2)",
      ring: "var(--color-razor-crimson)",
      hoverBg: "rgba(216, 27, 96, 0.3)",
      countBg: "var(--color-razor-crimson)",
      countText: "white"
    },
    "Review Again": {
      bg: "rgba(69, 90, 100, 0.2)",
      ring: "var(--color-steel-graphite)",
      hoverBg: "rgba(69, 90, 100, 0.3)",
      countBg: "var(--color-steel-graphite)",
      countText: "white"
    }
  };

  return (
    <motion.div 
      className={`flex items-center justify-center gap-3 ${className || ""}`} 
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        staggerChildren: 0.08,
        delayChildren: 0.1
      }}
    >
      {reactions.map((reaction, index) => {
        const colors = reactionColors[reaction.label as keyof typeof reactionColors];
        
        return (
          <motion.div 
            key={index} 
            className="flex flex-col items-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ y: -3 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.button
              className={`relative rounded-full ${sizeClasses[size]} transition-all duration-300`}
              style={{ 
                backgroundColor: reaction.selected ? colors.bg : "rgba(255, 255, 255, 0.1)",
                boxShadow: reaction.selected ? `0 0 12px ${colors.ring}` : "none",
                border: reaction.selected ? `2px solid ${colors.ring}` : "2px solid transparent"
              }}
              whileHover={{ 
                scale: 1.15, 
                backgroundColor: reaction.selected ? colors.bg : colors.hoverBg
              }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleReaction(index)}
            >
              <span 
                role="img" 
                aria-label={reaction.label}
                className={`text-shadow transition-transform duration-300 ${reaction.selected ? "scale-110" : ""}`}
                style={{ filter: reaction.selected ? "drop-shadow(0 0 2px white)" : "none" }}
              >
                {reaction.emoji}
              </span>
              
              <AnimatePresence>
                {reaction.count > 0 && (
                  <motion.span 
                    className="absolute -top-2 -right-2 text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-md"
                    style={{ 
                      backgroundColor: colors.countBg,
                      color: colors.countText
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    {reaction.count}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            
            {showLabels && (
              <motion.span 
                className="text-xs mt-2 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{ 
                  color: reaction.selected ? colors.ring : "rgba(255, 255, 255, 0.8)" 
                }}
              >
                {reaction.label}
              </motion.span>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}