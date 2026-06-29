"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProposalActionsProps {
  proposalId: string;
  currentStatus: string;
}

export default function ProposalActions({ proposalId, currentStatus }: ProposalActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (status: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "حدث خطأ");
        return;
      }
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus === "ACCEPTED" || currentStatus === "REJECTED" || currentStatus === "WITHDRAWN") {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <div className="flex gap-1">
        {currentStatus !== "SHORTLISTED" && (
          <button
            onClick={() => updateStatus("SHORTLISTED")}
            disabled={loading}
            className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded transition-colors disabled:opacity-50"
          >
            إدراج
          </button>
        )}
        <button
          onClick={() => updateStatus("ACCEPTED")}
          disabled={loading}
          className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded transition-colors disabled:opacity-50"
        >
          قبول
        </button>
        <button
          onClick={() => updateStatus("REJECTED")}
          disabled={loading}
          className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded transition-colors disabled:opacity-50"
        >
          رفض
        </button>
      </div>
    </div>
  );
}
