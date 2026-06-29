"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { CompanyStatus } from "@prisma/client";

interface Props {
  company: { id: string; status: CompanyStatus };
}

export default function CompanyActions({ company }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAction(action: "APPROVE" | "SUSPEND" | "REJECT") {
    setLoading(true);
    try {
      await fetch(`/api/admin/companies/${company.id}`, {
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
    <div className="flex gap-2 items-center">
      <Link
        href={`/admin/companies/${company.id}`}
        className="text-xs text-blue-600 hover:underline"
      >
        عرض
      </Link>
      {company.status === "PENDING" && (
        <button
          disabled={loading}
          onClick={() => handleAction("APPROVE")}
          className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors disabled:opacity-50"
        >
          موافقة
        </button>
      )}
      {company.status === "ACTIVE" && (
        <button
          disabled={loading}
          onClick={() => handleAction("SUSPEND")}
          className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-1 rounded transition-colors disabled:opacity-50"
        >
          إيقاف
        </button>
      )}
    </div>
  );
}
