import { createSignal, onCleanup } from "solid-js";
import { auth } from "../utils/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth";

export function useFirebaseAuth() {
  const [user, setUser] = createSignal<User | null>(auth.currentUser);

  const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
    setUser(firebaseUser);
  });

  onCleanup(() => unsubscribe());

  const signOut = () => firebaseSignOut(auth);

  return { user, signOut };
} 