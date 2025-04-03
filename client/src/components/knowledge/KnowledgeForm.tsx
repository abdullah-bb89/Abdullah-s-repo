import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, BookOpen, PenTool } from "lucide-react";
import { generateKnowledge } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  question: z.string().min(5, "Question must be at least 5 characters long"),
});

type FormValues = z.infer<typeof formSchema>;

interface KnowledgeFormProps {
  onKnowledgeGenerated: (question: string, answer: string) => void;
  onQuizRequested?: (question: string, knowledge: string, flashcards: any) => void;
}

export default function KnowledgeForm({ onKnowledgeGenerated, onQuizRequested }: KnowledgeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const { toast } = useToast();
  const apiRequest = async (method: string, url: string, data?: any) => {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    
    return response.json();
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const answer = await generateKnowledge(data.question);
      onKnowledgeGenerated(data.question, answer);
    } catch (error) {
      let message = "Failed to generate knowledge";
      let title = "Error";
      
      if (error instanceof Error) {
        message = error.message;
        
        // Check for quota exceeded error
        if (message.includes("quota") || message.includes("insufficient_quota")) {
          title = "API Quota Exceeded";
          message = "The OpenAI API quota has been exceeded. Please try again later or contact the administrator to update the API key.";
        }
      }
      
      toast({
        variant: "destructive",
        title: title,
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTakeQuiz = async () => {
    const question = form.getValues("question");
    
    if (!question || question.length < 5) {
      form.setError("question", { 
        type: "manual", 
        message: "Please enter a valid topic to create a quiz" 
      });
      return;
    }
    
    setIsQuizLoading(true);
    try {
      const response = await apiRequest("POST", "/api/quiz/generate", { topic: question });
      
      if (onQuizRequested) {
        onQuizRequested(question, response.knowledge, response.flashcards);
      } else {
        // Fallback if the parent component doesn't implement onQuizRequested
        toast({
          title: "Quiz Created",
          description: "Your quiz is ready. Please scroll down to take it.",
        });
        
        // Use the regular flow if we don't have a direct quiz handler
        onKnowledgeGenerated(question, response.knowledge);
      }
    } catch (error) {
      let message = "Failed to generate quiz";
      let title = "Error";
      
      if (error instanceof Error) {
        message = error.message;
        
        // Check for quota exceeded error
        if (message.includes("quota") || message.includes("insufficient_quota")) {
          title = "API Quota Exceeded";
          message = "The API quota has been exceeded. Please try again later.";
        }
      }
      
      toast({
        variant: "destructive",
        title: title,
        description: message,
      });
    } finally {
      setIsQuizLoading(false);
    }
  };

  return (
    <Card className="rounded-xl shadow-lg p-1 border-0"
      style={{ 
        background: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        backdropFilter: 'blur(5px)'
      }}
    >
      <CardContent className="pt-8 pb-6 px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'white' }}>
                What would you like to learn about?
              </h3>
              <p className="text-sm opacity-80" style={{ color: 'var(--color-blazing-amber)' }}>
                Ask any question or enter a topic to explore and test your knowledge
              </p>
            </div>
            
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., How do black holes work? or The history of Ancient Rome"
                      className="resize-none text-lg p-4 rounded-lg"
                      rows={3}
                      {...field}
                      style={{ 
                        backgroundColor: 'rgba(255,255,255,0.1)', 
                        borderColor: 'var(--color-blazing-amber)',
                        borderWidth: '2px',
                        color: 'white',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-sm mt-2" style={{ color: 'var(--color-neon-lime)' }} />
                </FormItem>
              )}
            />
            
            <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
              <Button
                type="button"
                className="rounded-lg h-12 transition-all duration-200 hover:scale-[1.02] order-2 sm:order-1"
                disabled={isQuizLoading || isLoading}
                style={{ 
                  backgroundColor: 'var(--color-razor-crimson)',
                  color: 'white',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                onClick={(e) => {
                  e.preventDefault();
                  handleTakeQuiz();
                }}
              >
                {isQuizLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating quiz...
                  </>
                ) : (
                  <>
                    <PenTool className="mr-2 h-5 w-5" />
                    Take a Quiz Directly
                  </>
                )}
              </Button>
              
              <Button
                type="submit"
                className="rounded-lg h-12 transition-all duration-200 hover:scale-[1.02] order-1 sm:order-2"
                disabled={isLoading || isQuizLoading}
                style={{ 
                  backgroundColor: 'var(--color-blazing-amber)',
                  color: 'black',
                  fontWeight: '600',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Knowledge...
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-5 w-5" />
                    Generate Knowledge
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
