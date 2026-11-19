import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // פונקציית הרשמה חדשה למערכת (מוגדר כ-reporter כברירת מחדל)
  async function signup(email, password) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // יצירת מסמך המשתמש באוסף users עם תפקיד מדווח
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role: "reporter",
      createdAt: new Date()
    });

    setUserRole("reporter");
    return userCredential;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            setUserRole("reporter");
          }
        } catch (err) {
          console.error("שגיאה בשליפת הרשאת משתמש:", err);
          setUserRole("reporter");
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <p>loading data</p> : children}
    </AuthContext.Provider>
  );
}