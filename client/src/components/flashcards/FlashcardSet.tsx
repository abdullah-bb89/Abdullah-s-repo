import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import FlashCard from "./FlashCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Flashcard {
  id: number;
  question: string;
  answer: string;
  setId: number;
}

interface FlashcardSetProps {
  setId: number;
}

export default function FlashcardSet({ setId }: FlashcardSetProps) {
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/flashcard-sets/${setId}`],
    throwOnError: false
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/flashcard-sets/${setId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete flashcard set");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${data?.userId}/flashcard-sets`] });
      toast({
        title: "Success",
        description: "Flashcard set deleted successfully",
      });
      // Could add navigation back to sets list here
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete flashcard set",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-4">
            <h3 className="text-lg font-medium text-red-600">Error loading flashcards</h3>
            <p className="text-sm text-gray-500 mt-2">
              {error instanceof Error ? error.message : "Failed to load flashcards. Please try again."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { title, flashcards } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            "Delete Set"
          )}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {flashcards.map((card: Flashcard, index: number) => (
          <FlashCard
            key={card.id}
            question={card.question}
            answer={card.answer}
            index={index}
            total={flashcards.length}
          />
        ))}
      </div>
    </div>
  );
}
