"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CompanyStatus } from "@prisma/client";

interface Props {
  companyId: string;
  status: CompanyStatus;
  adminUserId?: string;
}

export default function CompanyDetailActions({ companyId, status, adminUserId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleImpersonate() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: adminUserId ?? companyId, userType: "COMPANY" }),
      });
      const data = await res.json();
      if (data.redirectUrl) window.open(data.redirectUrl, "_blank");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: "APPROVE" | "SUSPEND" | "REJECT") {
    setLoading(true);
    try {
      await fetch(`/api/admin/companies/${companyId}`, {
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
    <div className="flex gap-3 flex-wrap">
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
      {status === "SUSPENDED" && (
        <button
          disabled={loading}
          onClick={() => handleAction("APPROVE")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          إعادة تفعيل
        </button>
      )}
      {adminUserId && (
        <button
          disabled={loading}
          onClick={handleImpersonate}
          className="border border-purple-300 text-purple-700 hover:bg-purple-50 px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          انتحال الهوية
        </button>
      )}
    </div>
  );
}
