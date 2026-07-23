"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function ImpersonateContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage("رمز الانتحال غير موجود");
      return;
    }

    async function doImpersonate() {
      const res = await fetch("/api/admin/impersonate/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setStatus("error");
        setMessage(d.error || "رمز غير صالح أو منتهي الصلاحية");
        return;
      }

      const { redirectTo, email, password, userType } = await res.json();
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        userType,
      });

      if (result?.ok) {
        router.push(redirectTo || "/dashboard");
      } else {
        setStatus("error");
        setMessage("فشل تسجيل الدخول بالانتحال");
      }
    }

    doImpersonate();
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0A0E27 0%, #1A1040 100%)" }}>
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-xl">
        {status === "loading" ? (
          <>
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                 style={{ borderColor: "#00FFD1", borderTopColor: "transparent" }} />
            <p className="text-gray-600">جاري تسجيل الدخول بانتحال الهوية...</p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-red-600 font-semibold mb-2">خطأ</p>
            <p className="text-gray-500 text-sm">{message}</p>
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50"
            >
              العودة
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ImpersonatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0A0E27 0%, #1A1040 100%)" }}>
        <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{ borderColor: "#00FFD1", borderTopColor: "transparent" }} />
      </div>
    }>
      <ImpersonateContent />
    </Suspense>
  );
}
