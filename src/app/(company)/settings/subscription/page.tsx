"use client"

import { useEffect, useState } from "react"
import { COMPANY_LIMITS } from "@/lib/subscription-limits"

interface Subscription {
  id: string
  tier: string
  status: string
  currentPeriodEnd: string
  cancelledAt: string | null
}

export default function CompanySubscriptionPage() {
  const [sub, setSub] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState("")

  useEffect(() => {
    fetch("/api/subscriptions/company/current")
      .then((r) => r.json())
      .then((d) => { setSub(d.subscription); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const currentTier = (sub?.tier || "FREE") as keyof typeof COMPANY_LIMITS
  const limits = COMPANY_LIMITS[currentTier]

  const handleUpgrade = async () => {
    if (!selectedTier) return
    setUpgrading(true)
    try {
      const res = await fetch("/api/subscriptions/company/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier }),
      })
      if (res.ok) {
        const data = await res.json()
        setSub(data.subscription)
        setShowModal(false)
      }
    } finally {
      setUpgrading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm("هل أنت متأكد من إلغاء الاشتراك؟")) return
    const res = await fetch("/api/subscriptions/company/cancel", { method: "POST" })
    if (res.ok) {
      const data = await res.json()
      setSub(data.subscription)
    }
  }

  const tierLabels: Record<string, string> = {
    FREE: "مجاني",
    BASIC: "أساسي",
    PRO: "احترافي",
    ENTERPRISE: "مؤسسي",
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64" dir="rtl">
        <p className="text-gray-500">جاري التحميل...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">إدارة الاشتراك</h1>

      {/* Current Plan */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">الخطة الحالية</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            sub?.status === "ACTIVE" ? "bg-green-100 text-green-700" :
            sub?.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
          }`}>
            {sub?.status === "ACTIVE" ? "نشط" : sub?.status === "CANCELLED" ? "ملغى" : "غير نشط"}
          </span>
        </div>

        <div className="text-3xl font-bold text-blue-600 mb-1">{tierLabels[currentTier] || currentTier}</div>

        {sub?.currentPeriodEnd && (
          <p className="text-sm text-gray-500">
            تاريخ التجديد: {new Date(sub.currentPeriodEnd).toLocaleDateString("ar-SA")}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-gray-500 mb-1">طلبات التوظيف الشهرية</div>
            <div className="font-semibold text-gray-800">
              {limits.jobRequestsPerMonth === Infinity ? "غير محدود" : limits.jobRequestsPerMonth}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-gray-500 mb-1">بحث عن المرشحين</div>
            <div className="font-semibold text-gray-800">{limits.candidateSearch ? "متاح" : "غير متاح"}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-gray-500 mb-1">تقدير الراتب بالذكاء الاصطناعي</div>
            <div className="font-semibold text-gray-800">{limits.aiSalary ? "متاح" : "غير متاح"}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-gray-500 mb-1">التحليلات</div>
            <div className="font-semibold text-gray-800">
              {limits.analytics === "none" ? "غير متاحة" : limits.analytics === "basic" ? "أساسية" : "كاملة"}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            ترقية الخطة
          </button>
          {sub && sub.status !== "CANCELLED" && (
            <button
              onClick={handleCancel}
              className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              إلغاء الاشتراك
            </button>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full" dir="rtl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">اختر خطتك</h3>
            <div className="space-y-3 mb-6">
              {(["FREE", "BASIC", "PRO", "ENTERPRISE"] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`w-full text-right px-4 py-3 rounded-lg border-2 transition-colors ${
                    selectedTier === tier ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold text-gray-800">{tierLabels[tier]}</div>
                  <div className="text-sm text-gray-500">
                    {COMPANY_LIMITS[tier].jobRequestsPerMonth === Infinity
                      ? "طلبات غير محدودة"
                      : `${COMPANY_LIMITS[tier].jobRequestsPerMonth} طلبات شهرياً`}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUpgrade}
                disabled={!selectedTier || upgrading}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {upgrading ? "جاري الترقية..." : "تأكيد الترقية"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
