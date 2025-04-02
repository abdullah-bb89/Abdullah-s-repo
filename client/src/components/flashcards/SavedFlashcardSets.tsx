import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, FileBox, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface FlashcardSet {
  id: number;
  title: string;
  userId: number;
  originalQuestion: string;
  originalAnswer: string;
  createdAt: string;
  cardCount: number;
}

export default function SavedFlashcardSets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: flashcardSets, isLoading, error } = useQuery({
    queryKey: [`/api/users/${user?.id}/flashcard-sets`],
    throwOnError: false,
    enabled: !!user?.id,
  });

  const handleDelete = async (e: React.MouseEvent, setId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm("Are you sure you want to delete this flashcard set?")) {
      try {
        setDeletingId(setId);
        await apiRequest("DELETE", `/api/flashcard-sets/${setId}`);
        
        // Invalidate the cache to refresh the list
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/flashcard-sets`] });
        
        toast({
          title: "Success",
          description: "Flashcard set deleted successfully",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete flashcard set",
        });
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-4">
            <h3 className="text-lg font-medium text-red-600">Error loading flashcard sets</h3>
            <p className="text-sm text-gray-500 mt-2">
              {error instanceof Error ? error.message : "Failed to load flashcard sets. Please try again."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!flashcardSets || flashcardSets.length === 0) {
    return (
      <Card className="col-span-full">
        <CardContent className="px-4 py-12 sm:p-12 text-center">
          <FileBox className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No saved flashcards</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first set of flashcards by asking a question in the Knowledge Explorer.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/">Go to Explorer</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {flashcardSets.map((set: FlashcardSet) => {
        const createdDate = new Date(set.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
        
        return (
          <Card key={set.id} className="overflow-hidden">
            <CardContent className="p-0">
              <Link href={`/sets/${set.id}`}>
                <div className="px-4 py-5 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors">
                  <h3 className="text-lg font-medium text-gray-900 truncate">{set.title}</h3>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <FileBox className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    <span>{set.cardCount} cards</span>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    <span>Saved on {createdDate}</span>
                  </div>
                  <div className="mt-4 flex space-x-3">
                    <Button size="sm">Study</Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => handleDelete(e, set.id)}
                      disabled={deletingId === set.id}
                    >
                      {deletingId === set.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
