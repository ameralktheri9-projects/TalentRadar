import Header from "@/components/layout/Header";

export default function AdminAgenciesPage() {
  return (
    <div>
      <Header title="إدارة الوكالات" subtitle="الموافقة على الوكالات وإدارتها" />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <div className="text-5xl mb-3">🏢</div>
          <p>لا توجد وكالات بعد</p>
        </div>
      </div>
    </div>
  );
}
