"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InterviewFeedbackForm({ interviewId }: { interviewId: string }) {
  const router = useRouter();
  const [outcome, setOutcome] = useState("PASSED");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/interviews/${interviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, feedback }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "خطأ");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div>
        <label className="block text-xs text-gray-600 mb-1">النتيجة</label>
        <select
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="PASSED">اجتاز</option>
          <option value="FAILED">فشل</option>
          <option value="NO_SHOW">لم يحضر</option>
          <option value="CANCELLED">ملغى</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">الملاحظات</label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          placeholder="ملاحظات حول المقابلة..."
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? "جاري الحفظ..." : "تسجيل النتيجة"}
      </button>
    </form>
  );
}
