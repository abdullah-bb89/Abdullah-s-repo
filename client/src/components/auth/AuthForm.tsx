import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signInWithEmail, signUpWithEmail } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import GoogleSignIn from "./GoogleSignIn";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

const signupSchema = loginSchema.extend({
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      rememberMe: false,
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // Special case for test account
      if (data.email === "abd@gmail.com" && data.password === "1234567") {
        toast({
          title: "Test Account",
          description: "Logging in with test account",
        });
        // Delay to simulate network request
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Manually set the user in localStorage for testing
        localStorage.setItem("testUser", JSON.stringify({
          id: 1,
          username: "testuser",
          email: "abd@gmail.com",
          displayName: "Test User",
          photoURL: null,
          firebaseUid: "test-firebase-uid-123"
        }));
        // Reload the page to trigger auth change
        window.location.href = "/";
        return;
      }
      
      await signInWithEmail(data.email, data.password);
      // Firebase auth state will be handled by the AuthContext
    } catch (error) {
      let message = "Failed to sign in";
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSignupSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      await signUpWithEmail(data.email, data.password);
      // Firebase auth state will be handled by the AuthContext
    } catch (error) {
      let message = "Failed to sign up";
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="max-w-md w-full bg-white rounded-xl shadow-md overflow-hidden p-8 space-y-8 transition-all duration-300">
      <div className="text-center">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-3xl font-bold text-gray-900">FlashKnowledge</h2>
        <p className="mt-2 text-sm text-gray-600">Your personal learning assistant</p>
      </div>

      {isLogin ? (
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="you@example.com" 
                      {...field} 
                      type="email"
                      autoComplete="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="••••••••" 
                      {...field} 
                      type="password"
                      autoComplete="current-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <FormField
                control={loginForm.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Remember me</FormLabel>
                  </FormItem>
                )}
              />
              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                  Forgot password?
                </a>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...signupForm}>
          <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-6">
            <FormField
              control={signupForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="you@example.com" 
                      {...field} 
                      type="email"
                      autoComplete="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={signupForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="••••••••" 
                      {...field} 
                      type="password"
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={signupForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="••••••••" 
                      {...field} 
                      type="password"
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing up..." : "Sign up"}
            </Button>
          </form>
        </Form>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <GoogleSignIn />

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            type="button"
            className="ml-2 font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
            onClick={toggleAuthMode}
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
