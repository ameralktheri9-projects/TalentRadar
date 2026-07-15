"use client";

import { useState } from "react";

export default function CandidateSettings() {
  const [visibility, setVisibility] = useState<"OPEN" | "PRIVATE" | "UNAVAILABLE">("OPEN");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleVisibility(v: "OPEN" | "PRIVATE" | "UNAVAILABLE") {
    setVisibility(v);
    await fetch("/api/candidate/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibilityMode: v }),
    });
    setMsg("تم حفظ إعدادات الظهور");
    setTimeout(() => setMsg(""), 3000);
  }

  async function handleDelete() {
    if (deleteConfirm !== "احذف حسابي") return;
    setDeleting(true);
    try {
      await fetch("/api/candidate/account", { method: "DELETE" });
      window.location.href = "/login";
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div dir="rtl" className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">الإعدادات</h1>

      {msg && <p className="text-green-600 text-sm">{msg}</p>}

      {/* Change password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">تغيير كلمة المرور</h2>
        <div className="space-y-3">
          <input type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="كلمة المرور الحالية" />
          <input type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="كلمة المرور الجديدة" />
          <input type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="تأكيد كلمة المرور الجديدة" />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">حفظ كلمة المرور</button>
      </div>

      {/* Visibility */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <h2 className="font-semibold text-gray-700">ظهور الملف الشخصي</h2>
        <p className="text-sm text-gray-500">تحكم في من يمكنه رؤية ملفك الشخصي</p>
        <div className="flex flex-col gap-2">
          {(["OPEN", "PRIVATE", "UNAVAILABLE"] as const).map((v) => {
            const labels: Record<string, string> = { OPEN: "ظاهر للجميع", PRIVATE: "مخفي", UNAVAILABLE: "غير متاح للفرص" };
            return (
              <label key={v} className="flex items-center gap-3 cursor-pointer">
                <input type="radio" checked={visibility === v} onChange={() => handleVisibility(v)} />
                <span className="text-sm text-gray-700">{labels[v]}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-200 p-6 space-y-3">
        <h2 className="font-semibold text-red-600">منطقة الخطر</h2>
        <p className="text-sm text-gray-500">سيؤدي حذف حسابك إلى إزالة جميع بياناتك بشكل دائم ولا يمكن التراجع عن ذلك.</p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-100"
        >
          حذف الحساب
        </button>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4" dir="rtl">
            <h2 className="font-bold text-gray-800">تأكيد حذف الحساب</h2>
            <p className="text-sm text-gray-600">لتأكيد الحذف، اكتب: <strong>احذف حسابي</strong></p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm">إلغاء</button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirm !== "احذف حسابي" || deleting}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-red-700"
              >
                {deleting ? "جاري الحذف..." : "حذف نهائي"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
