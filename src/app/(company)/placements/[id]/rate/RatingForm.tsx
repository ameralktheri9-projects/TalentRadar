"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DIMENSIONS = [
  { key: "score_speed", label: "سرعة التوظيف" },
  { key: "score_quality", label: "جودة المرشحين" },
  { key: "score_professionalism", label: "الاحترافية" },
  { key: "score_outcome", label: "النتيجة العامة" },
] as const;

type ScoreKey = (typeof DIMENSIONS)[number]["key"];

export default function RatingForm({ placementId }: { placementId: string }) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    score_speed: 0,
    score_quality: 0,
    score_professionalism: 0,
    score_outcome: 0,
  });
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function setScore(key: ScoreKey, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (Object.values(scores).some((s) => s === 0)) {
      setError("يرجى تقييم جميع المحاور");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placement_id: placementId, ...scores, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "خطأ");
      router.push("/placements");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {DIMENSIONS.map(({ key, label }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setScore(key, star)}
                className={`w-10 h-10 rounded-lg text-lg border transition-colors ${
                  scores[key] >= star
                    ? "bg-yellow-400 border-yellow-400 text-white"
                    : "bg-white border-gray-200 text-gray-300 hover:border-yellow-300"
                }`}
              >
                ★
              </button>
            ))}
            <span className="text-sm text-gray-500 self-center mr-2">
              {scores[key] > 0 ? `${scores[key]}/5` : ""}
            </span>
          </div>
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">تعليق (اختياري)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          placeholder="أضف تعليقاً حول تجربتك مع الوكالة..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg disabled:opacity-50"
      >
        {loading ? "جاري إرسال التقييم..." : "إرسال التقييم"}
      </button>
    </form>
  );
}
