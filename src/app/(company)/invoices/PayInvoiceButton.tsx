"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PayInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "خطأ");
      router.refresh();
    } catch {
      alert("حدث خطأ أثناء الدفع");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handlePay}
          disabled={loading}
          className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded disabled:opacity-50"
        >
          {loading ? "جاري الدفع..." : "تأكيد الدفع"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-gray-500 hover:underline"
        >
          إلغاء
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
    >
      دفع الفاتورة
    </button>
  );
}
