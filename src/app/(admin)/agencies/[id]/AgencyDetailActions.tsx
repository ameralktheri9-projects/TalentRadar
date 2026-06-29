"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AgencyStatus } from "@prisma/client";

interface Props {
  agencyId: string;
  status: AgencyStatus;
}

export default function AgencyDetailActions({ agencyId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAction(action: "APPROVE" | "SUSPEND" | "REJECT") {
    setLoading(true);
    try {
      await fetch(`/api/admin/agencies/${agencyId}`, {
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
    <div className="flex gap-3">
      {status === "PENDING" && (
        <>
          <button
            disabled={loading}
            onClick={() => handleAction("APPROVE")}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            موافقة
          </button>
          <button
            disabled={loading}
            onClick={() => handleAction("REJECT")}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            رفض
          </button>
        </>
      )}
      {status === "ACTIVE" && (
        <button
          disabled={loading}
          onClick={() => handleAction("SUSPEND")}
          className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          إيقاف الحساب
        </button>
      )}
      {(status === "SUSPENDED" || status === "REJECTED") && (
        <button
          disabled={loading}
          onClick={() => handleAction("APPROVE")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          إعادة تفعيل
        </button>
      )}
    </div>
  );
}
