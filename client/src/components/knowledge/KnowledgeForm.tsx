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
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your question</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What's the deal with black holes?"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="mt-4 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                disabled={isQuizLoading || isLoading}
                onClick={(e) => {
                  e.preventDefault();
                  handleTakeQuiz();
                }}
              >
                {isQuizLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating quiz...
                  </>
                ) : (
                  <>
                    <PenTool className="mr-2 h-4 w-4" />
                    Take a Quiz
                  </>
                )}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isQuizLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Generate
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
