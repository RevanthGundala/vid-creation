import { createContext, useContext } from "solid-js";
import type { JSX } from "solid-js";
import { useFirebaseAuth } from "../hooks/useFirebaseAuth";

const AuthContext = createContext<ReturnType<typeof useFirebaseAuth>>();

export function AuthProvider(props: { children: JSX.Element }) {
  const auth = useFirebaseAuth();
  return (
    <AuthContext.Provider value={auth}>
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
} 