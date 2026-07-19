"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type UserType = "COMPANY" | "AGENCY" | "ADMIN";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<UserType>("COMPANY");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      userType,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("بيانات الدخول غير صحيحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.");
      return;
    }

    if (userType === "ADMIN") {
      router.push("/admin/dashboard");
    } else if (userType === "AGENCY") {
      router.push("/agency/dashboard");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">منصة صيد المواهب</h1>
          <p className="text-gray-600 mt-2">TalentHunt — B2B Recruitment Marketplace</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">تسجيل الدخول</h2>

          {/* User type selector */}
          <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1">
            {[
              { value: "COMPANY", label: "شركة", labelEn: "Company" },
              { value: "AGENCY", label: "وكالة", labelEn: "Agency" },
              { value: "ADMIN", label: "إداري", labelEn: "Admin" },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setUserType(type.value as UserType)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  userType === type.value
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="example@company.sa"
                dir="ltr"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                كلمة المرور
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-600 mb-3">ليس لديك حساب؟</p>
            <div className="flex gap-3">
              <Link
                href="/register/company"
                className="flex-1 text-center bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
              >
                تسجيل شركة
              </Link>
              <Link
                href="/register/agency"
                className="flex-1 text-center bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
              >
                تسجيل وكالة
              </Link>
            </div>
            <div className="mt-3 text-center">
              <Link
                href="/login/candidate"
                className="text-sm text-purple-600 hover:underline"
              >
                أنت مرشح؟ سجّل دخولك هنا
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
