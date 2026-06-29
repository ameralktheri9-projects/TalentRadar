import Header from "@/components/layout/Header";

export default function RfpInboxPage() {
  return (
    <div>
      <Header title="صندوق الطلبات" subtitle="طلبات التوظيف المطابقة لتخصصاتك" />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <div className="text-5xl mb-3">📥</div>
          <p>لا توجد طلبات مطابقة حالياً</p>
        </div>
      </div>
    </div>
  );
}
