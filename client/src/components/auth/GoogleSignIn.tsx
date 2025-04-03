import { useState, useEffect } from "react";
import { signInWithGoogle, handleRedirectResult } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function GoogleSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Check for redirect result when component mounts
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await handleRedirectResult();
        if (result) {
          // The redirect was successful, but Firebase will handle the auth state change
          // through the AuthContext, so we don't need to do anything here
          console.log("Google signin redirect completed successfully");
        }
      } catch (error) {
        let message = "Failed to complete Google sign-in";
        if (error instanceof Error) {
          message = error.message;
        }
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: message,
        });
      }
    };
    
    checkRedirectResult();
  }, [toast]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      toast({
        title: "Redirecting to Google",
        description: "You'll be redirected to Google's authentication page.",
      });
      
      await signInWithGoogle();
      // User will be redirected to Google's login page
      // After successful login, they'll be redirected back to our app
      // and the redirect result will be handled in the useEffect above
    } catch (error) {
      let message = "Failed to sign in with Google";
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: message,
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      className="w-full"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      style={{ 
        backgroundColor: 'white',
        color: '#333',
        border: '2px solid rgba(255,255,255,0.1)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        fontSize: '0.95rem',
        fontWeight: 500,
        transition: 'all 0.2s ease'
      }}
    >
      <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
          <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
          <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
          <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
          <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
        </g>
      </svg>
      {isLoading ? "Connecting..." : "Sign in with Google"}
    </Button>
  );
}
