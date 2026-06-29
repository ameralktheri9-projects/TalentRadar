"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";

export default function NewJobRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    sector: "",
    experience_level: "MID",
    salary_min: "",
    salary_max: "",
    saudi_national_required: false,
    headcount: "1",
    sla_days: "30",
    budget_type: "PERCENTAGE_OF_SALARY",
    budget_value: "",
    proposal_deadline: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/job-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          salary_min: parseInt(form.salary_min),
          salary_max: parseInt(form.salary_max),
          headcount: parseInt(form.headcount),
          sla_days: parseInt(form.sla_days),
          budget_value: parseFloat(form.budget_value),
        }),
      });
      if (res.ok) {
        router.push("/job-requests");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header title="إنشاء طلب توظيف جديد" subtitle="أدخل تفاصيل الوظيفة المطلوبة" />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المسمى الوظيفي</label>
              <input name="title" value={form.title} onChange={handleChange} required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">وصف الوظيفة</label>
              <textarea name="description" value={form.description} onChange={handleChange} required rows={4}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">القطاع</label>
                <input name="sector" value={form.sector} onChange={handleChange} required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مستوى الخبرة</label>
                <select name="experience_level" value={form.experience_level} onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                  <option value="JUNIOR">مبتدئ</option>
                  <option value="MID">متوسط</option>
                  <option value="SENIOR">خبير</option>
                  <option value="DIRECTOR">مدير</option>
                  <option value="C_SUITE">تنفيذي</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الراتب الأدنى (ر.س)</label>
                <input name="salary_min" value={form.salary_min} onChange={handleChange} type="number" required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الراتب الأقصى (ر.س)</label>
                <input name="salary_max" value={form.salary_max} onChange={handleChange} type="number" required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع الميزانية</label>
                <select name="budget_type" value={form.budget_type} onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                  <option value="PERCENTAGE_OF_SALARY">نسبة من الراتب</option>
                  <option value="FLAT_FEE">مبلغ ثابت</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">قيمة الميزانية</label>
                <input name="budget_value" value={form.budget_value} onChange={handleChange} type="number" step="0.01" required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input name="saudi_national_required" type="checkbox" checked={form.saudi_national_required}
                onChange={handleChange} className="rounded" id="saudi_required" />
              <label htmlFor="saudi_required" className="text-sm text-gray-700">يشترط أن يكون المرشح سعودي الجنسية</label>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50">
              {loading ? "جاري الحفظ..." : "إنشاء الطلب"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
