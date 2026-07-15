"use client"

import { useEffect, useState } from "react"

interface Company {
  id: string
  name_en: string
  name_ar: string
  cr_number: string
  industry_sector: string
  city: string
  created_at: string
}

interface Agency {
  id: string
  name_en: string
  name_ar: string
  hrsd_licence: string
  created_at: string
}

export default function VerificationQueuePage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchQueue = async () => {
    const res = await fetch("/api/admin/verification-queue")
    if (res.ok) {
      const data = await res.json()
      setCompanies(data.companies)
      setAgencies(data.agencies)
    }
    setLoading(false)
  }

  useEffect(() => { fetchQueue() }, [])

  const handleAction = async (id: string, type: "COMPANY" | "AGENCY", action: "approve" | "reject") => {
    setProcessing(`${id}-${action}`)
    const reason = action === "reject" ? prompt("سبب الرفض:") || "" : ""
    try {
      await fetch(`/api/admin/verification-queue/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, reason }),
      })
      await fetchQueue()
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64" dir="rtl">
        <p className="text-gray-500">جاري التحميل...</p>
      </div>
    )
  }

  const total = companies.length + agencies.length

  return (
    <div className="max-w-5xl mx-auto p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">طابور التحقق</h1>
        <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
          {total} في الانتظار
        </span>
      </div>

      {/* Companies */}
      {companies.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">الشركات ({companies.length})</h2>
          <div className="space-y-3">
            {companies.map((company) => (
              <div key={company.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{company.name_ar}</div>
                    <div className="text-sm text-gray-500" dir="ltr">{company.name_en}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      السجل التجاري: <span dir="ltr">{company.cr_number}</span> · {company.industry_sector} · {company.city}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(company.created_at).toLocaleDateString("ar-SA")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(company.id, "COMPANY", "approve")}
                      disabled={processing === `${company.id}-approve`}
                      className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      موافقة
                    </button>
                    <button
                      onClick={() => handleAction(company.id, "COMPANY", "reject")}
                      disabled={processing === `${company.id}-reject`}
                      className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      رفض
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Agencies */}
      {agencies.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">الوكالات ({agencies.length})</h2>
          <div className="space-y-3">
            {agencies.map((agency) => (
              <div key={agency.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{agency.name_ar}</div>
                    <div className="text-sm text-gray-500" dir="ltr">{agency.name_en}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      ترخيص HRSD: <span dir="ltr">{agency.hrsd_licence}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(agency.created_at).toLocaleDateString("ar-SA")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(agency.id, "AGENCY", "approve")}
                      disabled={processing === `${agency.id}-approve`}
                      className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      موافقة
                    </button>
                    <button
                      onClick={() => handleAction(agency.id, "AGENCY", "reject")}
                      disabled={processing === `${agency.id}-reject`}
                      className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      رفض
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {total === 0 && (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">✅</div>
          <p>لا توجد طلبات معلقة</p>
        </div>
      )}
    </div>
  )
}
