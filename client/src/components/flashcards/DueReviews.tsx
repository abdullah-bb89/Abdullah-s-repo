import { useState, useEffect } from "react";
import { getDueCards, getUpcomingReviews, getKnowledgeLevelText, getNextReviewDateText } from "@/lib/spacedRepetition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Calendar, Clock, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface FlashcardInfo {
  id: number;
  question: string;
  setId: number;
  setTitle: string;
}

export default function DueReviews() {
  const [dueCards, setDueCards] = useState<FlashcardInfo[]>([]);
  const [upcomingCards, setUpcomingCards] = useState<FlashcardInfo[]>([]);
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Get all flashcard sets for this user
  const { data: flashcardSets = [] } = useQuery<any[]>({
    queryKey: ['/api/users', user?.id, 'flashcard-sets'],
    enabled: !!user,
  });

  // Check for due cards periodically
  useEffect(() => {
    if (!flashcardSets.length) return;
    
    const getAllFlashcards = () => {
      // Flatten all flashcards from all sets and add set info
      return flashcardSets.flatMap((set: any) => {
        return (set.flashcards || []).map((card: any) => ({
          id: card.id,
          question: card.question,
          setId: set.id,
          setTitle: set.title
        }));
      });
    };
    
    const checkDue = () => {
      const dueCardIds = getDueCards();
      const upcomingCardIds = getUpcomingReviews(3); // Next 3 days
      
      const allFlashcards = getAllFlashcards();
      
      // Match card IDs to actual flashcard data
      const dueFlashcards = allFlashcards.filter((card) => 
        dueCardIds.includes(card.id.toString())
      );
      
      const upcomingFlashcards = allFlashcards.filter((card) => 
        upcomingCardIds.includes(card.id.toString()) && !dueCardIds.includes(card.id.toString())
      );
      
      setDueCards(dueFlashcards);
      setUpcomingCards(upcomingFlashcards);
      
      // If there are due cards, show a notification
      if (dueFlashcards.length > 0 && !document.hasFocus()) {
        // Only notify if app is not in focus
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Flashcards Due", {
            body: `You have ${dueFlashcards.length} flashcard${dueFlashcards.length === 1 ? '' : 's'} ready for review`,
            icon: "/favicon.ico"
          });
        }
      }
    };
    
    // Check on mount and every 5 minutes
    checkDue();
    const interval = setInterval(checkDue, 1000 * 60 * 5);
    
    return () => clearInterval(interval);
  }, [flashcardSets.length]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      toast({
        title: "Enable Notifications",
        description: "Get reminded when flashcards are due for review.",
        action: (
          <Button 
            onClick={() => Notification.requestPermission()}
            style={{ backgroundColor: 'var(--color-razor-crimson)' }}
          >
            Enable
          </Button>
        ),
      });
    }
  }, [toast]);

  if (!user) {
    return null;
  }

  // If no due or upcoming cards, return nothing
  if (dueCards.length === 0 && upcomingCards.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="mb-2"
          >
            <Card className="overflow-hidden border-0 shadow-lg w-72">
              <div className="h-1" style={{ backgroundColor: 'var(--color-blazing-amber)' }}></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm" style={{ color: 'var(--color-blazing-amber)' }}>
                    Due for Review
                  </h3>
                  <Badge variant="outline" className="text-white bg-opacity-20 border-opacity-30"
                    style={{ 
                      backgroundColor: 'var(--color-razor-crimson)', 
                      borderColor: 'var(--color-razor-crimson)' 
                    }}
                  >
                    {dueCards.length + upcomingCards.length} cards
                  </Badge>
                </div>
                
                {dueCards.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center mb-2">
                      <Clock className="h-4 w-4 mr-1 text-white opacity-80" />
                      <span className="text-sm text-white opacity-80">Due now:</span>
                    </div>
                    <div className="pl-2 border-l-2 border-opacity-30" style={{ borderColor: 'var(--color-razor-crimson)' }}>
                      {dueCards.slice(0, 3).map((card, i) => (
                        <div key={card.id} className="text-sm py-1 text-white">
                          <Link to={`/flashcard-set/${card.setId}`} className="hover:underline cursor-pointer">
                            {card.question.length > 30 ? card.question.substring(0, 30) + '...' : card.question}
                            <span className="opacity-60 text-xs block"> 
                              {card.setTitle} • {getKnowledgeLevelText(card.id.toString())}
                            </span>
                          </Link>
                        </div>
                      ))}
                      {dueCards.length > 3 && (
                        <div className="text-sm text-white opacity-60">
                          +{dueCards.length - 3} more cards
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {upcomingCards.length > 0 && (
                  <div>
                    <div className="flex items-center mb-2">
                      <Calendar className="h-4 w-4 mr-1 text-white opacity-80" />
                      <span className="text-sm text-white opacity-80">Upcoming:</span>
                    </div>
                    <div className="pl-2 border-l-2 border-opacity-30" style={{ borderColor: 'var(--color-neon-lime)' }}>
                      {upcomingCards.slice(0, 3).map((card, i) => (
                        <div key={`upcoming-${card.id}`} className="text-sm py-1 text-white">
                          <Link to={`/flashcard-set/${card.setId}`} className="hover:underline cursor-pointer">
                            {card.question.length > 30 ? card.question.substring(0, 30) + '...' : card.question}
                            <span className="opacity-60 text-xs block"> 
                              {card.setTitle} • {getNextReviewDateText(card.id.toString())}
                            </span>
                          </Link>
                        </div>
                      ))}
                      {upcomingCards.length > 3 && (
                        <div className="text-sm text-white opacity-60">
                          +{upcomingCards.length - 3} more cards
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <Link to="/saved">
                  <Button 
                    className="w-full mt-4 py-2 rounded-md"
                    style={{ backgroundColor: 'var(--color-blazing-amber)', color: 'black' }}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Start Review Session
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl"
        style={{ 
          backgroundColor: dueCards.length ? 'var(--color-razor-crimson)' : 'var(--color-blazing-amber)',
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="relative">
          <Brain className="h-6 w-6 text-white" />
          {dueCards.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {dueCards.length}
            </span>
          )}
        </div>
      </motion.button>
    </div>
  );
}