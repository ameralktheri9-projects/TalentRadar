"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface WithdrawButtonProps {
  proposalId: string;
}

export default function WithdrawButton({ proposalId }: WithdrawButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWithdraw = async () => {
    if (!confirm("هل أنت متأكد من سحب هذا العرض؟")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "WITHDRAWN" }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "حدث خطأ أثناء سحب العرض");
        return;
      }
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <button
        onClick={handleWithdraw}
        disabled={loading}
        className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
      >
        {loading ? "جاري السحب..." : "سحب العرض"}
      </button>
    </div>
  );
}
