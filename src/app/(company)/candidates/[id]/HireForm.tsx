"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HireForm({ candidateId }: { candidateId: string }) {
  const router = useRouter();
  const [offerAmount, setOfferAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_submission_id: candidateId,
          offer_amount: Number(offerAmount),
          start_date: startDate,
        }),
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
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div>
        <label className="block text-xs text-gray-600 mb-1">مبلغ العرض (ر.س)</label>
        <input
          type="number"
          value={offerAmount}
          onChange={(e) => setOfferAmount(e.target.value)}
          required
          min={1}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          placeholder="مثال: 15000"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">تاريخ بدء العمل</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? "جاري التسجيل..." : "تسجيل التوظيف"}
      </button>
    </form>
  );
}
