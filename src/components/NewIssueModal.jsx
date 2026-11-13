import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { ALLOWED_CATEGORIES, analyzeNewIssue } from "../services/aiService";

// גיבוי מקומי מהיר לקביעת דחיפות אם שרת ה-AI לא זמין בעת השליחה
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

  // בדיקת כפילות חכמה בזמן אמת מול תקלות פתוחות באותו חדר
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
    if (!title.trim() || !description.trim()) {
      return setError("יש למלא את כל השדות");
    }

    try {
      setError("");
      setLoading(true);

      // 1. אם המשתמש כבר הפעיל את ה-AI מראש - ניקח את הדחיפות שחזרה
      let finalPriority = aiResult?.suggestedPriority;

      // 2. אם לא הופעל מראש - נבצע סיווג אוטומטי מהיר ברקע (עם גיבוי מקומי)
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
      console.error("שגיאה ביצירת תקלה:", err);
      setError("שגיאה בשמירת התקלה, נסה שוב");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800">דיווח על תקלה חדשה</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {duplicateIssue && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900">
            <p className="font-bold mb-1">⚠️ שים לב: כבר קיימת קריאה פעילה בחדר זה!</p>
            <p>
              נושא: <strong>"{duplicateIssue.title}"</strong> (סטטוס: {duplicateIssue.status === "open" ? "פתוח" : "בטיפול"}).
              אם זו אותה תקלה, אין צורך לפתוח קריאה כפולה.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">כותרת התקלה</label>
            <input
              type="text"
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="לדוגמה: מקרן לא נדלק"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">קטגוריה</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                {ALLOWED_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">מיקום (חדר)</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.name}>
                    {room.name} ({room.building})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">תיאור מפורט</label>
            <textarea
              rows="3"
              maxLength={400}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="פרט את הבעיה בצורה ברורה..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            ></textarea>
          </div>

          <button
            type="button"
            onClick={handleAskAi}
            disabled={aiLoading}
            className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-xl border border-indigo-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {aiLoading ? "⏳ מנתח את התקלה..." : "💡 אבחון חכם ופתרון עצמי עם AI"}
          </button>

          {aiResult && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-indigo-900 font-bold text-sm">🤖 תוצאת אבחון AI:</span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  aiResult.suggestedPriority === "קריטית"
                    ? "bg-red-100 text-red-700"
                    : aiResult.suggestedPriority === "גבוהה"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-200 text-slate-700"
                }`}>
                  דחיפות מוערכת: {aiResult.suggestedPriority}
                </span>
              </div>

              {(aiResult.hasMismatch || aiResult.suggestedCategory !== category) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-2">
                  <p className="font-medium">
                    ⚠️ {aiResult.mismatchNote || `התקלה מתאימה יותר לקטגוריית "${aiResult.suggestedCategory}".`}
                  </p>
                  {aiResult.suggestedCategory !== category && (
                    <button
                      type="button"
                      onClick={() => setCategory(aiResult.suggestedCategory)}
                      className="py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-md transition"
                    >
                      🔄 שנה קטגוריה אוטומטית ל-"{aiResult.suggestedCategory}"
                    </button>
                  )}
                </div>
              )}

              {aiResult.tips && (
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{aiResult.tips}</p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-100">
                <button
                  type="button"
                  onClick={() => {
                    setTitle("");
                    setDescription("");
                    setAiResult(null);
                    onClose();
                  }}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                >
                  ✅ זה עזר! הסתדרתי
                </button>
                <button
                  type="button"
                  onClick={() => setAiResult(null)}
                  className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-lg transition"
                >
                  לא עזר, המשך לפתיחת קריאה
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {loading ? "שומר..." : "שלח דיווח"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}