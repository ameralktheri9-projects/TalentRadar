export const dynamic = "force-dynamic";

import Header from "@/components/layout/Header";

const weights = [
  { label: "تطابق القطاع", points: 30, description: "مدى تطابق تخصصات الوكالة مع قطاع الطلب" },
  { label: "تقييم الوكالة", points: 25, description: "متوسط تقييم الوكالة من العملاء السابقين" },
  { label: "وقت الاستجابة", points: 20, description: "سرعة الوكالة في الرد على الطلبات" },
  { label: "التوظيفات السابقة", points: 15, description: "عدد ونسبة التوظيفات الناجحة" },
  { label: "تنافسية الرسوم", points: 10, description: "مدى توافق رسوم الوكالة مع ميزانية الطلب" },
];

export default function MatchingConfigPage() {
  const total = weights.reduce((s, w) => s + w.points, 0);

  return (
    <div>
      <Header title="إعداد التطابق" subtitle="أوزان خوارزمية مطابقة الوكالات" />
      <div className="p-6 max-w-2xl" dir="rtl">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">أوزان نقاط التطابق</h2>
              <p className="text-xs text-gray-400 mt-0.5">المجموع الكلي: {total} نقطة</p>
            </div>
            <span className="bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1 rounded-full">
              للقراءة فقط
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {weights.map((w) => (
              <div key={w.label} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-800">{w.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{w.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-blue-600">{w.points}</span>
                    <span className="text-gray-400 text-sm"> نقطة</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${(w.points / total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-700 text-sm">
            يمكن تعديل الأوزان في النسخة القادمة
          </p>
        </div>
      </div>
    </div>
  );
}
