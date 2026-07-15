"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AgencyRegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name_ar: "",
    name_en: "",
    hrsd_licence: "",
    founded_year: "",
    team_size: "1",
    sector_tags: "",
    contact_name: "",
    contact_email: "",
    contact_password: "",
    contact_password_confirm: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      const res = await fetch("/api/auth/register/agency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName: form.name_ar || form.name_en,
          hrsdLicenseNumber: form.hrsd_licence,
          ownerName: form.contact_name,
          email: form.contact_email,
          password: form.contact_password,
          specializations: form.sector_tags.split(",").map((s: string) => s.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء التسجيل");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(form.contact_email)}&userType=AGENCY`);
      }, 2000);
    } catch {
      setError("حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">تحقق من بريدك الإلكتروني</h2>
          <p className="text-gray-600">أرسلنا رمز تحقق إلى {form.contact_email}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">منصة صيد المواهب</h1>
          <p className="text-gray-600 mt-1">تسجيل وكالة توظيف جديدة</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">بيانات الوكالة</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الوكالة (بالعربية)</label>
                <input
                  name="name_ar"
                  value={form.name_ar}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  placeholder="وكالة المواهب للتوظيف"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name (English)</label>
                <input
                  name="name_en"
                  value={form.name_en}
                  onChange={handleChange}
                  required
                  dir="ltr"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  placeholder="Talent Agency Recruitment"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم ترخيص وزارة الموارد البشرية (HRSD)</label>
              <input
                name="hrsd_licence"
                value={form.hrsd_licence}
                onChange={handleChange}
                required
                dir="ltr"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                placeholder="HRSD-XXXX-XXXX"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سنة التأسيس</label>
                <input
                  name="founded_year"
                  value={form.founded_year}
                  onChange={handleChange}
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  placeholder="2015"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">حجم الفريق</label>
                <input
                  name="team_size"
                  value={form.team_size}
                  onChange={handleChange}
                  type="number"
                  min="1"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تخصصات القطاعات (مفصولة بفاصلة)</label>
              <input
                name="sector_tags"
                value={form.sector_tags}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                placeholder="التقنية, المالية, الرعاية الصحية"
              />
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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
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
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
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
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
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
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? "جاري التسجيل..." : "تسجيل الوكالة"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-4">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="text-teal-600 hover:underline font-medium">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
