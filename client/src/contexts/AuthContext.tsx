import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { subscribeToAuthChanges, syncUser, handleRedirectResult } from "@/lib/firebase";
import { getCurrentLocalUser, type LocalUser } from "@/lib/localAuth";

export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  firebaseUid?: string; // Made optional for local users
  isLocalUser?: boolean; // Flag to identify local users
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authType: 'firebase' | 'local' | 'none';
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authType: 'none',
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authType, setAuthType] = useState<'firebase' | 'local' | 'none'>('none');

  useEffect(() => {
    async function initializeAuth() {
      setLoading(true);
      
      // Check for local user first (highest priority)
      const localUser = getCurrentLocalUser();
      if (localUser) {
        setUser({
          ...localUser,
          isLocalUser: true
        });
        setAuthType('local');
        setLoading(false);
        return; // No need to check other auth methods
      }
      
      // Check for test user in localStorage
      const testUserJson = localStorage.getItem("testUser");
      if (testUserJson) {
        try {
          const testUser = JSON.parse(testUserJson);
          setUser(testUser);
          setAuthType('local');
          setLoading(false);
          return; // No need to set up Firebase auth if we're using a test user
        } catch (e) {
          console.error("Error parsing test user:", e);
          localStorage.removeItem("testUser");
        }
      }
      
      try {
        // First, check if we're coming back from a redirect (Firebase)
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
      try {
        // Define the auth callback function outside of the subscribeToAuthChanges call
        const authCallback = async (firebaseUser: any) => {
          try {
            if (firebaseUser) {
              // Sync with backend
              try {
                const userData = await syncUser(firebaseUser);
                setUser(userData);
                setAuthType('firebase');
              } catch (syncError) {
                console.error("Error syncing user with backend:", syncError);
                setUser(null);
                setAuthType('none');
              }
            } else {
              setUser(null);
              setAuthType('none');
            }
          } catch (error) {
            console.error("Error in auth state change:", error);
            setUser(null);
            setAuthType('none');
          } finally {
            setLoading(false);
          }
        };
        
        // Now subscribe to auth changes
        const unsubscribe = subscribeToAuthChanges(authCallback);
        return unsubscribe;
      } catch (error) {
        console.error("Failed to set up Firebase auth:", error);
        setLoading(false);
        setAuthType('none');
        return null;
      }
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
    <AuthContext.Provider value={{ user, loading, authType }}>
      {children}
    </AuthContext.Provider>
  );
}
