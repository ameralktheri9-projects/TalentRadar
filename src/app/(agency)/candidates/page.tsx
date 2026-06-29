import Header from "@/components/layout/Header";

export default function CandidatesPage() {
  return (
    <div>
      <Header title="المرشحون" subtitle="إدارة قاعدة المرشحين" />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <div className="text-5xl mb-3">👥</div>
          <p>لا يوجد مرشحون بعد</p>
        </div>
      </div>
    </div>
  );
}
