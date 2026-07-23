"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";

const SECTOR_OPTIONS = [
  { value: "TECHNOLOGY", label: "تقنية المعلومات" },
  { value: "HEALTHCARE", label: "الرعاية الصحية" },
  { value: "FINANCE", label: "المالية" },
  { value: "EDUCATION", label: "التعليم" },
  { value: "RETAIL", label: "التجزئة" },
  { value: "MANUFACTURING", label: "التصنيع" },
  { value: "CONSTRUCTION", label: "البناء والتشييد" },
  { value: "ENERGY", label: "الطاقة" },
  { value: "LOGISTICS", label: "اللوجستيات" },
  { value: "HOSPITALITY", label: "الضيافة" },
  { value: "MEDIA", label: "الإعلام" },
  { value: "GOVERNMENT", label: "الحكومة" },
  { value: "OTHER", label: "أخرى" },
];

interface SalarySuggestion {
  min: number;
  max: number;
  currency: string;
  source: string;
}

export default function NewJobRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<SalarySuggestion | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    sector: "",
    experience_level: "MID",
    salary_min: "",
    salary_max: "",
    saudi_national_required: false,
    headcount: "1",
    sla_days: "30",
    budget_type: "PERCENTAGE_OF_SALARY",
    budget_value: "",
    proposal_deadline: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value =
      e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const validate = (forPublish: boolean): string | null => {
    if (Number(form.salary_min) >= Number(form.salary_max)) {
      return "يجب أن يكون الراتب الأدنى أقل من الراتب الأقصى";
    }
    if (forPublish) {
      if (!form.proposal_deadline) return "يجب تحديد الموعد النهائي للعروض";
      const deadline = new Date(form.proposal_deadline);
      const minDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
      if (deadline < minDeadline) {
        return "يجب أن يكون الموعد النهائي للعروض بعد 24 ساعة على الأقل من الآن";
      }
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validate(false);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/job-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          salary_min: parseInt(form.salary_min),
          salary_max: parseInt(form.salary_max),
          headcount: parseInt(form.headcount),
          sla_days: parseInt(form.sla_days),
          budget_value: parseFloat(form.budget_value),
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "حدث خطأ أثناء الحفظ");
        return;
      }
      router.push("/job-requests");
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const handleAiSalarySuggestion = async () => {
    if (!form.title || !form.sector || !form.experience_level) {
      setAiError("يرجى تعبئة المسمى الوظيفي والقطاع ومستوى الخبرة أولاً");
      return;
    }
    setAiError(null);
    setAiSuggestion(null);
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/salary-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: form.title, sector: form.sector, seniority: form.experience_level }),
      });
      const data = await res.json() as SalarySuggestion & { error?: string };
      if (!res.ok) {
        setAiError(data.error ?? "حدث خطأ أثناء جلب الاقتراح");
        return;
      }
      setAiSuggestion(data);
    } catch {
      setAiError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setForm((prev) => ({
      ...prev,
      salary_min: String(aiSuggestion.min),
      salary_max: String(aiSuggestion.max),
    }));
    setAiSuggestion(null);
  };

  const handlePublish = async () => {
    const validationError = validate(true);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Create first
      const createRes = await fetch("/api/job-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          salary_min: parseInt(form.salary_min),
          salary_max: parseInt(form.salary_max),
          headcount: parseInt(form.headcount),
          sla_days: parseInt(form.sla_days),
          budget_value: parseFloat(form.budget_value),
        }),
      });
      const createData = await createRes.json() as { data?: { id: string }; error?: string };
      if (!createRes.ok) {
        setError(createData.error ?? "حدث خطأ أثناء إنشاء الطلب");
        return;
      }

      const id = createData.data?.id;
      if (!id) {
        setError("لم يتم الحصول على معرف الطلب");
        return;
      }

      // Then publish
      const publishRes = await fetch(`/api/job-requests/${id}/publish`, {
        method: "POST",
      });
      const publishData = await publishRes.json() as { error?: string };
      if (!publishRes.ok) {
        setError(publishData.error ?? "حدث خطأ أثناء نشر الطلب");
        return;
      }

      router.push("/job-requests");
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header title="إنشاء طلب توظيف جديد" subtitle="أدخل تفاصيل الوظيفة المطلوبة" />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl" dir="rtl">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المسمى الوظيفي *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">وصف الوظيفة *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">القطاع *</label>
                <select
                  name="sector"
                  value={form.sector}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="">اختر القطاع</option>
                  {SECTOR_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مستوى الخبرة *</label>
                <select
                  name="experience_level"
                  value={form.experience_level}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="JUNIOR">مبتدئ</option>
                  <option value="MID">متوسط</option>
                  <option value="SENIOR">خبير</option>
                  <option value="DIRECTOR">مدير</option>
                  <option value="C_SUITE">تنفيذي</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الراتب الأدنى (ر.س) *</label>
                <input
                  name="salary_min"
                  value={form.salary_min}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الراتب الأقصى (ر.س) *</label>
                <input
                  name="salary_max"
                  value={form.salary_max}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* AI Salary Suggestion */}
            <div className="border border-blue-100 bg-blue-50 rounded-lg p-4 space-y-3">
              <button
                type="button"
                onClick={handleAiSalarySuggestion}
                disabled={aiLoading}
                className="flex items-center gap-2 bg-white border border-blue-300 text-blue-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {aiLoading ? "جاري التحليل..." : "اقتراح الراتب بالذكاء الاصطناعي 🤖"}
              </button>
              {aiError && (
                <p className="text-xs text-red-600">{aiError}</p>
              )}
              {aiSuggestion && (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-700">
                    <span className="font-semibold">الاقتراح:</span>{" "}
                    {aiSuggestion.min.toLocaleString()} – {aiSuggestion.max.toLocaleString()} {aiSuggestion.currency}
                    {aiSuggestion.source === "estimate" && (
                      <span className="text-gray-400 text-xs mr-1">(تقدير)</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={applyAiSuggestion}
                    className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    تطبيق هذا الاقتراح
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عدد الموظفين المطلوب</label>
                <input
                  name="headcount"
                  value={form.headcount}
                  onChange={handleChange}
                  type="number"
                  min="1"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مدة SLA (أيام)</label>
                <input
                  name="sla_days"
                  value={form.sla_days}
                  onChange={handleChange}
                  type="number"
                  min="1"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع الميزانية *</label>
                <select
                  name="budget_type"
                  value={form.budget_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="PERCENTAGE_OF_SALARY">نسبة من الراتب</option>
                  <option value="FLAT_FEE">مبلغ ثابت</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  قيمة الميزانية {form.budget_type === "PERCENTAGE_OF_SALARY" ? "(%)" : "(ر.س)"} *
                </label>
                <input
                  name="budget_value"
                  value={form.budget_value}
                  onChange={handleChange}
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الموعد النهائي للعروض</label>
              <input
                name="proposal_deadline"
                value={form.proposal_deadline}
                onChange={handleChange}
                type="datetime-local"
                dir="ltr"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                name="saudi_national_required"
                type="checkbox"
                checked={form.saudi_national_required}
                onChange={handleChange}
                className="rounded"
                id="saudi_required"
              />
              <label htmlFor="saudi_required" className="text-sm text-gray-700">
                يشترط أن يكون المرشح سعودي الجنسية
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? "جاري الحفظ..." : "حفظ كمسودة"}
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? "جاري النشر..." : "نشر الطلب"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
