import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate , Link } from "react-router-dom";

export default function Login() {
  // משתני State לניהול ערכי הטופס
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // משתנים למצב שגיאה ומצב טעינה
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // משיכת פונקציית ה-login מה-Context
  const { login } = useAuth();
  
  // Hook לניווט בין דפים
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault(); // מניעת רענון ברירת המחדל של הדפדפן

    try {
      setError("");
      setIsSubmitting(true);
      
      // ביצוע ההתחברות דרך Firebase
      await login(email, password);
      
      // מעבר אוטומטי לדשבורד לאחר התחברות תקינה
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("שגיאה בהתחברות: כתובת אימייל או סיסמה שגויים");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        
        {/* כותרת המערכת */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-blue-600 mb-1">FixTrack</h1>
          <p className="text-slate-500 text-sm">מערכת לניהול ומעקב ליקויים במכללה</p>
        </div>

        {/* הודעת שגיאה במקרה של כישלון */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4 text-center">
            {error}
          </div>
        )}

        {/* טופס ההתחברות */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              כתובת אימייל
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@college.ac.il"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              סיסמה
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-md transition duration-200 disabled:opacity-50"
          >
            {isSubmitting ? "מתחבר..." : "כניסה למערכת"}
          </button>
        <div className="mt-6 text-center text-sm text-slate-500">
             אין לך חשבון?{" "}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
            הירשם כאן
          </Link>
        </div>
        </form>

      </div>
    </div>
  );
}