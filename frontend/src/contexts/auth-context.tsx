import { createContext, useContext, type ReactNode } from "react";
import { useSessionStorage } from "../hooks/use-session-storage";

// Define a generic user interface that works with the API response
interface User {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // Allow additional properties
}

const AuthContext = createContext<{ 
  user: User | null; 
  signOut: () => Promise<void>;
  login: () => Promise<void>;
  refreshSession: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSigningOut: boolean;
  isLoggingIn: boolean;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    user,
    isLoading,
    signOut,
    login,
    refreshSession,
    isAuthenticated,
    isSigningOut,
    isLoggingIn,
  } = useSessionStorage();

  const handleSignOut = async (): Promise<void> => {
    await signOut();
  };

  const handleLogin = async (): Promise<void> => {
    await login();
  };

  return (
    <AuthContext.Provider value={{
      user: user || null,
      signOut: handleSignOut,
      login: handleLogin,
      refreshSession,
      isAuthenticated,
      isLoading,
      isSigningOut,
      isLoggingIn,
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
