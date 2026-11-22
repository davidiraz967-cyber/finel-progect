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
    }, (error) => {
      console.error("שגיאה במשיכת תקלות:", error);
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
    } catch (err) {
      console.error("שגיאה בעדכון התקלה:", err);
      showBannerError("שגיאה בעדכון פרטי התקלה, נסה שוב");
    }
  }

  async function confirmDeleteIssue() {
    if (!issueToDelete) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "issues", issueToDelete.id));
    } catch (err) {
      console.error("שגיאה במחיקת תקלה:", err);
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
    } catch (err) {
      showBannerError("שגיאה בהתנתקות מהמערכת");
    }
  }

  const isMaintenance = userRole === "maintenance";

  // סינון: בדיקת "רק תקלות שלי" רלוונטית אך ורק למדווחים (reporters)
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

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-blue-600 tracking-tight">FixTrack</h1>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium border border-slate-200">
              {isMaintenance ? "צוות אחזקה 🛠️" : "מדווח / סטודנט 📋"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 hidden sm:inline">
              שלום, <strong className="text-slate-800">{currentUser?.email}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 px-3 py-1.5 rounded-lg border border-slate-300 transition"
            >
              התנתק
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {uiError && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between text-sm shadow-sm">
            <span className="font-medium">⚠️ {uiError}</span>
            <button onClick={() => setUiError("")} className="text-red-400 hover:text-red-700 font-bold px-2">✕</button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">לוח דיווחי תקלות</h2>
            <p className="text-sm text-slate-500">
              {isMaintenance
                ? "ניהול, קיטלוג, תעדוף ועדכון סטטוס קריאות שירות ברחבי הקמפוס"
                : "צפייה במצב התקלות שדווחו ומעקב אחר הטיפול בהן"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isMaintenance ? (
              <button
                onClick={handleGenerateSummary}
                disabled={summaryLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
              >
                {summaryLoading ? "⏳ מנתח נתונים..." : "📊 סיכום מצב חכם (AI)"}
              </button>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2"
              >
                <span className="text-lg">+</span> דיווח על תקלה חדשה
              </button>
            )}
          </div>
        </div>

        {aiSummary && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-indigo-900 text-sm">🤖 תמונת מצב ותעדוף אחזקה (AI):</span>
              <button onClick={() => setAiSummary("")} className="text-xs text-indigo-500 hover:text-indigo-800 font-medium">
                סגור ✕
              </button>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{aiSummary}</p>
          </div>
        )}

        {/* סרגל טאבים וסינון */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  statusFilter === tab.key ? `${tab.activeClass} shadow-sm` : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* מוצג רק עבור סטודנטים/מדווחים — לא רלוונטי לצוות אחזקה */}
          {!isMaintenance && (
            <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyMyIssues}
                onChange={(e) => setOnlyMyIssues(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              הצג רק תקלות שאני דיווחתי
            </label>
          )}
        </div>

        {/* רשימת הכרטיסים או שלד טעינה (Skeleton) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-pulse space-y-3">
                <div className="flex justify-between">
                  <div className="h-5 w-24 bg-slate-200 rounded-md"></div>
                  <div className="h-5 w-16 bg-slate-200 rounded-full"></div>
                </div>
                <div className="h-6 w-3/4 bg-slate-200 rounded-md"></div>
                <div className="h-4 w-1/3 bg-slate-100 rounded-md"></div>
                <div className="h-12 w-full bg-slate-100 rounded-md"></div>
              </div>
            ))}
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
            <p className="text-lg font-semibold text-slate-700 mb-1">לא נמצאו תקלות התואמות לסינון</p>
            <p className="text-sm text-slate-400">נסה לשנות את הטאב הנבחר או להסיר את תיבת הסינון האישי.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                userRole={userRole}
                currentUid={currentUser?.uid}
                onUpdate={handleIssueUpdate}
                onDeleteClick={setIssueToDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* חלונית אישור מחיקה מעוצבת */}
      {issueToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl text-right" dir="rtl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">מחיקת תקלה</h3>
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              האם אתה בטוח שברצונך למחוק לצמיתות את התקלה{" "}
              <strong className="text-slate-800">"{issueToDelete.title}"</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setIssueToDelete(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition"
              >
                ביטול
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteIssue}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {deleting ? "מוחק..." : "מחק לצמיתות"}
              </button>
            </div>
          </div>
        </div>
      )}

      <NewIssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        existingIssues={issues}
      />
    </div>
  );
}