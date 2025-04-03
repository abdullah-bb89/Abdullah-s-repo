import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCurrentLocalUser } from "@/lib/localAuth";

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

  // Listen for changes in localStorage to update auth state
  useEffect(() => {
    const handleStorageChange = () => {
      checkUserAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Function to check user authentication state
  const checkUserAuth = () => {
    setLoading(true);
    
    // Check for local user (this includes simulated Google users now)
    const localUserJson = localStorage.getItem("localUser");
    if (localUserJson) {
      try {
        const localUser = JSON.parse(localUserJson);
        setUser({
          ...localUser,
          isLocalUser: true
        });
        setAuthType('local');
        setLoading(false);
        return;
      } catch (e) {
        console.error("Error parsing local user:", e);
        localStorage.removeItem("localUser");
      }
    }
    
    // Check for test user in localStorage (legacy support)
    const testUserJson = localStorage.getItem("testUser");
    if (testUserJson) {
      try {
        const testUser = JSON.parse(testUserJson);
        setUser(testUser);
        setAuthType('local');
        setLoading(false);
        return;
      } catch (e) {
        console.error("Error parsing test user:", e);
        localStorage.removeItem("testUser");
      }
    }
    
    // No authenticated user found
    setUser(null);
    setAuthType('none');
    setLoading(false);
  };

  // Initial auth check on mount
  useEffect(() => {
    checkUserAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, authType }}>
      {children}
    </AuthContext.Provider>
  );
}
