"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  candidateId: string;
  status: string;
}

export default function CandidateActions({ candidateId, status }: Props) {
  const router = useRouter();

  async function updateStatus(newStatus: string) {
    await fetch(`/api/candidates/${candidateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }

  return (
    <div className="flex gap-2 items-center">
      <Link
        href={`/candidates/${candidateId}`}
        className="text-xs text-blue-600 hover:underline"
      >
        عرض
      </Link>
      {["SUBMITTED", "VIEWED"].includes(status) && (
        <button
          onClick={() => updateStatus("SHORTLISTED")}
          className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded"
        >
          اختصار
        </button>
      )}
      {status !== "REJECTED" && status !== "HIRED" && (
        <button
          onClick={() => updateStatus("REJECTED")}
          className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
        >
          رفض
        </button>
      )}
    </div>
  );
}
