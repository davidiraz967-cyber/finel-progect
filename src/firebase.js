import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// אובייקט ההגדרות שמחבר אותנו לפרויקט בענן
const firebaseConfig = {
  apiKey: "AIzaSyCiBqCml3PAwqTlh1673LP5nN_WukTSW_o",
  authDomain: "final-project-b3534.firebaseapp.com",
  projectId: "final-project-b3534",
  storageBucket: "final-project-b3534.firebasestorage.app",
  messagingSenderId: "84868431802",
  appId: "1:84868431802:web:8bbc086073105f843a2783"
};

// 1. אתחול האפליקציה מול Firebase
const app = initializeApp(firebaseConfig);

// 2. ייצוא שירות האימות (רישום, כניסה, יציאה)
export const auth = getAuth(app);

// 3. ייצוא מסד הנתונים Firestore (שמירה ושליפה בזמן אמת)
export const db = getFirestore(app);