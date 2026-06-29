import Header from "@/components/layout/Header";

export default function RfpDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <Header title="تفاصيل الطلب" subtitle={`ID: ${params.id}`} />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <div className="text-5xl mb-3">📋</div>
          <p>جاري تحميل تفاصيل الطلب...</p>
        </div>
      </div>
    </div>
  );
}
