"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InterviewScheduleForm({ candidateId }: { candidateId: string }) {
  const router = useRouter();
  const [interviewType, setInterviewType] = useState("VIDEO");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_submission_id: candidateId,
          interview_type: interviewType,
          scheduled_at: scheduledAt,
        }),
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
        <label className="block text-xs text-gray-600 mb-1">نوع المقابلة</label>
        <select
          value={interviewType}
          onChange={(e) => setInterviewType(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="PHONE">هاتفية</option>
          <option value="VIDEO">مرئية</option>
          <option value="ONSITE">حضورية</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">تاريخ ووقت المقابلة</label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? "جاري الجدولة..." : "جدولة المقابلة"}
      </button>
    </form>
  );
}
