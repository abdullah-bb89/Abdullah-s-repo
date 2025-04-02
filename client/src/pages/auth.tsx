import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import AuthForm from "@/components/auth/AuthForm";

export default function AuthPage() {
  const [_, setLocation] = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // Redirect to home if already authenticated
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-midnight-blue)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-razor-crimson)' }}></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ 
        backgroundColor: 'var(--color-midnight-blue)',
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(26, 35, 126, 0.9) 0%, rgba(26, 35, 126, 1) 90%)'
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-razor-crimson)' }}>
            FlashGenius
          </h1>
          <p className="mt-2 text-lg" style={{ color: 'var(--color-blazing-amber)' }}>
            Your AI-powered learning assistant
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
