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
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
              {issue.category}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-md border ${priorityInfo.style}`}>
              {priorityInfo.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`border text-xs px-2.5 py-1 rounded-full font-semibold ${statusInfo.style}`}>
              {statusInfo.label}
            </span>
            {canDelete && (
              <button
                onClick={() => onDeleteClick(issue)}
                title="מחק תקלה"
                className="text-slate-300 hover:text-red-500 transition p-1 rounded-md"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-1">{issue.title}</h3>

        <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium mb-3">
          <span>📍</span>
          <span>{issue.room}</span>
        </div>

        <p className="text-sm text-slate-600 mb-4 whitespace-pre-wrap line-clamp-3">
          {issue.description}
        </p>
      </div>

      <div className="border-t border-slate-100 pt-3 mt-2">
        <div className="text-[11px] text-slate-400 mb-3">דווח ע״י: {issue.reportedBy}</div>

        {isMaintenance ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-medium text-slate-600">סטטוס:</label>
              <select
                value={issue.status}
                onChange={(e) => onUpdate(issue.id, { status: e.target.value })}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
              >
                <option value="open">פתוח</option>
                <option value="in-progress">בטיפול</option>
                <option value="closed">טופל ונסגר</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">דחיפות:</label>
                <select
                  value={issue.priority || "רגילה"}
                  onChange={(e) => onUpdate(issue.id, { priority: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                >
                  <option value="רגילה">רגילה</option>
                  <option value="גבוהה">גבוהה</option>
                  <option value="קריטית">קריטית</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">קטגוריה:</label>
                <select
                  value={issue.category}
                  onChange={(e) => onUpdate(issue.id, { category: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                >
                  {ALLOWED_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
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