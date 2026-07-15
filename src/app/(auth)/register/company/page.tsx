"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SECTORS = [
  { value: "TECHNOLOGY", label: "التكنولوجيا" },
  { value: "HEALTHCARE", label: "الرعاية الصحية" },
  { value: "FINANCE", label: "المالية" },
  { value: "EDUCATION", label: "التعليم" },
  { value: "RETAIL", label: "التجزئة" },
  { value: "MANUFACTURING", label: "التصنيع" },
  { value: "CONSTRUCTION", label: "البناء والتشييد" },
  { value: "ENERGY", label: "الطاقة" },
  { value: "LOGISTICS", label: "اللوجستيات" },
  { value: "HOSPITALITY", label: "الضيافة" },
  { value: "MEDIA", label: "الإعلام" },
  { value: "GOVERNMENT", label: "القطاع الحكومي" },
  { value: "OTHER", label: "أخرى" },
];

const CITIES = [
  { value: "RIYADH", label: "الرياض" },
  { value: "JEDDAH", label: "جدة" },
  { value: "MECCA", label: "مكة المكرمة" },
  { value: "MEDINA", label: "المدينة المنورة" },
  { value: "DAMMAM", label: "الدمام" },
  { value: "KHOBAR", label: "الخبر" },
  { value: "DHAHRAN", label: "الظهران" },
  { value: "TABUK", label: "تبوك" },
  { value: "ABHA", label: "أبها" },
  { value: "TAIF", label: "الطائف" },
  { value: "OTHER", label: "أخرى" },
];

export default function CompanyRegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    name_ar: "",
    name_en: "",
    cr_number: "",
    industry_sector: "",
    city: "",
    saudi_employee_count: "",
    total_employee_count: "",
    contact_name: "",
    contact_email: "",
    contact_password: "",
    contact_password_confirm: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.contact_password !== form.contact_password_confirm) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tradeName: form.name_ar || form.name_en,
          crNumber: form.cr_number,
          sector: form.industry_sector,
          contactName: form.contact_name,
          contactEmail: form.contact_email,
          password: form.contact_password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء التسجيل");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(form.contact_email)}&userType=COMPANY`);
      }, 2000);
    } catch {
      setError("حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">تحقق من بريدك الإلكتروني</h2>
          <p className="text-gray-600">أرسلنا رمز تحقق إلى {form.contact_email}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">منصة صيد المواهب</h1>
          <p className="text-gray-600 mt-1">تسجيل شركة جديدة</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">بيانات الشركة</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشركة (بالعربية)</label>
                <input
                  name="name_ar"
                  value={form.name_ar}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="شركة المثال للتقنية"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name (English)</label>
                <input
                  name="name_en"
                  value={form.name_en}
                  onChange={handleChange}
                  required
                  dir="ltr"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Example Tech Co."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم السجل التجاري</label>
              <input
                name="cr_number"
                value={form.cr_number}
                onChange={handleChange}
                required
                dir="ltr"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="1010XXXXXX"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">القطاع</label>
                <select
                  name="industry_sector"
                  value={form.industry_sector}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="">اختر القطاع</option>
                  {SECTORS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
                <select
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="">اختر المدينة</option>
                  {CITIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عدد الموظفين السعوديين</label>
                <input
                  name="saudi_employee_count"
                  value={form.saudi_employee_count}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">إجمالي الموظفين</label>
                <input
                  name="total_employee_count"
                  value={form.total_employee_count}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">بيانات المسؤول الرئيسي</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
                  <input
                    name="contact_name"
                    value={form.contact_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="محمد عبدالله"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                  <input
                    name="contact_email"
                    value={form.contact_email}
                    onChange={handleChange}
                    required
                    type="email"
                    dir="ltr"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="hr@company.sa"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
                    <input
                      name="contact_password"
                      value={form.contact_password}
                      onChange={handleChange}
                      required
                      type="password"
                      minLength={8}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور</label>
                    <input
                      name="contact_password_confirm"
                      value={form.contact_password_confirm}
                      onChange={handleChange}
                      required
                      type="password"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? "جاري التسجيل..." : "تسجيل الشركة"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-4">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
