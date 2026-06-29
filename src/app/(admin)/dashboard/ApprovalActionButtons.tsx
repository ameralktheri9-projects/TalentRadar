"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  entityId: string;
  entityType: "company" | "agency";
}

export default function ApprovalActionButtons({ entityId, entityType }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAction(action: "APPROVE" | "REJECT") {
    setLoading(true);
    try {
      await fetch(`/api/admin/${entityType === "company" ? "companies" : "agencies"}/${entityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        disabled={loading}
        onClick={() => handleAction("APPROVE")}
        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        موافقة
      </button>
      <button
        disabled={loading}
        onClick={() => handleAction("REJECT")}
        className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        رفض
      </button>
    </div>
  );
}
