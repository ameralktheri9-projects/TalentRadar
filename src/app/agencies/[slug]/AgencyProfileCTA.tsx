"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function AgencyProfileCTA() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  const href = isLoggedIn ? "/job-requests/new" : "/register/company";

  return (
    <div className="bg-blue-600 rounded-xl p-8 text-center text-white">
      <h2 className="text-xl font-bold mb-2">هل تبحث عن موظفين؟</h2>
      <p className="text-blue-100 text-sm mb-6">
        أرسل طلب توظيف واحصل على مرشحين مؤهلين خلال أيام
      </p>
      <Link
        href={href}
        className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors"
      >
        أرسل طلب توظيف
      </Link>
    </div>
  );
}
