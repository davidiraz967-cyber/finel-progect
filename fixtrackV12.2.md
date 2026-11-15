# FixTrack — ספר פרויקט מלא, הסבר קוד מעמיק ומאגר 38 שאלות הגנה

**גרסת לימוד והגנה סופית (v12)**

*מכללת אתגר | המכון הממשלתי להכשרה בטכנולוגיה ובמדע (מה"ט)*

*ארכיטקטורת React + Firebase + Groq Cloud AI, פירוט מלא של כל קובץ ופונקציה בקוד, זרימת נתונים מקצה לקצה, חוקי אבטחה ו-38 שאלות בוחן עם תשובות מחץ.*

| פרטים מזהים | מידע על הפרויקט | 
| ----- | ----- | 
| **שמות הסטודנטים המגישים** | רז דוידי, שמואל אורדן | 
| **מוסד לימודים** | מכללת אתגר (מסלול הנדסת תוכנה / DevOps — מה"ט) | 
| **שם המערכת** | FixTrack — Campus Maintenance & AI Triage System | 
| **מחסנית טכנולוגית** | React 18 + Vite, Tailwind CSS v3, Firebase Auth & Cloud Firestore, Groq AI (`openai/gpt-oss-120b`) | 
| **גרסת מסמך** | v12 — גרסת לימוד מלאה (פירוט קוד מלא + הסברי שורה-אחר-שורה + 38 שאלות הגנה) | 

## פרק 1: תעודת זהות, מטרות המערכת וארכיטקטורת Full-Stack

### 1.1 מטרת הפרויקט והגדרת הצרכים העסקיים

מערכת **FixTrack** היא אפליקציית Web מודרנית (**Single Page Application - SPA**) לניהול, אבחון ותעדוף תקלות תחזוקה בקמפוס. המערכת מחליפה דיווחים ידניים ומבוזרים (וואטסאפ, טלפונים, פתקים) במערכת ענן מרכזית הפועלת בזמן אמת:

* **דיווח תקלות מהיר ומאובטח:** סטודנטים ומרצים פותחים קריאות תוך שניות עם שיוך לחדר וקטגוריה הנשלפים דינמית מהענן.

* **מניעת כפילויות ואבחון AI חכם:** בדיקת כפילויות בזמן אמת מול תקלות פתוחות באותו חדר, מתן צעדים לפתרון עצמי בעזרת **Groq AI**, זיהוי סתירות בין קטגוריה לתיאור, ותעדוף אוטומטי (`רגילה` / `גבוהה` / `קריטית`).

* **לוח בקרה וניהול לצוות האחזקה:** תצוגת על בזמן אמת (WebSockets), כלי קיטלוג מלאים (שינוי סטטוס, דחיפות וקטגוריה) וסיכום מנהלים חכם מבוסס AI.

* **בקרת הרשאות (RBAC):** הפרדה מוחלטת בין מדווחים (`reporter`) לצוות אחזקה (`maintenance`), הן ברמת ממשק המשתמש והן ברמת חוקי האבטחה בשרת.

### 1.2 זרימת המידע במערכת מקצה לקצה (End-to-End Flow)

כדי להבין את הקוד במבט-על (במיוחד לקראת שאלות הבוחן), כך זורם המידע מרגע כניסת המשתמש ועד לטיפול בתקלה:

1. **שלב 1 — הזדהות וטעינת הרשאות:** המשתמש מתחבר דרך Firebase Auth. המאזין `onAuthStateChanged` בקובץ `AuthContext` מזהה את ה-UID, ניגש לאוסף `users` ב-Firestore, שולף את ה-`role` ומזריק אותו לכל האפליקציה דרך `useAuth()`.

2. **שלב 2 — האזנה חיה ללוח הבקרה:** הקומפוננטה `Dashboard` מפעילה `onSnapshot` על אוסף `issues`. כל שינוי בענן מעדכן מיד את מערך `issues` בזיכרון הדפדפן ללא ריענון עמוד.

3. **שלב 3 — פתיחת קריאה חכמה:** הסטודנט בוחר חדר ומקליד כותרת במודאל `NewIssueModal`. המערכת בודקת בזיכרון אם כבר קיימת תקלה פתוחה דומה באותו חדר. בלחיצה על **אבחון חכם** (או אוטומטית בעת השליחה), הקוד פונה ל-`aiService.js` שמחזיר JSON מובנה עם טיפים, תיקון קטגוריה ודחיפות. אם הרשת נופלת, מופעל גיבוי מקומי (`detectFallbackPriority`).

4. **שלב 4 — קיטלוג, סיכום מנהלים ומחיקה:** צוות האחזקה רואה את התקלה קופצת מיד על המסך, יכול להפיק **סיכום מצב חכם (AI)**, לעדכן סטטוס/דחיפות/קטגוריה דרך `updateDoc` מתוך `IssueCard`, או למחוק תקלה דרך מודאל אישור מעוצב ו-`deleteDoc`.

### 1.3 סכמת מסד הנתונים (Firestore Database Schema)

| אוסף (Collection) | שם שדה (Field) | סוג נתון | תיאור וערכים במערכת | 
| ----- | ----- | ----- | ----- | 
| **users** | `uid` | String | מזהה ייחודי מסונכרן מול Firebase Auth | 
| **users** | `email` | String | כתובת הדוא"ל של המשתמש | 
| **users** | `role` | String | הערכים: `'reporter'` (ברירת מחדל) או `'maintenance'` | 
| **users** | `createdAt` | Timestamp | זמן יצירת המשתמש במערכת | 
| **rooms** | `name` | String | שם החדר (לדוגמה: `'מעבדת מחשבים 101'`) | 
| **rooms** | `building` | String | שם הבניין (לדוגמה: `'בניין הנדסה'`) | 
| **issues** | `title` | String | כותרת קצרה של התקלה (מוגבלת ל-100 תווים) | 
| **issues** | `description` | String | פירוט התקלה (מוגבל ל-400 תווים) | 
| **issues** | `category` | String | הערכים: `'חשמל'`, `'מחשוב ומקרנים'`, `'מיזוג אוויר'`, `'בינוי וריהוט'`, `'ניקיון'` | 
| **issues** | `priority` | String | רמת דחיפות אוטומטית או ידנית: `'רגילה'`, `'גבוהה'`, או `'קריטית'` | 
| **issues** | `room` | String | שם החדר שבו אותרה התקלה | 
| **issues** | `status` | String | הערכים: `'open'`, `'in-progress'`, או `'closed'` | 
| **issues** | `reportedBy` | String | כתובת הדוא"ל של המדווח | 
| **issues** | `reporterUid` | String | מזהה המדווח — משמש לאבטחת מחיקה וסינון אישי | 
| **issues** | `createdAt` | Timestamp | חותמת זמן של שרת Firebase (`serverTimestamp`) | 

## פרק 2: מדריך לימוד הקוד המלא — הסבר על כל קובץ ופונקציה

בפרק זה מרוכז הקוד המלא של המערכת יחד עם הסבר מפורט בעברית על כל חלק, מסודר כך שכל כותרת והסבר יהיו קריאים וברורים לחלוטין ללא היפוך שורות בין עברית לאנגלית.

### 2.1 נקודת הכניסה וחיבור הענן

#### הקובץ `src/main.jsx`

זוהי נקודת ההרצה של React שתופסת את אלמנט ה-`root` מתוך הדף `index.html` ומפעילה את האפליקציה תחת המעטפת `React.StrictMode` (כלי פיתוח המאתר באגים וזליגות זיכרון).

#### הקובץ `src/firebase.js`

קובץ זה מיישם תבנית עיצוב מסוג **Singleton** — הוא מאתחל פעם אחת בלבד את החיבור ל-Firebase ומייצא את המופעים `auth` ו-`db` לשימוש כל שאר הקבצים במערכת.

```
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "final-project-b3534.firebaseapp.com",
  projectId: "final-project-b3534",
  storageBucket: "final-project-b3534.appspot.com",
  messagingSenderId: "84868431802",
  appId: "1:84868431802:web:..."
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

```

### 2.2 ניהול משתמשים והגנת נתיבים

#### הקובץ `src/context/AuthContext.jsx`

קובץ זה פותר את בעיית ה-**Prop Drilling** בעזרת React Context API. המאזין `onAuthStateChanged` רץ ברקע ומזהה התחברות, התנתקות או רענון דף. ברגע שיש משתמש מחובר, הקוד שולף מ-Firestore את התפקיד שלו (`role`) ושומר אותו במשתנה `userRole`. המשתנה `loading` מונע הצגת מסך שגוי עד שהבדיקה מול השרת מסתיימת.

#### הקובץ `src/components/ProtectedRoute.jsx`

זוהי קומפוננטת מעטפת העוטפת את הנתיב `/dashboard` וחוסמת גישה למי שאינו מחובר באמצעות הפניה אוטומטית לדף הבית (`<Navigate to="/" replace />`).

```
// src/context/AuthContext.jsx
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        setUserRole(userDoc.exists() ? userDoc.data().role : "reporter");
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe; // Cleanup listener
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userRole, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

```

### 2.3 שכבת שירותי הבינה המלאכותית

#### הקובץ `src/services/aiService.js`

קובץ זה הוא "המוח" של ה-AI במערכת. הוא מפריד את התקשורת החיצונית (`fetch` מול Groq API) מקומפוננטות התצוגה וכולל שלוש פונקציות מרכזיות:

* **הפונקציה `callGroq(systemPrompt, userPrompt)`:** פונקציית עזר פנימית השולחת בקשת `POST` עם מפתח האבטחה מתוך הקובץ `.env`, מגדירה `reasoning_effort: "low"` לתגובה מהירה, ומטפלת בשגיאת עומס (`429`).

* **הפונקציה `analyzeNewIssue`:** דורשת מהמודל להחזיר JSON מובנה בלבד, מחלצת אותו בעזרת ביטוי רגולרי (Regex), ומאמתת (**Whitelist Validation**) שהקטגוריה והדחיפות שחזרו אכן קיימות ברשימות המותרות במערכת.

* **הפונקציה `summarizeOpenIssues`:** מקבלת את התקלות הפתוחות, מקצרת אותן לטקסט תמציתי (עד 20 תקלות לחיסכון בטוקנים), ומבקשת מה-AI סיכום ניהולי ב-3 נקודות לצוות האחזקה.

```
// src/services/aiService.js
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_NAME = "openai/gpt-oss-120b";

export const ALLOWED_CATEGORIES = [
  "חשמל", "מחשוב ומקרנים", "מיזוג אוויר", "בינוי וריהוט", "ניקיון"
];

async function callGroq(systemPrompt, userPrompt) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
  if (!apiKey) throw new Error("חסר מפתח VITE_GROQ_API_KEY בקובץ .env");

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      reasoning_effort: "low",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 1500
    })
  });

  const data = await response.json();
  if (!response.ok) {
    if (response.status === 429) throw new Error("העוזר החכם עמוס כרגע, נסה שוב בעוד מספר שניות");
    throw new Error(data.error?.message || `שגיאת שרת (${response.status})`);
  }

  return data.choices?.[0]?.message?.content || "";
}

export async function analyzeNewIssue({ title, category, description }) {
  const systemPrompt = `אתה עוזר טכני במכללה בישראל. ענה אך ורק בעברית תקנית ובאובייקט JSON תקין בלבד (ללא טקסט נוסף) עם המפתחות האלו:
{
  "hasMismatch": true/false,
  "mismatchNote": "הסבר קצר בעברית אם יש סתירה בין הכותרת, הקטגוריה והתיאור, אחרת מחרוזת ריקה",
  "suggestedCategory": "בחר בדיוק מתוך: ${ALLOWED_CATEGORIES.join(", ")}",
  "suggestedPriority": "בחר בדיוק מתוך: רגילה, גבוהה, קריטית",
  "tips": "2 נקודות קצרות בעברית לבדיקה עצמית"
}`;

  const userPrompt = `כותרת: "${title.slice(0, 100)}"\nקטגוריה: "${category}"\nתיאור: "${description.slice(0, 400)}"`;
  const raw = await callGroq(systemPrompt, userPrompt);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("התשובה מהשרת לא הושלמה, נסה שוב");

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    hasMismatch: Boolean(parsed.hasMismatch),
    mismatchNote: parsed.mismatchNote || "",
    suggestedCategory: ALLOWED_CATEGORIES.includes(parsed.suggestedCategory) ? parsed.suggestedCategory : category,
    suggestedPriority: ["רגילה", "גבוהה", "קריטית"].includes(parsed.suggestedPriority) ? parsed.suggestedPriority : "רגילה",
    tips: parsed.tips || ""
  };
}

export async function summarizeOpenIssues(openIssues) {
  const compactList = openIssues
    .slice(0, 20)
    .map((i, idx) => `${idx + 1}. חדר: ${i.room} | קטגוריה: ${i.category} | דחיפות: ${i.priority || "רגילה"} | כותרת: ${i.title}`)
    .join("\n");

  const systemPrompt =
    "אתה מנהל אחזקה חכם במכללה בישראל. ענה אך ורק בעברית תקנית, בקצרה וב-3 נקודות ברורות: זהה חדרים עם ריבוי תקלות, הדגש תקלות דחופות/קריטיות, והמלץ על סדר פעולות יעיל לצוות.";

  return await callGroq(systemPrompt, `להלן רשימת התקלות הפתוחות כרגע:\n${compactList}`);
}

```

### 2.4 טופס הדיווח החכם, מניעת כפילויות ותעדוף היברידי

#### הקובץ `src/components/NewIssueModal.jsx`

קומפוננטה זו מטפלת ביצירת תקלה חדשה (`Create`) ומשלבת 4 מנגנונים חכמים:

1. **שליפת חדרים דינמית (`useEffect`):** בעת פתיחת המודאל, נשלפת רשימת החדרים מאוסף `rooms` ב-Firestore.

2. **זיהוי כפילויות בזמן אמת (`duplicateIssue`):** בכל הקלדה בשדה הכותרת (מעל 3 תווים), הקוד סורק את המערך `existingIssues` שהועבר כ-Prop מהדשבורד. אם יש תקלה לא סגורה באותו חדר עם מילה זהה, קופצת התראה צהובה מעל הטופס.

3. **אבחון אינטראקטיבי (`handleAskAi`):** בלחיצה על כפתור העזרה, מוצגים למשתמש טיפים לבדיקה עצמית, תגית דחיפות וכפתור לתיקון אוטומטי של הקטגוריה אם זוהתה סתירה.

4. **שליחה היברידית (`handleSubmit`):** אם המשתמש לא לחץ על כפתור ה-AI מראש, הקוד מריץ אוטומטית את `analyzeNewIssue` ברקע לפני השמירה; ואם הרשת נופלת, מופעלת הפונקציה `detectFallbackPriority` כגיבוי מקומי.

```
// src/components/NewIssueModal.jsx
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { ALLOWED_CATEGORIES, analyzeNewIssue } from "../services/aiService";

function detectFallbackPriority(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const criticalWords = ["קצר", "שרוף", "עשן", "אש", "התחשמלות", "הצפה", "נזילה", "סכנה", "שבור"];
  const highWords = ["מקרן", "מזגן", "אינטרנט", "רשת", "לא נדלק", "מושבת", "תקוע", "אין מים", "ברז"];

  if (criticalWords.some(word => text.includes(word))) return "קריטית";
  if (highWords.some(word => text.includes(word))) return "גבוהה";
  return "רגילה";
}

export default function NewIssueModal({ isOpen, onClose, existingIssues = [] }) {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("חשמל");
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    async function fetchRooms() {
      try {
        const snap = await getDocs(collection(db, "rooms"));
        const roomsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRooms(roomsList);
        if (roomsList.length > 0) setRoomId(roomsList[0].name);
      } catch (err) {
        console.error("שגיאה בשליפת חדרים:", err);
      }
    }
    if (isOpen) {
      fetchRooms();
      setError("");
      setAiResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // בדיקת כפילות חכמה בזמן אמת באותו חדר
  const duplicateIssue = title.trim().length >= 3
    ? existingIssues.find((issue) => {
        if (issue.status === "closed" || issue.room !== roomId) return false;
        const words = title.trim().split(/\s+/).filter(w => w.length >= 2);
        return words.some(word => issue.title.includes(word) || issue.description?.includes(word));
      })
    : null;

  async function handleAskAi() {
    if (!title.trim() && !description.trim()) {
      return setError("יש להזין כותרת או תיאור תקלה כדי לקבל עזרה");
    }
    setError("");
    setAiLoading(true);
    setAiResult(null);
    try {
      const result = await analyzeNewIssue({ title, category, description });
      setAiResult(result);
    } catch (err) {
      setError(err.message || "לא ניתן היה להשלים את האבחון כרגע");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return setError("יש למלא את כל השדות");

    try {
      setError("");
      setLoading(true);
      let finalPriority = aiResult?.suggestedPriority;

      if (!finalPriority) {
        try {
          const autoAnalysis = await analyzeNewIssue({ title, category, description });
          finalPriority = autoAnalysis.suggestedPriority;
        } catch {
          finalPriority = detectFallbackPriority(title, description);
        }
      }

      await addDoc(collection(db, "issues"), {
        title: title.trim(),
        description: description.trim(),
        category,
        priority: finalPriority,
        room: roomId,
        status: "open",
        reportedBy: currentUser.email,
        reporterUid: currentUser.uid,
        createdAt: serverTimestamp()
      });

      setTitle("");
      setDescription("");
      setAiResult(null);
      onClose();
    } catch (err) {
      setError("שגיאה בשמירת התקלה, נסה שוב");
    } finally {
      setLoading(false);
    }
  }
  // ... (חלק ה-JSX מציג את הטופס, התראת הכפילות, ותוצאת ה-AI המעוצבת)
}

```

### 2.5 קומפוננטת כרטיס תקלה וקיטלוג אחזקה

#### הקובץ `src/components/IssueCard.jsx`

קומפוננטת תצוגה נקייה האחראית על הצגת כרטיס תקלה בודד. במקום משפטי `switch` ארוכים, הקובץ משתמש באובייקטי מיפוי (`STATUS_BADGES` ו-`PRIORITY_BADGES`) לשליפה מיידית של העיצוב והטקסט. עבור צוות אחזקה (`isMaintenance`), הכרטיס מציג 3 תפריטי בחירה לעדכון בזמן אמת של **הסטטוס**, **הדחיפות** ו**הקטגוריה**.

```
// src/components/IssueCard.jsx
import { ALLOWED_CATEGORIES } from "../services/aiService";

const STATUS_BADGES = {
  open: { label: "פתוח", style: "bg-amber-100 text-amber-800 border-amber-300" },
  "in-progress": { label: "בטיפול", style: "bg-blue-100 text-blue-800 border-blue-300" },
  closed: { label: "טופל ונסגר", style: "bg-emerald-100 text-emerald-800 border-emerald-300" }
};

const PRIORITY_BADGES = {
  "קריטית": { label: "🔥 קריטית", style: "bg-red-100 text-red-700 border-red-200 font-bold" },
  "גבוהה": { label: "⚠️ גבוהה", style: "bg-orange-100 text-orange-800 border-orange-200 font-semibold" },
  "רגילה": { label: "רגילה", style: "bg-slate-100 text-slate-600 border-transparent font-medium" }
};

export default function IssueCard({ issue, userRole, currentUid, onUpdate, onDeleteClick }) {
  const isMaintenance = userRole === "maintenance";
  const canDelete = isMaintenance || currentUid === issue.reporterUid;

  const statusInfo = STATUS_BADGES[issue.status] || { label: issue.status, style: "bg-slate-100 text-slate-700" };
  const priorityInfo = PRIORITY_BADGES[issue.priority || "רגילה"] || PRIORITY_BADGES["רגילה"];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">{issue.category}</span>
            <span className={`text-xs px-2 py-0.5 rounded-md border ${priorityInfo.style}`}>{priorityInfo.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`border text-xs px-2.5 py-1 rounded-full font-semibold ${statusInfo.style}`}>{statusInfo.label}</span>
            {canDelete && (
              <button onClick={() => onDeleteClick(issue)} title="מחק תקלה" className="text-slate-300 hover:text-red-500 transition p-1 rounded-md">🗑️</button>
            )}
          </div>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">{issue.title}</h3>
        <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium mb-3"><span>📍</span><span>{issue.room}</span></div>
        <p className="text-sm text-slate-600 mb-4 whitespace-pre-wrap line-clamp-3">{issue.description}</p>
      </div>

      <div className="border-t border-slate-100 pt-3 mt-2">
        <div className="text-[11px] text-slate-400 mb-3">דווח ע״י: {issue.reportedBy}</div>
        {isMaintenance ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-medium text-slate-600">סטטוס:</label>
              <select value={issue.status} onChange={(e) => onUpdate(issue.id, { status: e.target.value })} className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1">
                <option value="open">פתוח</option>
                <option value="in-progress">בטיפול</option>
                <option value="closed">טופל ונסגר</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">דחיפות:</label>
                <select value={issue.priority || "רגילה"} onChange={(e) => onUpdate(issue.id, { priority: e.target.value })} className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1">
                  <option value="רגילה">רגילה</option>
                  <option value="גבוהה">גבוהה</option>
                  <option value="קריטית">קריטית</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">קטגוריה:</label>
                <select value={issue.category} onChange={(e) => onUpdate(issue.id, { category: e.target.value })} className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1">
                  {ALLOWED_CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400">
            סטטוס: {issue.status === "open" ? "ממתין לבדיקה" : issue.status === "in-progress" ? "בטיפול הצוות" : "הטיפול הושלם"}
          </div>
        )}
      </div>
    </div>
  );
}

```

### 2.6 לוח הבקרה המרכזי

#### הקובץ `src/pages/Dashboard.jsx`

זהו "המנצח על התזמורת". הקובץ מנהל את הזרימה הראשית של המערכת:

* **האזנה בזמן אמת (`onSnapshot`):** מושכת את כל התקלות ממוינות לפי תאריך יצירה יורד, ומחזירה פונקציית Cleanup בסגירת המסך.

* **סינון חכם ומונים חיים (`filterTabs`):** מערך תצורה שמייצר את 4 הטאבים בלולאה ומחשב מונים בזיכרון. מסנן "רק תקלות שאני דיווחתי" מוצג אך ורק למדווחים (לא לאחזקה).

* **סיכום מנהלים חכם (`handleGenerateSummary`):** שולח את התקלות הפתוחות לפונקציה `summarizeOpenIssues` ומציג תמונת מצב מרוכזת.

* **חוויית משתמש נקייה (Custom Modals & Banners):** במקום חלונות דפדפן מיושנים (`alert` או `confirm`), קיימים משתני State (`issueToDelete` ו-`uiError`) המציגים חלונית אישור מעוצבת ובאנר שגיאות שנעלם אוטומטית אחרי 4 שניות.

```
// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import NewIssueModal from "../components/NewIssueModal";
import IssueCard from "../components/IssueCard";
import { summarizeOpenIssues } from "../services/aiService";

export default function Dashboard() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [onlyMyIssues, setOnlyMyIssues] = useState(false);

  const [aiSummary, setAiSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [uiError, setUiError] = useState("");

  useEffect(() => {
    const q = query(collection(db, "issues"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIssues(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => {
      showBannerError("שגיאה בטעינת התקלות מהשרת");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  function showBannerError(message) {
    setUiError(message);
    setTimeout(() => setUiError(""), 4000);
  }

  async function handleGenerateSummary() {
    const activeIssues = issues.filter(i => i.status !== "closed");
    if (activeIssues.length === 0) {
      return setAiSummary("אין כרגע תקלות פתוחות או בטיפול בקמפוס. הכל תקין!");
    }
    setSummaryLoading(true);
    try {
      setAiSummary(await summarizeOpenIssues(activeIssues));
    } catch (err) {
      showBannerError(`שגיאה בהפקת סיכום: ${err.message}`);
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleIssueUpdate(issueId, updatedFields) {
    try {
      await updateDoc(doc(db, "issues", issueId), updatedFields);
    } catch {
      showBannerError("שגיאה בעדכון פרטי התקלה, נסה שוב");
    }
  }

  async function confirmDeleteIssue() {
    if (!issueToDelete) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "issues", issueToDelete.id));
    } catch {
      showBannerError("שגיאה במחיקת התקלה מהענן");
    } finally {
      setDeleting(false);
      setIssueToDelete(null);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      navigate("/");
    } catch {
      showBannerError("שגיאה בהתנתקות מהמערכת");
    }
  }

  const isMaintenance = userRole === "maintenance";

  const filteredIssues = issues.filter((issue) => {
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    const matchesUser = isMaintenance || !onlyMyIssues || issue.reporterUid === currentUser?.uid;
    return matchesStatus && matchesUser;
  });

  const filterTabs = [
    { key: "all", label: "הכול", count: issues.length, activeClass: "bg-blue-600 text-white" },
    { key: "open", label: "פתוח", count: issues.filter(i => i.status === "open").length, activeClass: "bg-amber-500 text-white" },
    { key: "in-progress", label: "בטיפול", count: issues.filter(i => i.status === "in-progress").length, activeClass: "bg-blue-500 text-white" },
    { key: "closed", label: "טופל", count: issues.filter(i => i.status === "closed").length, activeClass: "bg-emerald-600 text-white" }
  ];
  // ... (ה-JSX מציג את ההדר, באנר שגיאות, כפתורי פעולה לפי תפקיד, טאבים, רשת כרטיסי IssueCard, ומודאל מחיקה)
}

```

## פרק 3: חוקי אבטחה ב-Firestore (Security Rules)

כללי האבטחה ב-Firestore נאכפים בצד השרת של Google ומגנים על הנתונים גם אם משתמש ינסה לשלוח בקשות ישירות מחוץ לממשק ה-React:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'maintenance';
    }

    match /issues/{issueId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;

      // עדכון סטטוס, דחיפות או קטגוריה מותר רק לצוות אחזקה
      allow update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'maintenance';

      // מחיקה מותרת רק למי שפתח את התקלה או לצוות אחזקה
      allow delete: if request.auth != null && (
        resource.data.reporterUid == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'maintenance'
      );
    }
  }
}

