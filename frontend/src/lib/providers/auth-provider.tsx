import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  UserCredential
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../config/firebase";
import { UserRole, User } from "../../types/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string, name: string, organization?: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (firebaseUser: FirebaseUser): Promise<UserRole> => {
    try {
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        return userDoc.data().role as UserRole;
      }
      return "user";
    } catch (error) {
      console.error("Error fetching user role:", error);
      return "user";
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const role = await fetchUserRole(firebaseUser);
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || "",
          role,
          avatar: firebaseUser.photoURL || undefined,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    organization?: string
  ): Promise<UserCredential> => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document in Firestore
    await setDoc(doc(db, "users", result.user.uid), {
      email: result.user.email,
      name,
      organization: organization || null,
      role: "user",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return result;
  };

  const signInWithGoogle = async (): Promise<UserCredential> => {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Check if user document exists, create if not
    const userDoc = await getDoc(doc(db, "users", result.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", result.user.uid), {
        email: result.user.email,
        name: result.user.displayName || "",
        organization: null,
        role: "user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return result;
  };

  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
  };

  const refreshUser = async (): Promise<void> => {
    if (auth.currentUser) {
      const role = await fetchUserRole(auth.currentUser);
      setUser({
        id: auth.currentUser.uid,
        email: auth.currentUser.email || "",
        name: auth.currentUser.displayName || "",
        role,
        avatar: auth.currentUser.photoURL || undefined,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
