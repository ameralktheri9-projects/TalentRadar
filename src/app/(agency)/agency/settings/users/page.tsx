"use client";

import { useState, useEffect } from "react";

interface OrgUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "المالك",
  RECRUITER: "مسؤول توظيف",
  FINANCE: "المالية",
};

export default function AgencyUsersPage() {
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("RECRUITER");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch("/api/org/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleInvite() {
    setInviting(true);
    setError("");
    const res = await fetch("/api/auth/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole, orgType: "AGENCY" }),
    });
    if (res.ok) {
      setShowModal(false);
      setInviteEmail("");
      setInviteRole("RECRUITER");
      await fetchUsers();
    } else {
      const err = await res.json();
      setError(err.error ?? "حدث خطأ");
    }
    setInviting(false);
  }

  async function handleRemove(userId: string) {
    const res = await fetch(`/api/org/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      setConfirmDelete(null);
      await fetchUsers();
    }
  }

  return (
    <div dir="rtl" className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + دعوة مستخدم
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">جارٍ التحميل...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-gray-600">الاسم</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">البريد الإلكتروني</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">الدور</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">الحالة</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">{ROLE_LABELS[u.role] ?? u.role}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {u.status === "ACTIVE" ? "نشط" : u.status === "INVITED" ? "مدعو" : "معطّل"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-left">
                    {confirmDelete === u.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleRemove(u.id)} className="text-xs text-red-600 hover:underline">تأكيد</button>
                        <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-500 hover:underline">إلغاء</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(u.id)} className="text-xs text-red-500 hover:text-red-700">إزالة</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" dir="rtl">
            <h2 className="text-lg font-bold mb-4">دعوة مستخدم جديد</h2>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@agency.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الدور</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="OWNER">المالك</option>
                  <option value="RECRUITER">مسؤول توظيف</option>
                  <option value="FINANCE">المالية</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {inviting ? "جارٍ الإرسال..." : "إرسال الدعوة"}
              </button>
              <button
                onClick={() => { setShowModal(false); setError(""); }}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
