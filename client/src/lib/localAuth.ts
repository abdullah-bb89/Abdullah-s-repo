// Simple local authentication system as an alternative to Firebase

export interface LocalUser {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

// Store user in localStorage
export const loginLocalUser = (email: string, password: string): LocalUser | null => {
  // This is a very simple authentication mechanism
  // In a real app, you would validate against a backend
  
  // For demo purposes, accept any valid-looking email with password length >= 6
  if (email.includes('@') && password.length >= 6) {
    const user: LocalUser = {
      id: Math.floor(Math.random() * 10000),
      username: email.split('@')[0],
      email: email,
      displayName: email.split('@')[0],
      photoURL: null
    };
    
    // Store user in localStorage
    localStorage.setItem('localUser', JSON.stringify(user));
    return user;
  }
  
  return null;
};

// Register a new local user
export const registerLocalUser = (email: string, password: string): LocalUser | null => {
  // In a real app, you would register with a backend
  return loginLocalUser(email, password);
};

// Logout local user
export const logoutLocalUser = (): void => {
  localStorage.removeItem('localUser');
};

// Get current local user
export const getCurrentLocalUser = (): LocalUser | null => {
  const userJson = localStorage.getItem('localUser');
  if (userJson) {
    try {
      return JSON.parse(userJson);
    } catch (e) {
      console.error('Error parsing local user:', e);
      localStorage.removeItem('localUser');
    }
  }
  return null;
};

// Check if the local user is logged in
export const isLocalUserLoggedIn = (): boolean => {
  return !!getCurrentLocalUser();
};