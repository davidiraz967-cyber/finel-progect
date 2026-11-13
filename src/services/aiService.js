const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_NAME = "openai/gpt-oss-120b";

export const ALLOWED_CATEGORIES = [
  "חשמל",
  "מחשוב ומקרנים",
  "מיזוג אוויר",
  "בינוי וריהוט",
  "ניקיון"
];

// פונקציית עזר פנימית לשליחת בקשה ל-Groq
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

// שלב 1: אבחון תקלה חדשה, סיווג קטגוריה, הערכת דחיפות וטיפים לפתרון עצמי
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

// שלב 2: סיכום מנהלים חכם של התקלות הפתוחות בלוח הבקרה
export async function summarizeOpenIssues(openIssues) {
  const compactList = openIssues
    .slice(0, 20)
    .map((i, idx) => `${idx + 1}. חדר: ${i.room} | קטגוריה: ${i.category} | דחיפות: ${i.priority || "רגילה"} | כותרת: ${i.title}`)
    .join("\n");

  const systemPrompt =
    "אתה מנהל אחזקה חכם במכללה בישראל. ענה אך ורק בעברית תקנית, בקצרה וב-3 נקודות ברורות: זהה חדרים עם ריבוי תקלות, הדגש תקלות דחופות/קריטיות, והמלץ על סדר פעולות יעיל לצוות.";

  return await callGroq(systemPrompt, `להלן רשימת התקלות הפתוחות כרגע:\n${compactList}`);
}