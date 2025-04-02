import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import SavedFlashcardSets from "@/components/flashcards/SavedFlashcardSets";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function SavedPage() {
  const [_, setLocation] = useLocation();
  const { user, loading } = useAuth();

  // Auth redirect effect
  useEffect(() => {
    if (!loading && !user) {
      // Redirect to auth page if not authenticated
      setLocation("/auth");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        <div className="py-6">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">Your Saved Flashcards</h1>
              <Button 
                variant="outline"
                asChild
              >
                <Link href="/">
                  <ArrowLeft className="h-5 w-5 mr-1" />
                  Back to Explorer
                </Link>
              </Button>
            </div>
            
            <div className="mt-6">
              <SavedFlashcardSets />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
