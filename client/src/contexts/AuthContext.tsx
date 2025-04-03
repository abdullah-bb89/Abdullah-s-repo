import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { subscribeToAuthChanges, syncUser, handleRedirectResult } from "@/lib/firebase";

interface User {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  firebaseUid: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initializeAuth() {
      setLoading(true);
      
      // Check for test user in localStorage
      const testUserJson = localStorage.getItem("testUser");
      if (testUserJson) {
        try {
          const testUser = JSON.parse(testUserJson);
          setUser(testUser);
          setLoading(false);
          return; // No need to set up Firebase auth if we're using a test user
        } catch (e) {
          console.error("Error parsing test user:", e);
          localStorage.removeItem("testUser");
        }
      }
      
      try {
        // First, check if we're coming back from a redirect
        const redirectResult = await handleRedirectResult();
        if (redirectResult && redirectResult.user) {
          console.log("Successfully handled Google sign-in redirect");
          // The auth state change will be handled by the subscription below
        }
      } catch (error) {
        console.error("Error handling redirect result:", error);
        // Continue with regular auth, even if redirect handling failed
      }
  
      // Regular Firebase auth
      const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
        try {
          if (firebaseUser) {
            // Sync with backend
            const userData = await syncUser(firebaseUser);
            setUser(userData);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Error in auth state change:", error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      });
      
      return unsubscribe;
    }
    
    const unsubscribe = initializeAuth();
    return () => {
      // Clean up the auth subscription when component unmounts
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
