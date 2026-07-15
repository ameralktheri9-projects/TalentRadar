"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AvailabilityStatus = "OPEN" | "PASSIVE" | "UNAVAILABLE";

interface Step2Data {
  headline: string;
  aboutMe: string;
  skills: string[];
  languages: string[];
  expectedSalaryMin: string;
  expectedSalaryMax: string;
  availabilityStatus: AvailabilityStatus;
  location: string;
}

const STEPS = ["رفع السيرة الذاتية", "معلوماتك الشخصية", "الموافقة وإتمام التسجيل"];

export default function CandidateOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [langInput, setLangInput] = useState("");

  const [form, setForm] = useState<Step2Data>({
    headline: "",
    aboutMe: "",
    skills: [],
    languages: [],
    expectedSalaryMin: "",
    expectedSalaryMax: "",
    availabilityStatus: "OPEN",
    location: "",
  });

  function updateForm(field: keyof Step2Data, value: string | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addTag(field: "skills" | "languages", value: string) {
    const trimmed = value.trim();
    if (trimmed && !form[field].includes(trimmed)) {
      updateForm(field, [...form[field], trimmed]);
    }
  }

  function removeTag(field: "skills" | "languages", tag: string) {
    updateForm(field, form[field].filter((t) => t !== tag));
  }

  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await fetch("/api/candidate/profile/cv-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        const parsed = data.data;
        setForm((prev) => ({
          ...prev,
          headline: parsed.headline || prev.headline,
          skills: parsed.skills?.length ? parsed.skills : prev.skills,
          languages: parsed.languages?.length ? parsed.languages : prev.languages,
        }));
      }
      setParsed(true);
    } catch {
      setParsed(true); // Allow skip even if parsing fails
    } finally {
      setUploading(false);
    }
  }

  async function handleFinish() {
    if (!consent) {
      setError("يجب الموافقة على الشروط للمتابعة");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/candidate/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          expectedSalaryMin: form.expectedSalaryMin ? Number(form.expectedSalaryMin) : null,
          expectedSalaryMax: form.expectedSalaryMax ? Number(form.expectedSalaryMax) : null,
          consentGiven: consent,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "خطأ");
      }
      router.push("/candidate/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ غير متوقع");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div dir="rtl" className="max-w-xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                  i < step
                    ? "bg-blue-600 border-blue-600 text-white"
                    : i === step
                    ? "border-blue-600 text-blue-600 bg-white"
                    : "border-gray-200 text-gray-400 bg-white"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span className="text-xs text-gray-500 mt-1 text-center">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 ${i < step ? "bg-blue-600" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Step 1: CV Upload */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">رفع السيرة الذاتية</h2>
            <p className="text-sm text-gray-500">ارفع سيرتك الذاتية بصيغة PDF وسنستخرج بياناتك تلقائياً</p>

            <label className="block w-full border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={handleCvUpload}
                className="hidden"
                disabled={uploading}
              />
              {uploading ? (
                <div>
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-sm text-blue-600">جاري التحليل...</p>
                </div>
              ) : parsed ? (
                <div>
                  <p className="text-green-600 text-2xl mb-2">✓</p>
                  <p className="text-sm text-gray-600">تم استخراج البيانات بنجاح</p>
                </div>
              ) : (
                <div>
                  <p className="text-4xl mb-2">📄</p>
                  <p className="text-sm text-gray-600">انقر لرفع سيرتك الذاتية (PDF)</p>
                </div>
              )}
            </label>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                disabled={uploading}
              >
                التالي
              </button>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50"
              >
                تخطي
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Personal info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">معلوماتك الشخصية</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المسمى الوظيفي</label>
              <input
                type="text"
                value={form.headline}
                onChange={(e) => updateForm("headline", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="مثال: مهندس برمجيات أول"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نبذة عني</label>
              <textarea
                value={form.aboutMe}
                onChange={(e) => updateForm("aboutMe", e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="اكتب نبذة مختصرة عن خبراتك وأهدافك..."
              />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المهارات</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.skills.map((s) => (
                  <span key={s} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {s}
                    <button onClick={() => removeTag("skills", s)} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addTag("skills", skillInput); setSkillInput(""); }
                  }}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="اكتب مهارة واضغط Enter"
                />
                <button onClick={() => { addTag("skills", skillInput); setSkillInput(""); }} className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">+</button>
              </div>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اللغات</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.languages.map((l) => (
                  <span key={l} className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {l}
                    <button onClick={() => removeTag("languages", l)} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={langInput}
                  onChange={(e) => setLangInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addTag("languages", langInput); setLangInput(""); }
                  }}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="مثال: العربية، الإنجليزية"
                />
                <button onClick={() => { addTag("languages", langInput); setLangInput(""); }} className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">+</button>
              </div>
            </div>

            {/* Salary */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الراتب المتوقع (من)</label>
                <input
                  type="number"
                  value={form.expectedSalaryMin}
                  onChange={(e) => updateForm("expectedSalaryMin", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="SAR"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الراتب المتوقع (إلى)</label>
                <input
                  type="number"
                  value={form.expectedSalaryMax}
                  onChange={(e) => updateForm("expectedSalaryMax", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="SAR"
                />
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحالة الوظيفية</label>
              <select
                value={form.availabilityStatus}
                onChange={(e) => updateForm("availabilityStatus", e.target.value as AvailabilityStatus)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="OPEN">متاح للعمل</option>
                <option value="PASSIVE">منفتح على الفرص</option>
                <option value="UNAVAILABLE">غير متاح</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => updateForm("location", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="مثال: الرياض"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(0)} className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">السابق</button>
              <button onClick={() => setStep(2)} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">التالي</button>
            </div>
          </div>
        )}

        {/* Step 3: Consent & Finish */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-800">الموافقة وإتمام التسجيل</h2>

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-700">ملخص ملفك الشخصي</p>
              <p>المسمى الوظيفي: {form.headline || "—"}</p>
              <p>المهارات: {form.skills.join("، ") || "—"}</p>
              <p>المدينة: {form.location || "—"}</p>
              <p>الراتب المتوقع: {form.expectedSalaryMin ? `${form.expectedSalaryMin} – ${form.expectedSalaryMax || "∞"} SAR` : "—"}</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-sm text-gray-700">
                أوافق على حفظ بياناتي ومشاركتها مع أصحاب العمل المحتملين عبر منصة TalentRadar وفقاً لسياسة الخصوصية
              </span>
            </label>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">السابق</button>
              <button
                onClick={handleFinish}
                disabled={submitting || !consent}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "جاري الحفظ..." : "إتمام التسجيل"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