```

## פרק 4: מאגר 38 שאלות הגנה מקיף ותשובות מחץ (עבור בוחני מה"ט)

מאגר מלא ללימוד בנסיעות ולקראת ההגנה — כולל את כל 32 שאלות הבסיס על React, Firebase ואבטחה, יחד עם 6 שאלות עומק על ה-AI, התעדוף ההיברידי, זיהוי הכפילויות והארכיטקטורה המודולרית.

### **ש 1: מדוע בחרתם בארכיטקטורת Serverless / BaaS (Firebase) ולא הקמתם שרת Node.js / Express מסורתי?**

**תשובה מקצועית לבוחן:** ארכיטקטורת BaaS חוסכת תחזוקת שרתים, ניהול תשתיות ואבטחת שרת פיזי. שירותי Firebase מספקים מודול אימות מוצפן (Auth) ומסד נתונים NoSQL בעל סקיילביליות אוטומטית ויכולת האזנה בזמן אמת (WebSockets). עבור מערכת תקלות מוסדית, זהו הפתרון היציב, המהיר והמאובטח ביותר.

### **ש 2: מה תפקידו של קובץ `main.jsx` ומה זה `React.StrictMode`?**

**תשובה מקצועית לבוחן:** קובץ `main.jsx` הוא נקודת הכניסה של האפליקציה, התופס את אלמנט ה-`root` מ-`index.html` ומאתחל עליו את ה-Virtual DOM באמצעות `ReactDOM.createRoot`. מעטפת `React.StrictMode` היא כלי עזר לפיתוח שמריץ בדיקות קפדניות ומפעיל פונקציות מסוימות פעמיים בסביבת פיתוח כדי לאתר תופעות לוואי לא רצויות (Side Effects) וזליגות זיכרון.

### **ש 3: מה ההבדל בין Create React App (CRA) לבין כלי הבנייה Vite שבו השתמשתם?**

**תשובה מקצועית לבוחן:** כלי CRA מיושן ומבוסס על Webpack, שאורז את כל קובצי הפרויקט לקובץ בנדל כבד בכל שינוי קוד. לעומתו, Vite מנצל Native ES Modules של הדפדפן ומנוע הידור מהיר במיוחד (`esbuild` שנכתב ב-Go). השרת המקומי עולה תוך מילישניות, ועדכון הקוד (HMR) מתבצע מיידית באפס השהייה.

### **ש 4: איך עובד מנגנון העיצוב של Tailwind CSS ומה היתרון שלו על CSS רגיל?**

**תשובה מקצועית לבוחן:** ספריית Tailwind CSS פועלת בגישת Utility-First ומספקת מחלקות עיצוב קטנות ומוכנות. היתרונות הבולטים: אין התנגשויות בין שמות מחלקות (No CSS collisions), קובץ העיצוב הסופי קטן במיוחד כי תהליך ה-Build מסיר מחלקות שלא בשימוש (Purging/Tree-shaking), והעיצוב אחיד ורספונסיבי בכל רחבי המערכת.

### **ש 5: מה זה JSX ומדוע הדפדפן אינו מסוגל להריץ אותו ישירות?**

**תשובה מקצועית לבוחן:** תחביר JSX (JavaScript XML) הוא הרחבת תחביר המאפשרת כתיבת תגיות דמויות HTML בתוך קבצי JS/React. דפדפנים אינם מבינים JSX באופן טבעי; כלי הבנייה (Vite באמצעות Babel/esbuild) מתרגם את ה-JSX לקריאות תקניות של `React.createElement()` לפני שהקוד מגיע לדפדפן.

### **ש 6: מהו ה-Virtual DOM ואיך עובד תהליך ה-Reconciliation ב-React?**

**תשובה מקצועית לבוחן:** ה-Virtual DOM הוא ייצוג קל-משקל של ה-DOM האמיתי השמור בזיכרון הדפדפן. כאשר ה-State משתנה, React יוצרת עץ Virtual DOM חדש, משווה אותו לעץ הקודם באמצעות אלגוריתם Diffing מהיר (Reconciliation), ומעדכנת ב-DOM האמיתי אך ורק את הרכיבים שהשתנו בפועל, ללא ציור מחדש של כל העמוד.

### **ש 7: מה ההבדל בין Controlled Component ל-Uncontrolled Component בטפסים?**

**תשובה מקצועית לבוחן:** ברכיב מבוקר (Controlled Component), ערך שדה הקלט נשלט ישירות על ידי ה-State של React דרך `value` ואירוע `onChange` (כפי שמומש בטופס הדיווח שלנו). ברכיב לא מבוקר (Uncontrolled), ה-DOM עצמו מחזיק את הערך והגישה אליו מתבצעת בעזרת `useRef`.

### **ש 8: מדוע חייבים להשתמש ב-`e.preventDefault()` בעת שליחת טופס ב-React?**

**תשובה מקצועית לבוחן:** ברירת המחדל של דפדפן בעת אירוע `submit` של טופס היא לשלוח בקשת HTTP מחדש ולרענן את הדף. פעולה זו הורסת את מצב ה-SPA, מוחקת את ה-State ומנתקת מאזינים. הפקודה `e.preventDefault()` עוצרת את ההתנהגות הטבעית ומאפשרת טיפול אסינכרוני מותאם אישית ב-JavaScript.

### **ש 9: מה ההבדל בין רכיב `<Link>` של React Router לבין תגית `<a href>` רגילה?**

**תשובה מקצועית לבוחן:** תגית `<a>` פונה לשרת ומבצעת רענון מלא של הדף, מה שפוגע בחוויית ה-SPA ומאפס את הזיכרון. רכיב `<Link>` משתמש ב-HTML5 History API (`pushState`) כדי לשנות את הכתובת בסרגל הדפדפן ולהחליף את הרכיב המוצג על המסך באופן מיידי, ללא שום ריענון עמוד.

### **ש 10: מה היתרון של Context API על פני ספריות ניהול מצב חיצוניות כמו Redux בפרויקט זה?**

**תשובה מקצועית לבוחן:** ה-Context API הוא כלי מובנה (Native) בתוך React שאינו דורש התקנת ספריות חיצוניות ומצמצם משמעותית את כמות הקוד (Boilerplate). במערכת FixTrack, נתוני המשתמש וה-Role נדרשים במספר רכיבים בסיסיים, ו-Context API מספק פתרון מושלם, קריא וקל לתחזוקה.

### **ש 11: כיצד פתרתם את בעיית ה-Prop Drilling במערכת?**

**תשובה מקצועית לבוחן:** במקום להעביר ידנית נתונים כמו `currentUser`, `userRole` ופונקציית `logout` דרך שרשרת רכיבים ארוכה (`App` -> `Layout` -> `Navbar` -> `Dashboard`), עטפנו את האפליקציה ב-`AuthProvider`. כל רכיב בעץ יכול לגשת לנתונים ישירות בעזרת ה-Hook הייעודי `useAuth()`.

### **ש 12: מה תפקידה של פונקציית ה-Cleanup בתוך `useEffect`?**

**תשובה מקצועית לבוחן:** פונקציית ה-Cleanup (המוחזרת באמצעות `return () => unsubscribe()`) מופעלת כאשר הרכיב מוסר מהמסך (Unmount). היא סוגרת את המאזינים הפעילים מול שרתי Firebase. ללא סגירה זו, המאזין ימשיך לפעול ברקע, יצרוך זיכרון ויגרום לזליגת זיכרון (Memory Leak) ולשגיאות עדכון State ברכיב שכבר לא קיים.

### **ש 13: מה מונע ממישהו לגשת ישירות לדף `/dashboard` על ידי הקלדת הכתובת בדפדפן?**

**תשובה מקצועית לבוחן:** הנתיב עטוף ברכיב הגנה `ProtectedRoute`. בעת טעינת הנתיב, הרכיב בודק את משתנה `currentUser`. אם המשתמש אינו מחובר, הרכיב חוסם את הרינדור ומפנה מיידית לעמוד ההתחברות.

### **ש 14: מדוע השתמשתם בפרמטר `replace` בתוך `<Navigate to="/" replace />`?**

**תשובה מקצועית לבוחן:** הפרמטר `replace` מחליף את הרשומה הנוכחית בהיסטוריית הגלישה של הדפדפן במקום להוסיף רשומה חדשה. ללא `replace`, אם משתמש לא מחובר ינסה ללחוץ על כפתור 'אחורה' בדפדפן, הוא ייזרק שוב לנתיב החסום ושוב יופנה חזרה, מה שיוצר לולאה תקועה.

### **ש 15: איך המערכת מבדילה בין מדווח (סטודנט) לבין איש אחזקה (RBAC)?**

**תשובה מקצועית לבוחן:** ניהול ההרשאות מבוסס על שילוב בין Authentication ל-Firestore: שירות ה-Auth מנהל את הזיהוי האבטחתי, ובמקביל נשמר מסמך בטבלת `users` עם שדה `role` (`'reporter'` או `'maintenance'`). ה-Dashboard ו-`IssueCard` בודקים שדה זה ומציגים כפתורי ניהול סטטוס, קיטלוג וסיכום AI רק למי שמחזיק בהרשאת אחזקה.

### **ש 16: מדוע בעת הרשמה (Sign Up) פונים גם ל-Authentication וגם ל-Firestore באותו רצף?**

**תשובה מקצועית לבוחן:** שירות Firebase Authentication אחראי אך ורק על תהליך האימות המוצפן (אימייל וסיסמה) ומייצר מזהה אבטחתי ייחודי (UID). הוא אינו מאפשר שמירת שדות עסקיים מותאמים אישית כמו תפקיד (`role`). לכן, מיד לאחר ההרשמה ב-Auth, אנו יוצרים מסמך ייעודי ב-Firestore באוסף `users` עם ה-UID הזה.

### **ש 17: מדוע בחרתם להגדיר כל משתמש שנרשם בתפקיד `'reporter'` כברירת מחדל?**

**תשובה מקצועית לבוחן:** מטעמי אבטחת מידע לפי עקרון 'ההרשאה המינימלית' (Principle of Least Privilege). במערכת ארגונית אסור לאפשר למשתמש רגיל שנרשם לקבוע בעצמו הרשאות ניהול. שדרוג לתפקיד אחזקה נעשה רק על ידי מנהל מערכת ישירות במסד הנתונים.

### **ש 18: מה ההבדל בין `getDocs` לבין `onSnapshot` ב-Cloud Firestore ומתי נשתמש בכל אחד?**

**תשובה מקצועית לבוחן:** פונקציית `getDocs` מבצעת קריאה חד-פעמית (One-time fetch) מול השרת – מתאימה לנתונים סטטיים יחסית כמו שליפת רשימת החדרים בטופס. לעומתה, פונקציית `onSnapshot` פותחת ערוץ WebSocket דו-כיווני המזרים עדכונים אוטומטיים בכל שינוי נתונים – מושלמת ללוח הבקרה כדי לראות תקלות חדשות ושינויי סטטוס בזמן אמת.

### **ש 19: מה ההבדל בין `setDoc` לבין `updateDoc` ב-Firestore?**

**תשובה מקצועית לבוחן:** פונקציית `setDoc` דורסת ומחליפה את כל המסמך (אלא אם הוגדר `{ merge: true }`). לעומתה, `updateDoc` מעדכנת אך ורק את השדות הספציפיים שהועברו לה מבלי לגעת בשאר שדות המסמך. השתמשנו ב-`updateDoc` בעת עדכון סטטוס, דחיפות או קטגוריה כדי לא לפגוע בשדות המדווח, החדר או חותמת הזמן.

### **ש 20: מה ההבדל בין שימוש ב-`setDoc` לבין `addDoc` ב-Cloud Firestore?**

**תשובה מקצועית לבוחן:** ב-`setDoc` עלינו לספק מראש את מזהה המסמך (Document ID) הייעודי, כפי שעשינו ביצירת מסמך משתמש לפי ה-UID של Firebase. ב-`addDoc` המערכת מייצרת בעצמה מזהה אקראי וייחודי אוטומטית, כפי שעשינו ביצירת תקלות חדשות.

### **ש 21: כיצד מבוצעת מחיקת תקלה ב-Firestore (Delete) ומי מורשה לבצע אותה?**

**תשובה מקצועית לבוחן:** מחיקת מסמך מתבצעת באמצעות `deleteDoc(doc(db, 'issues', issueId))`. במקום להשתמש ב-`window.confirm` מיושן של הדפדפן, מימשנו חלונית אישור מעוצבת בתוך האפליקציה (`issueToDelete`). כפתור המחיקה מוצג רק למי שפתח את התקלה (`reporterUid === currentUser.uid`) או לצוות אחזקה.

### **ש 22: כיצד המערכת משלימה מחזור חיים מלא של נתונים (CRUD)?**

**תשובה מקצועית לבוחן:** המערכת מממשת את כל 4 הפעולות: **Create** באמצעות `addDoc` בטופס הדיווח, **Read** באמצעות `onSnapshot` בדשבורד, **Update** באמצעות `updateDoc` לשינוי סטטוס וקיטלוג על ידי צוות האחזקה, ו-**Delete** באמצעות `deleteDoc` למחיקת תקלה.

### **ש 23: מדוע השתמשתם ב-`serverTimestamp()` של Firebase ולא ב-`new Date()` של הדפדפן?**

**תשובה מקצועית לבוחן:** פונקציית `new Date()` לוקחת את השעה משעון המכשיר של המשתמש המקומי (Client-side), שעלול להיות לא מדויק או מושפע מאזורי זמן שונים. שימוש ב-`serverTimestamp()` מבטיח שזמן הדיווח ייקבע ישירות על ידי שרתי גוגל בענן בצורה אמינה ואחידה.

### **ש 24: מדוע שלפתם את רשימת החדרים ממסד הנתונים ולא כתבתם אותם קשיח (Hardcoded)?**

**תשובה מקצועית לבוחן:** כדי לשמור על עקרון ההפרדה והגמישות הניהולית (Data-Driven UI). במוסד לימודי חדרים מתווספים ומשתנים; שמירתם ב-Firestore מאפשרת הוספת חדרים חדשים בענן מבלי לגעת בקוד או להפיץ גרסת תוכנה חדשה.

### **ש 25: האם מערכת הטאבים והסינון בדשבורד פונה מחדש לענן של Firebase בכל לחיצה?**

**תשובה מקצועית לבוחן:** לא. המאזין בזמן אמת (`onSnapshot`) שומר את כל התקלות ב-State המקומי (`issues`). לחיצה על טאב מבצעת סינון מקומי בזיכרון הדפדפן בעזרת פונקציית `filter`. הדבר מבטיח תגובה מיידית באפס מילישניות וחוסך קריאות מיותרות לענן.

### **ש 26: מתי כן היית בוחר לסנן דרך שאילתות Firestore בענן (Server-side)?**

**תשובה מקצועית לבוחן:** כאשר כמות הנתונים גדולה מאוד (אלפי קריאות שירות היסטוריות). בנפח כזה, הורדת כל הנתונים לדפדפן תכביד על הזיכרון וצריכת הרשת. במקרה כזה נשתמש ב-`query` עם `where`, `orderBy` ו-`limit` כדי למשוך רק את הרשומות הרלוונטיות עם דפדוף (Pagination).

### **ש 27: מה ההבדל בין מסד נתונים NoSQL מבוסס מסמכים לבין מסד טבלאי (SQL)?**

**תשובה מקצועית לבוחן:** מסד SQL מארגן נתונים בטבלאות קשיחות עם סכמה מוגדרת מראש וקשרים (Foreign Keys / Joins). מסד NoSQL מבוסס מסמכים (כמו Firestore) שומר נתונים בפורמט גמיש דמוי JSON בתוך Collections, ומציע סקיילביליות אופקית קלה וקצב קריאה/כתיבה גבוה במיוחד.

### **ש 28: איפה נשמר ה-Token של המשתמש בעת התחברות ל-Firebase Auth וכיצד הוא מאובטח?**

**תשובה מקצועית לבוחן:** ה-SDK של Firebase מנהל את ה-Tokens באופן עצמאי ומאחסן אותם בצורה מוצפנת ומאובטחת ב-IndexedDB של הדפדפן. הטוקן כולל מנגנון רענון אוטומטי (Token Refresh) עם תוקף קצר של שעה עבור ה-ID Token, למניעת שימוש לרעה במקרה של גניבה.

### **ש 29: כיצד המערכת מטפלת במצב של ניתוק אינטרנט רגעי (Offline Persistence)?**

**תשובה מקצועית לבוחן:** ל-Cloud Firestore יש מנגנון Offline מובנה בצד הלקוח. נתונים נקראים ונכתבים קודם כל לקאש מקומי בדפדפן. ברגע שהחיבור לרשת מתחדש, ה-SDK של Firebase מסנכרן אוטומטית את כל השינויים מול השרת בענן ללא צורך בהתערבות המשתמש.

### **ש 30: מדוע הפרדתם את הקוד לרכיבים קטנים (Components) ושכבת שירותים (Services)?**

**תשובה מקצועית לבוחן:** עקרון הפרדת הרשויות (Separation of Concerns) ואחריות יחידה (Single Responsibility Principle). העברת התקשורת עם ה-AI לקובץ `aiService.js` ופיצול כרטיס התקלה לקומפוננטת `IssueCard.jsx` הופכים את `Dashboard.jsx` לקצר, קריא, מודולרי וקל לתחזוקה ללא שכפול קוד (DRY).

### **ש 31: מהם Custom Hooks ומתי היית מיישם כזה במערכת?**

**תשובה מקצועית לבוחן:** Custom Hook הוא פונקציית JavaScript שמתחילה במילה `use` ויכולה לקרוא ל-Hooks אחרים של React, במטרה לשתף לוגיקה בין רכיבים ללא שכפול קוד. בפרויקט זה מימשנו את `useAuth()` שמספק גישה מהירה ונקייה ל-`AuthContext` בכל רחבי המערכת.

### **ש 32: מה היית מוסיף למערכת בשלב הפיתוח הבא (Future Roadmap)?**

**תשובה מקצועית לבוחן:** הייתי מוסיף מערכת התראות Push (בעזרת Firebase Cloud Messaging) להודעה על שינוי סטטוס, העלאת תמונות של תקלות ישירות ל-Firebase Storage, ומודול אנליטיקס למנהל אחזקה המציג זמני טיפול ממוצעים וגרפים של התפלגות תקלות לפי קטגוריות.

### **ש 33 (AI): כיצד עובד שילוב הבינה המלאכותית במערכת ומדוע פיצלתם אותו לקובץ `aiService.js`?**

**תשובה מקצועית לבוחן:** המערכת מתחברת ל-Groq Cloud API (מודל `openai/gpt-oss-120b`) דרך קובץ השירות `aiService.js`. קובץ זה מרכז את בניית הפרומפטים, הגבלת אורך הקלט ופרסור תשובות ה-JSON, וכך גם טופס הדיווח (`NewIssueModal`) וגם לוח הבקרה (`Dashboard`) משתמשים בו בלי לערבב לוגיקת רשת בתוך רכיבי התצוגה.

### **ש 34 (AI): מה קורה אם סטודנט ממהר ולוחץ ישר על 'שלח דיווח' מבלי ללחוץ על כפתור האבחון החכם של ה-AI?**

**תשובה מקצועית לבוחן:** מימשנו מנגנון תעדוף היברידי (Hybrid Auto-Priority). אם הסטודנט לא לחץ על כפתור האבחון מראש, הפונקציה `handleSubmit` מריצה אוטומטית קריאת סיווג מהירה ברקע לפני השמירה ב-Firestore. בנוסף, אם שרת ה-AI אינו זמין או שיש תקלת רשת, בלוק `catch` מפעיל גיבוי מקומי (`detectFallbackPriority`) הסורק מילות מפתח קריטיות (`'קצר'`, `'שרוף'`, `'אין מים'`) כך שאף תקלה דחופה לא נותרת ללא סיווג.

### **ש 35 (AI): איך מובטח שמודל ה-AI לא יחזיר ערכים שגויים שישברו את מסד הנתונים או את ממשק המשתמש?**

**תשובה מקצועית לבוחן:** אנו דורשים מהמודל להחזיר אובייקט JSON מובנה בלבד, ולאחר פרסור התשובה בקוד אנו מבצעים אימות (**Whitelist Validation**) מול מערך הקטגוריות המותרות (`ALLOWED_CATEGORIES`) ומול רשימת רמות הדחיפות הקבועות (`'רגילה'`, `'גבוהה'`, `'קריטית'`). אם חוזר ערך לא תקין, המערכת נופלת אוטומטית לערך ברירת מחדל בטוח.

### **ש 36 (AI): כיצד פועלת בדיקת הכפילויות והאם היא יוצרת עומס קריאות מיותר על בסיס הנתונים?**

**תשובה מקצועית לבוחן:** בדיקת הכפילויות מתבצעת בצד הלקוח (Client-Side) עם אפס קריאות נוספות ל-Firestore. ה-Dashboard כבר מאזין בזמן אמת לאוסף התקלות ומעביר את הרשימה ל-`NewIssueModal` דרך Props. בזמן שהמשתמש מקליד כותרת, הקוד משווה מילות מפתח מול תקלות פתוחות באותו חדר ומציג התראה מיידית למניעת פתיחת קריאה כפולה.

### **ש 37 (AI): איך מאובטח מפתח ה-API של Groq מפני חשיפה ב-GitHub ומניצול לרעה?**

**תשובה מקצועית לבוחן:** המפתח שמור במשתנה סביבה (`VITE_GROQ_API_KEY`) בתוך קובץ `.env` מקומי בלבד, ומוחרג ממעקב Git באמצעות `.gitignore`. בנוסף, הגבלנו את אורך הקלט הנשלח למודל (`maxLength` ו-`.slice`) כדי למנוע ניצול לרעה של מכסת הטוקנים (Token Abuse).

### **ש 38 (AI): כיצד משמש ה-AI את צוות האחזקה בלוח הבקרה, ומה שונה בממשק שלהם?**

**תשובה מקצועית לבוחן:** לצוות האחזקה מוצג כפתור **"סיכום מצב חכם (AI)"** הקורא לפונקציה `summarizeOpenIssues` ושולח למודל רשימה תמציתית של הקריאות הפתוחות כדי לקבל המלצת תעדוף מרוכזת לפי חדרים ודחיפות. בנוסף, הוסר מצוות האחזקה מסנן `"רק תקלות שאני דיווחתי"` (שאינו רלוונטי לאדמין), ונוספו לכל כרטיס כלי קיטלוג מלאים לעדכון סטטוס, דחיפות וקטגוריה.

## פרק 5: נוהל יום ההגנה ומדריך הדגמה חיה מול הבוחן (Live Demo)

כדי לקבל את הציון המרבי בהגנת הפרויקט, יש לפעול לפי תרחיש הדגמה מובנה שמבליט את נקודות החוזק של המערכת:

1. **שלב 1: הצגת ארכיטקטורת הפרויקט (דקה ראשונה)**
   פתח את הקוד ב-VS Code, הראה לבוחן את מבנה התיקיות המסודר (`src/components`, `src/context`, `src/pages`, `src/services`) והסבר בקצרה על ארכיטקטורת Serverless, Vite והפרדת שכבת ה-AI ל-`aiService.js`.

2. **שלב 2: הדגמת דיווח חכם, מניעת כפילויות ו-AI (Reporter)**
   היכנס למערכת עם משתמש סטודנט. פתח דיווח בחדר שכבר יש בו תקלה פתוחה והראה את **התראת הכפילות** הקופצת בזמן אמת. לאחר מכן הזן תקלה עם קטגוריה שגויה (למשל `'מקרן לא נדלק'` תחת `'חשמל'`), לחץ על **"אבחון חכם ופתרון עצמי עם AI"**, והראה לבוחן את הטיפים, סיווג הדחיפות וכפתור תיקון הקטגוריה בלחיצה אחת.

3. **שלב 3: ה-Show המרכזי — הדגמת זמן אמת (Real-Time Synchronous)**
   פתח חלון דפדפן רגיל וחלון אנונימי (Incognito) זה לצד זה על המסך. בחלון האנונימי התחבר עם משתמש צוות אחזקה. שלח את התקלה בחלון הסטודנט והראה לבוחן כיצד היא קופצת בחלון האחזקה באפס מילישניות עם תגית הדחיפות שלה ללא שום ריענון עמוד!

4. **שלב 4: הדגמת סיכום מנהלים חכם (AI) וקיטלוג (Update)**
   בחלון צוות האחזקה, לחץ על **"📊 סיכום מצב חכם (AI)"** והראה לבוחן את תמונת המצב המרוכזת. לאחר מכן הדגם שינוי סטטוס, דחיפות וקטגוריה מתוך הכרטיס וראה כיצד השינוי משתקף מיד בחלון הסטודנט.

5. **שלב 5: הדגמת מחיקה מאובטחת (Delete)**
   לחץ על סמל המחיקה והראה לבוחן את **חלונית האישור המעוצבת** בתוך האפליקציה (ללא חלון דפדפן מיושן) ואת הסרת התקלה מ-Firestore בזמן אמת.