"use client";

import { useEffect, useState } from "react";

interface EscrowTransaction {
  id: string;
  amount: number;
  currency: string;
  heldAt: string | null;
  releasedAt: string | null;
  payoutStatus: string;
  placement: {
    id: string;
    agency: { name_ar: string };
    company: { name_ar: string };
  };
}

export default function AdminFinancePage() {
  const [pending, setPending] = useState<EscrowTransaction[]>([]);
  const [released, setReleased] = useState<EscrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    const [pendingRes, releasedRes] = await Promise.all([
      fetch("/api/escrow?status=PENDING"),
      fetch("/api/escrow?status=INITIATED"),
    ]);
    const pendingData = await pendingRes.json();
    const releasedData = await releasedRes.json();
    setPending(pendingData.data ?? []);
    setReleased(releasedData.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleRelease(id: string) {
    setReleasing(id);
    await fetch(`/api/escrow/${id}/release`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "تم الإفراج بواسطة المشرف" }),
    });
    setReleasing(null);
    fetchData();
  }

  const totalHeld = pending.reduce((s, t) => s + t.amount, 0);

  return (
    <div dir="rtl" className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">المالية والضمان</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-sm text-gray-500 mb-1">إجمالي المحتجز</div>
          <div className="text-2xl font-bold text-amber-600">
            {totalHeld.toLocaleString("ar-SA")} ر.س
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-sm text-gray-500 mb-1">معاملات معلقة</div>
          <div className="text-2xl font-bold text-blue-600">{pending.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-sm text-gray-500 mb-1">تم الإفراج</div>
          <div className="text-2xl font-bold text-green-600">{released.length}</div>
        </div>
      </div>

      {/* Pending escrows */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-700">المعاملات المعلقة</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
        ) : pending.length === 0 ? (
          <div className="p-8 text-center text-gray-400">لا توجد معاملات معلقة</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b">
                <tr>
                  <th className="text-right py-3 px-4">رقم التعيين</th>
                  <th className="text-right py-3 px-4">الوكالة</th>
                  <th className="text-right py-3 px-4">الشركة</th>
                  <th className="text-right py-3 px-4">المبلغ (ر.س)</th>
                  <th className="text-right py-3 px-4">تاريخ الاحتجاز</th>
                  <th className="text-right py-3 px-4">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pending.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">{t.placement.id.substring(0, 8)}...</td>
                    <td className="py-3 px-4">{t.placement.agency.name_ar}</td>
                    <td className="py-3 px-4">{t.placement.company.name_ar}</td>
                    <td className="py-3 px-4 font-semibold">{t.amount.toLocaleString("ar-SA")}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {t.heldAt ? new Date(t.heldAt).toLocaleDateString("ar-SA") : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleRelease(t.id)}
                        disabled={releasing === t.id}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
                      >
                        {releasing === t.id ? "جاري..." : "إفراج"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Released */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-700">الإفراجات الأخيرة</h2>
        </div>
        {released.length === 0 ? (
          <div className="p-8 text-center text-gray-400">لا توجد إفراجات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b">
                <tr>
                  <th className="text-right py-3 px-4">رقم التعيين</th>
                  <th className="text-right py-3 px-4">الوكالة</th>
                  <th className="text-right py-3 px-4">المبلغ (ر.س)</th>
                  <th className="text-right py-3 px-4">تاريخ الإفراج</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {released.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">{t.placement.id.substring(0, 8)}...</td>
                    <td className="py-3 px-4">{t.placement.agency.name_ar}</td>
                    <td className="py-3 px-4 font-semibold">{t.amount.toLocaleString("ar-SA")}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {t.releasedAt ? new Date(t.releasedAt).toLocaleDateString("ar-SA") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
