import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { subscribeToAuthChanges, syncUser } from "@/lib/firebase";

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
    // Check for test user in localStorage
    const testUserJson = localStorage.getItem("testUser");
    if (testUserJson) {
      try {
        const testUser = JSON.parse(testUserJson);
        setUser(testUser);
        setLoading(false);
        return () => {}; // No cleanup needed for test user
      } catch (e) {
        console.error("Error parsing test user:", e);
        localStorage.removeItem("testUser");
      }
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

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
