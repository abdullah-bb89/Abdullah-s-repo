import { useState, useEffect } from "react";
import { Loader2, Sparkles, BookOpen, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateFlashcards } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { type FlashcardGeneration } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

interface KnowledgeResultProps {
  answer: string;
  onFlashcardsCreated: (flashcards: FlashcardGeneration) => void;
}

export default function KnowledgeResult({ answer, onFlashcardsCreated }: KnowledgeResultProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateFlashcards = async () => {
    setIsLoading(true);
    try {
      const flashcards = await generateFlashcards(answer);
      onFlashcardsCreated(flashcards);
    } catch (error) {
      let message = "Failed to generate flashcards";
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants for staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24 
      }
    }
  };
  
  const [showEmojis, setShowEmojis] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  
  // Show emojis after content is loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowEmojis(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // List of possible reactions with their messages
  const reactionOptions = [
    { emoji: "🤩", text: "Mind blown!" },
    { emoji: "🧠", text: "Educational!" },
    { emoji: "💯", text: "Super helpful!" },
    { emoji: "👍", text: "Useful info!" }
  ];
  
  const handleEmojiClick = (emoji: string) => {
    setSelectedEmoji(emoji);
    toast({
      title: "Thanks for your reaction!",
      description: `You found this ${reactionOptions.find(r => r.emoji === emoji)?.text.toLowerCase() || "helpful"}`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Card className="mt-8 rounded-xl shadow-xl overflow-hidden border-0"
        style={{ 
          background: 'linear-gradient(145deg, rgba(69, 90, 100, 0.9) 0%, rgba(38, 50, 56, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className="h-2" style={{ backgroundColor: 'var(--color-blazing-amber)' }}></div>
        <CardContent className="p-6">
          <motion.div 
            className="flex items-center mb-4"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 animate-pulse-soft"
              style={{ backgroundColor: 'var(--color-blazing-amber)' }}
            >
              <Sparkles className="h-5 w-5 text-black" />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'white' }}>
              Knowledge Unlocked!
            </h2>
          </motion.div>
          
          <motion.div 
            className="mt-4 px-4 py-5 rounded-lg prose prose-invert max-w-none"
            style={{ 
              backgroundColor: 'rgba(0,0,0,0.2)',
              color: 'white',
              fontSize: '1.05rem',
              lineHeight: '1.6'
            }}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div dangerouslySetInnerHTML={{ __html: answer }} />
            
            {/* Emoji reactions */}
            <AnimatePresence>
              {showEmojis && (
                <motion.div 
                  className="mt-5 flex flex-col items-center border-t border-white border-opacity-10 pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                >
                  <p className="text-sm text-white text-opacity-70 mb-3">Was this helpful?</p>
                  <motion.div 
                    className="flex gap-3 justify-center"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {reactionOptions.map((option, index) => (
                      <motion.button
                        key={option.emoji}
                        className={`p-2 rounded-full transition-all duration-200 ${
                          selectedEmoji === option.emoji 
                            ? "bg-white bg-opacity-25 scale-110 ring-2 ring-white ring-opacity-50" 
                            : "bg-white bg-opacity-10 hover:bg-opacity-15"
                        }`}
                        variants={itemVariants}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEmojiClick(option.emoji)}
                        disabled={!!selectedEmoji}
                      >
                        <span className="text-2xl" role="img" aria-label={option.text}>
                          {option.emoji}
                        </span>
                        <AnimatePresence>
                          {selectedEmoji === option.emoji && (
                            <motion.span
                              className="absolute -top-2 -right-2 text-xs bg-white text-black rounded-full w-5 h-5 flex items-center justify-center"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                            >
                              ✓
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    ))}
                  </motion.div>
                  {selectedEmoji && (
                    <motion.p 
                      className="text-sm mt-3 text-white text-opacity-70"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {reactionOptions.find(r => r.emoji === selectedEmoji)?.text}
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          <motion.div 
            className="mt-6 flex justify-between items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-white text-opacity-80" />
              <span className="text-sm text-white text-opacity-80">Ready to test your knowledge?</span>
            </div>
            
            <Button
              onClick={handleCreateFlashcards}
              className="rounded-lg h-12 px-6 transition-all duration-200 flex items-center"
              style={{ 
                backgroundColor: 'var(--color-blazing-amber)',
                color: 'black',
                fontWeight: '600',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Smart Quiz...
                </>
              ) : (
                <motion.div 
                  className="flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Trophy className="h-5 w-5 mr-2" />
                  Create Smart Quiz
                </motion.div>
              )}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
