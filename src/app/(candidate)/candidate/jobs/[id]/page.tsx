"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface JobRequest {
  id: string;
  title: string;
  description: string;
  sector: string;
  experience_level: string;
  salary_min: number;
  salary_max: number;
  saudi_national_required: boolean;
  headcount: number;
  sla_days: number;
  proposal_deadline?: string;
}

const EXPERIENCE_LABELS: Record<string, string> = {
  JUNIOR: "مبتدئ",
  MID: "متوسط",
  SENIOR: "أول",
  DIRECTOR: "مدير",
  C_SUITE: "تنفيذي",
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/candidate/jobs/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setJob(d.data);
        if (d.alreadyApplied) setApplied(true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleApply() {
    setApplying(true);
    setError("");
    try {
      const res = await fetch(`/api/candidate/jobs/${id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "خطأ");
      setApplied(true);
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ غير متوقع");
    } finally {
      setApplying(false);
    }
  }

  if (loading) return <div dir="rtl" className="text-center py-20 text-gray-400">جاري التحميل...</div>;
  if (!job) return <div dir="rtl" className="text-center py-20 text-gray-400">الوظيفة غير موجودة</div>;

  return (
    <div dir="rtl" className="max-w-2xl mx-auto space-y-5">
      <a href="/candidate/jobs" className="text-sm text-blue-600 hover:underline">← العودة للوظائف</a>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">{job.title}</h1>

        <div className="flex flex-wrap gap-2">
          <span className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">{job.sector}</span>
          <span className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
            {EXPERIENCE_LABELS[job.experience_level] ?? job.experience_level}
          </span>
          {job.saudi_national_required && (
            <span className="bg-green-50 text-green-700 text-sm px-3 py-1 rounded-full">سعودي الجنسية</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium text-gray-700">الراتب: </span>
            {job.salary_min?.toLocaleString()} – {job.salary_max?.toLocaleString()} SAR
          </div>
          <div>
            <span className="font-medium text-gray-700">عدد الشواغر: </span>
            {job.headcount}
          </div>
          {job.proposal_deadline && (
            <div>
              <span className="font-medium text-gray-700">آخر موعد: </span>
              {new Date(job.proposal_deadline).toLocaleDateString("ar-SA")}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold text-gray-700 mb-2">وصف الوظيفة</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{job.description}</p>
        </div>

        {applied ? (
          <div className="bg-green-50 text-green-700 rounded-lg px-4 py-3 text-sm font-medium">
            ✓ تم تقديم طلبك بنجاح
          </div>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            تقديم الآن
          </button>
        )}
      </div>

      {/* Apply Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4" dir="rtl">
            <h2 className="font-bold text-gray-800 text-lg">تقديم على الوظيفة</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                رسالة التقديم (اختياري — حد أقصى 500 حرف)
              </label>
              <textarea
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value.slice(0, 500))}
                rows={5}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="أخبر صاحب العمل لماذا أنت المرشح المناسب..."
              />
              <p className="text-xs text-gray-400 text-left mt-1">{coverNote.length}/500</p>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm">إلغاء</button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-50 hover:bg-blue-700"
              >
                {applying ? "جاري التقديم..." : "تأكيد التقديم"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
