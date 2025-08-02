import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react";
import { auth } from "../utils/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth";

const AuthContext = createContext<{ user: User | null; signOut: () => Promise<void> } | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      setUser(firebaseUser);
    });
    return unsubscribe;
  }, []);

  const signOut = useCallback(() => firebaseSignOut(auth), []);

  return <AuthContext.Provider value={{ user, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
