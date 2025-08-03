import { createContext, useContext, type ReactNode } from "react";
import { useSessionStorage } from "../hooks/use-session-storage";

// Define a generic user interface that works with WorkOS
interface WorkOSUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

const AuthContext = createContext<{ 
  user: WorkOSUser | null; 
  signOut: () => Promise<void>;
  setUser: (user: WorkOSUser | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { 
    session, 
    isLoading, 
    setSession, 
    clearSession, 
    isAuthenticated: checkAuth 
  } = useSessionStorage();

  const setUser = (user: WorkOSUser | null) => {
    if (user && session?.tokens) {
      // Update user in existing session
      setSession({
        ...session,
        user,
      });
    } else if (user) {
      // Create new session with user (tokens should be set separately)
      console.warn('Setting user without tokens. Use setSession with full session data instead.');
    } else {
      // Clear session
      clearSession();
    }
  };

  const signOut = async () => {
    clearSession();
  };

  return (
    <AuthContext.Provider value={{
      user: session?.user || null,
      signOut,
      setUser,
      isAuthenticated: checkAuth(),
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
