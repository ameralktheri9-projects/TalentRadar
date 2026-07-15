"use client";

import { useState } from "react";

interface Props {
  candidateSubmissionId: string;
}

export default function ProposeInterviewModal({ candidateSubmissionId }: Props) {
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState(["", "", ""]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function updateSlot(index: number, value: string) {
    setSlots((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  async function handleSubmit() {
    const proposedSlots = slots.filter((s) => s.trim() !== "");
    if (proposedSlots.length === 0) {
      setError("يجب تحديد موعد واحد على الأقل");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/interviews/propose-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateSubmissionId, proposedSlots, notes }),
    });
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setSlots(["", "", ""]);
        setNotes("");
      }, 2000);
    } else {
      const err = await res.json();
      setError(err.error ?? "حدث خطأ");
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        جدولة مقابلة
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" dir="rtl">
            <h2 className="text-lg font-bold mb-4">اقتراح مواعيد مقابلة</h2>

            {success ? (
              <div className="text-center py-6 text-green-600 font-medium">
                تم إرسال مواعيد المقابلة بنجاح
              </div>
            ) : (
              <>
                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                <div className="space-y-3 mb-4">
                  {slots.map((slot, i) => (
                    <div key={i}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الموعد {i + 1} {i === 0 && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="datetime-local"
                        value={slot}
                        onChange={(e) => updateSlot(i, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات (اختياري)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أي تعليمات أو ملاحظات للمرشح..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "جارٍ الإرسال..." : "إرسال المواعيد"}
                  </button>
                  <button
                    onClick={() => { setOpen(false); setError(""); }}
                    className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
