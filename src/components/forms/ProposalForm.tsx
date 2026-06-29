"use client";

// Reusable proposal submission form for agency users

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProposalFormProps {
  jobRequestId: string;
  onSuccess?: () => void;
}

export default function ProposalForm({ jobRequestId, onSuccess }: ProposalFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    candidate_count_available: 1,
    fee_type: "PERCENTAGE" as "PERCENTAGE" | "FLAT",
    fee_value: 0,
    timeline_days: 30,
    guarantee_days: 90,
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["candidate_count_available", "fee_value", "timeline_days", "guarantee_days"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, job_request_id: jobRequestId }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "حدث خطأ أثناء تقديم العرض");
        return;
      }

      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch {
      setError("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-700 font-semibold text-lg mb-2">تم تقديم العرض بنجاح</div>
        <p className="text-green-600 text-sm">سيتم مراجعة عرضك من قبل الشركة وسيتم إشعارك بالنتيجة</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            عدد المرشحين المتاحين
          </label>
          <input
            type="number"
            name="candidate_count_available"
            value={form.candidate_count_available}
            onChange={handleChange}
            min={1}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            نوع الرسوم
          </label>
          <select
            name="fee_type"
            value={form.fee_type}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PERCENTAGE">نسبة مئوية من الراتب</option>
            <option value="FLAT">مبلغ ثابت</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            قيمة الرسوم {form.fee_type === "PERCENTAGE" ? "(%)" : "(ريال سعودي)"}
          </label>
          <input
            type="number"
            name="fee_value"
            value={form.fee_value}
            onChange={handleChange}
            min={0}
            step={form.fee_type === "PERCENTAGE" ? 0.1 : 1}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            مدة التنفيذ (بالأيام)
          </label>
          <input
            type="number"
            name="timeline_days"
            value={form.timeline_days}
            onChange={handleChange}
            min={1}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            فترة الضمان (بالأيام)
          </label>
          <input
            type="number"
            name="guarantee_days"
            value={form.guarantee_days}
            onChange={handleChange}
            min={0}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ملاحظات إضافية
        </label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={4}
          placeholder="أضف أي تفاصيل أو ملاحظات إضافية..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-6 rounded-lg text-sm transition-colors"
        >
          {loading ? "جارٍ التقديم..." : "تقديم العرض"}
        </button>
      </div>
    </form>
  );
}
