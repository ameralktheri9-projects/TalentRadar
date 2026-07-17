"use client";

import { useState } from "react";
import Link from "next/link";

interface CandidateResult {
  id: string;
  headline: string | null;
  skills: string[];
  profileScore: number;
  expectedSalaryMin: number | null;
  expectedSalaryMax: number | null;
  availabilityStatus: string;
  location: string | null;
  experiences: { title: string; company: string; isCurrent: boolean }[];
}

const AVAILABILITY_LABELS: Record<string, string> = {
  OPEN: "متاح",
  PASSIVE: "منفتح على الفرص",
  UNAVAILABLE: "غير متاح",
};

const AVAILABILITY_COLORS: Record<string, string> = {
  OPEN: "bg-green-100 text-green-700",
  PASSIVE: "bg-yellow-100 text-yellow-700",
  UNAVAILABLE: "bg-gray-100 text-gray-500",
};

export default function CandidateSearchPage() {
  const [filters, setFilters] = useState({
    skills: "",
    minExperience: "",
    maxExpectedSalary: "",
    availability: "",
  });
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    setUpgradeRequired(false);

    const params = new URLSearchParams();
    if (filters.skills) params.set("skills", filters.skills);
    if (filters.minExperience) params.set("minExperience", filters.minExperience);
    if (filters.maxExpectedSalary) params.set("maxExpectedSalary", filters.maxExpectedSalary);
    if (filters.availability) params.set("availability", filters.availability);

    const res = await fetch(`/api/company/candidates/search?${params.toString()}`);
    if (res.status === 402) {
      setUpgradeRequired(true);
      setLoading(false);
      return;
    }

    const data = await res.json();
    setResults(data.profiles ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }

  return (
    <div dir="rtl" className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">بحث المرشحين</h1>
        <p className="text-gray-500 text-sm mt-1">ابحث في قاعدة بيانات المرشحين المتاحين</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">المهارات</label>
            <input
              type="text"
              value={filters.skills}
              onChange={(e) => setFilters((f) => ({ ...f, skills: e.target.value }))}
              placeholder="React, Python, ..."
              dir="ltr"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              الحد الأدنى من الخبرة (سنوات)
            </label>
            <input
              type="number"
              min={0}
              value={filters.minExperience}
              onChange={(e) => setFilters((f) => ({ ...f, minExperience: e.target.value }))}
              placeholder="0"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              الحد الأقصى للراتب المتوقع
            </label>
            <input
              type="number"
              min={0}
              value={filters.maxExpectedSalary}
              onChange={(e) => setFilters((f) => ({ ...f, maxExpectedSalary: e.target.value }))}
              placeholder="50000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">التوفر</label>
            <select
              value={filters.availability}
              onChange={(e) => setFilters((f) => ({ ...f, availability: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">الكل</option>
              <option value="OPEN">متاح</option>
              <option value="PASSIVE">منفتح على الفرص</option>
              <option value="UNAVAILABLE">غير متاح</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? "جاري البحث..." : "بحث"}
          </button>
        </div>
      </form>

      {/* Upgrade prompt */}
      {upgradeRequired && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <p className="text-amber-800 font-semibold text-lg mb-2">
            هذه الميزة متاحة لخطط PRO وما فوق
          </p>
          <p className="text-amber-600 text-sm mb-4">
            قم بالترقية للوصول إلى قاعدة بيانات المرشحين
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
          >
            عرض خطط الاشتراك
          </Link>
        </div>
      )}

      {/* Results */}
      {searched && !upgradeRequired && !loading && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            {total > 0 ? `تم العثور على ${total} مرشح` : "لا توجد نتائج"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((candidate) => (
              <div
                key={candidate.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {candidate.headline ?? "مرشح"}
                    </p>
                    {candidate.experiences[0] && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {candidate.experiences[0].title} · {candidate.experiences[0].company}
                      </p>
                    )}
                    {candidate.location && (
                      <p className="text-xs text-gray-400 mt-0.5">{candidate.location}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      AVAILABILITY_COLORS[candidate.availabilityStatus] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {AVAILABILITY_LABELS[candidate.availabilityStatus] ?? candidate.availabilityStatus}
                  </span>
                </div>

                {/* Profile score */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${candidate.profileScore}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{candidate.profileScore}%</span>
                </div>

                {/* Skills */}
                {candidate.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {candidate.skills.slice(0, 4).map((s) => (
                      <span key={s} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                    {candidate.skills.length > 4 && (
                      <span className="text-gray-400 text-xs">+{candidate.skills.length - 4}</span>
                    )}
                  </div>
                )}

                {/* Salary */}
                {candidate.expectedSalaryMin && (
                  <p className="text-xs text-gray-500">
                    الراتب المتوقع:{" "}
                    {candidate.expectedSalaryMin.toLocaleString("ar-SA")}
                    {candidate.expectedSalaryMax
                      ? ` – ${candidate.expectedSalaryMax.toLocaleString("ar-SA")}`
                      : ""}
                    {" "}ر.س
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
