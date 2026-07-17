"use client";

import { useState, useEffect } from "react";

export default function AgencyProfileEditPage() {
  const [form, setForm] = useState({
    name_ar: "",
    name_en: "",
    publicSlug: "",
    bio: "",
    sector_tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agency/profile")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name_ar: data.name_ar ?? "",
          name_en: data.name_en ?? "",
          publicSlug: data.publicSlug ?? "",
          bio: data.bio ?? "",
          sector_tags: data.sector_tags ?? [],
        });
        setLoading(false);
      });
  }, []);

  function addTag() {
    const t = tagInput.trim().toUpperCase();
    if (t && !form.sector_tags.includes(t)) {
      setForm((f) => ({ ...f, sector_tags: [...f.sector_tags, t] }));
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, sector_tags: f.sector_tags.filter((t) => t !== tag) }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setError("");

    const res = await fetch("/api/agency/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    if (res.ok) {
      setMsg("تم حفظ الملف الشخصي بنجاح");
      setTimeout(() => setMsg(""), 4000);
    } else {
      const data = await res.json();
      setError(data.error ?? "حدث خطأ");
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400" dir="rtl">
        جاري التحميل...
      </div>
    );
  }

  const slugPreview = form.publicSlug
    ? `talentradar.sa/agencies/${form.publicSlug}`
    : "talentradar.sa/agencies/...";

  return (
    <div dir="rtl" className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">تعديل الملف الشخصي</h1>

      {msg && <p className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{msg}</p>}
      {error && <p className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</p>}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Name AR */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            اسم الوكالة (عربي)
          </label>
          <input
            type="text"
            value={form.name_ar}
            onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Name EN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            اسم الوكالة (إنجليزي)
          </label>
          <input
            type="text"
            value={form.name_en}
            onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="ltr"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            رابط الملف الشخصي العام
          </label>
          <input
            type="text"
            value={form.publicSlug}
            onChange={(e) =>
              setForm((f) => ({ ...f, publicSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="ltr"
            placeholder="my-agency"
          />
          <p className="text-xs text-gray-400 mt-1 font-mono">{slugPreview}</p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">نبذة تعريفية</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="اكتب نبذة مختصرة عن وكالتك..."
          />
        </div>

        {/* Specializations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">التخصصات</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="مثال: TECHNOLOGY"
              dir="ltr"
            />
            <button
              type="button"
              onClick={addTag}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm"
            >
              إضافة
            </button>
          </div>
          {form.sector_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.sector_tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-blue-900 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </form>
    </div>
  );
}
