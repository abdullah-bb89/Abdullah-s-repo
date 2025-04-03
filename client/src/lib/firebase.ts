import { apiRequest } from "./queryClient";

// Define a minimal Firebase user type for compatibility
export type FirebaseUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  getIdToken: () => Promise<string>;
};

// Minimal authentication state
const mockFirebase = {
  auth: {
    currentUser: null as FirebaseUser | null,
  }
};

console.log("Firebase has been disabled. Test user login enabled.");

// Create a test user for development
const testUser: FirebaseUser = {
  uid: "test-uid-123",
  email: "test@example.com",
  displayName: "Test User",
  photoURL: null,
  getIdToken: () => Promise.resolve("fake-token"),
};

// Sign in with email (simplified for testing)
export const signInWithEmail = async (email: string, password: string) => {
  // Auto-login with test account for any credentials
  if (email === "abd@gmail.com" && password === "1234567") {
    const user = testUser;
    mockFirebase.auth.currentUser = user;
    
    // Store in localStorage for persistence
    localStorage.setItem("testUser", JSON.stringify({
      id: 1,
      username: "testuser",
      email: "test@example.com",
      displayName: "Test User",
      photoURL: null,
      firebaseUid: "test-uid-123"
    }));
    
    return { user };
  }
  
  throw new Error("Invalid login credentials. Try using test account: abd@gmail.com / 1234567");
};

// Sign up (simplified)
export const signUpWithEmail = async (email: string, password: string) => {
  return signInWithEmail("abd@gmail.com", "1234567");
};

// Google sign in (simplified)
export const signInWithGoogle = async () => {
  return signInWithEmail("abd@gmail.com", "1234567");
};

// Handle redirect (stub)
export const handleRedirectResult = async () => {
  return null;
};

// Logout function
export const logout = async () => {
  mockFirebase.auth.currentUser = null;
  localStorage.removeItem("testUser");
  return Promise.resolve();
};

// Sync user with backend (simplified)
export const syncUser = async (user: FirebaseUser) => {
  return {
    id: 1,
    username: "testuser",
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    firebaseUid: user.uid
  };
};

// Auth state listener
export const subscribeToAuthChanges = (callback: (user: FirebaseUser | null) => void) => {
  // Check if we have a stored user
  const storedUser = localStorage.getItem("testUser");
  if (storedUser) {
    mockFirebase.auth.currentUser = testUser;
    callback(testUser);
  } else {
    callback(null);
  }
  
  // Return unsubscribe function
  return () => {};
};

// Export auth object
export const auth = mockFirebase.auth;