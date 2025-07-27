import { createContext, useContext, ReactNode } from "react";
import { useFirebaseAuth } from "../hooks/useFirebaseAuth";

const AuthContext = createContext<ReturnType<typeof useFirebaseAuth> | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useFirebaseAuth();
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
} 