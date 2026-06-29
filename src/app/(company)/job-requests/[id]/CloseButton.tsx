"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CloseButtonProps {
  jobRequestId: string;
}

export default function CloseButton({ jobRequestId }: CloseButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClose = async () => {
    if (!confirm("هل أنت متأكد من إغلاق هذا الطلب؟")) return;
    setLoading(true);
    try {
      await fetch(`/api/job-requests/${jobRequestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClose}
      disabled={loading}
      className="bg-orange-100 hover:bg-orange-200 text-orange-800 font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
    >
      {loading ? "جاري الإغلاق..." : "إغلاق الطلب"}
    </button>
  );
}
