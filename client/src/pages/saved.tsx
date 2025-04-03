import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Brain, Calendar, Trophy } from "lucide-react";
import { Link } from "wouter";
import { type QuizScore } from "@shared/schema";

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

  // Query to fetch quiz scores for the current user
  const { data: quizScores = [], isLoading: isLoadingScores } = useQuery<QuizScore[]>({
    queryKey: [`/api/users/${user?.id}/quiz-scores`],
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen flex flex-col" 
      style={{ 
        backgroundColor: 'var(--color-midnight-blue)'
      }}
    >
      <Header />
      
      <main className="flex-grow">
        <div className="py-10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2"
                  style={{ 
                    color: 'var(--color-blazing-amber)',
                    textShadow: '0 0 10px rgba(255, 160, 0, 0.3)'
                  }}
                >
                  Quiz Score History
                </h1>
                <p className="text-white text-opacity-80 max-w-xl">
                  Track your progress and see how you've improved over time
                </p>
              </div>
              <Button 
                className="mt-4 md:mt-0"
                style={{ 
                  backgroundColor: 'var(--color-blazing-amber)',
                  color: 'black'
                }}
                asChild
              >
                <Link href="/">
                  <ArrowLeft className="h-5 w-5 mr-1" />
                  Back to Explorer
                </Link>
              </Button>
            </div>
            
            {isLoadingScores ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            ) : quizScores.length === 0 ? (
              <Card className="border-0 shadow-lg glass-card overflow-hidden">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" 
                    style={{ backgroundColor: 'rgba(255, 160, 0, 0.2)' }}
                  >
                    <Trophy className="h-8 w-8" style={{ color: 'var(--color-blazing-amber)' }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">No Quiz Scores Yet</h3>
                  <p className="text-white text-opacity-70 mb-6">
                    Complete quizzes to track your progress and see your scores here.
                  </p>
                  <Button 
                    style={{ 
                      backgroundColor: 'var(--color-razor-crimson)',
                      color: 'white'
                    }}
                    asChild
                  >
                    <Link href="/">
                      <Brain className="h-5 w-5 mr-2" />
                      Start Learning
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Stats cards */}
                  <Card className="border-0 shadow-lg glass-card overflow-hidden">
                    <div className="h-2" style={{ backgroundColor: 'var(--color-razor-crimson)' }}></div>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full flex items-center justify-center mr-4" 
                          style={{ backgroundColor: 'rgba(216, 27, 96, 0.2)' }}
                        >
                          <Trophy className="h-6 w-6" style={{ color: 'var(--color-razor-crimson)' }} />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-white opacity-90">Average Score</h3>
                          <p className="text-2xl font-bold" style={{ color: 'var(--color-razor-crimson)' }}>
                            {Math.round(quizScores.reduce((acc: number, score: QuizScore) => acc + score.percentageScore, 0) / quizScores.length)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-lg glass-card overflow-hidden">
                    <div className="h-2" style={{ backgroundColor: 'var(--color-blazing-amber)' }}></div>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full flex items-center justify-center mr-4" 
                          style={{ backgroundColor: 'rgba(255, 160, 0, 0.2)' }}
                        >
                          <Brain className="h-6 w-6" style={{ color: 'var(--color-blazing-amber)' }} />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-white opacity-90">Quizzes Taken</h3>
                          <p className="text-2xl font-bold" style={{ color: 'var(--color-blazing-amber)' }}>
                            {quizScores.length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* List of quiz scores */}
                <h2 className="text-xl font-semibold mt-10 mb-4 text-white">Recent Quiz Results</h2>
                
                <div className="space-y-4">
                  {quizScores.map((score: QuizScore, index: number) => (
                    <Card key={index} className="border-0 shadow-lg overflow-hidden glass-card hover:shadow-xl transition-all duration-300">
                      <div className="h-1" 
                        style={{ 
                          backgroundColor: score.percentageScore >= 80 
                            ? 'var(--color-neon-lime)' 
                            : score.percentageScore >= 60 
                              ? 'var(--color-blazing-amber)' 
                              : 'var(--color-razor-crimson)'
                        }}
                      ></div>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-medium mb-1 text-white">{score.topic}</h3>
                            <div className="flex items-center text-sm text-white text-opacity-70">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(score.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center">
                              <span className="text-sm mr-2 text-white text-opacity-80">Score:</span>
                              <span className={`text-xl font-bold px-3 py-1 rounded-full ${
                                score.percentageScore >= 80 
                                  ? 'bg-green-100 text-green-800' 
                                  : score.percentageScore >= 60 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-red-100 text-red-800'
                              }`}>
                                {score.percentageScore}%
                              </span>
                            </div>
                            <div className="text-sm mt-1 text-white text-opacity-70">
                              {score.score} out of {score.totalQuestions} correct
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
