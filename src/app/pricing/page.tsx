import Link from "next/link"

const companyPlans = [
  {
    key: "FREE",
    name: "مجاني",
    price: "0",
    features: ["2 طلب توظيف شهرياً", "بدون بحث عن مرشحين", "بدون تحليلات"],
    cta: "ابدأ مجاناً",
    highlight: false,
  },
  {
    key: "BASIC",
    name: "أساسي",
    price: "499",
    features: ["10 طلبات توظيف شهرياً", "تقدير الراتب بالذكاء الاصطناعي", "تحليلات أساسية"],
    cta: "اشترك الآن",
    highlight: false,
  },
  {
    key: "PRO",
    name: "احترافي",
    price: "1,499",
    features: ["طلبات غير محدودة", "بحث عن المرشحين", "تحليلات كاملة", "تقدير الراتب بالذكاء الاصطناعي"],
    cta: "اشترك الآن",
    highlight: true,
  },
  {
    key: "ENTERPRISE",
    name: "مؤسسي",
    price: "تواصل معنا",
    features: ["كل مزايا الاحترافي", "مدير حساب مخصص", "تكامل مخصص", "دعم أولوية"],
    cta: "تواصل معنا",
    highlight: false,
  },
]

const agencyPlans = [
  {
    key: "FREE",
    name: "مجاني",
    price: "0",
    features: ["2 عروض شهرياً", "بدون ظهور مميز", "بدون تحليلات"],
    cta: "ابدأ مجاناً",
    highlight: false,
  },
  {
    key: "BASIC",
    name: "أساسي",
    price: "299",
    features: ["10 عروض شهرياً", "تحليلات أساسية"],
    cta: "اشترك الآن",
    highlight: false,
  },
  {
    key: "PRO",
    name: "احترافي",
    price: "899",
    features: ["عروض غير محدودة", "ظهور مميز في الطلبات", "تحليلات كاملة"],
    cta: "اشترك الآن",
    highlight: true,
  },
  {
    key: "ELITE",
    name: "نخبة",
    price: "1,999",
    features: ["كل مزايا الاحترافي", "تقارير السوق", "أولوية في قائمة الانتظار", "دعم مخصص"],
    cta: "اشترك الآن",
    highlight: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">خطط الأسعار</h1>
          <p className="text-xl text-gray-600">اختر الخطة المناسبة لاحتياجاتك</p>
        </div>

        {/* Company Plans */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">خطط الشركات</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {companyPlans.map((plan) => (
              <div
                key={plan.key}
                className={`bg-white rounded-2xl shadow-md p-6 flex flex-col ${
                  plan.highlight ? "ring-2 ring-blue-500 shadow-xl" : ""
                }`}
              >
                {plan.highlight && (
                  <div className="text-center mb-3">
                    <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      الأكثر شيوعاً
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  {plan.price === "تواصل معنا" ? (
                    <span className="text-lg font-semibold text-gray-700">{plan.price}</span>
                  ) : (
                    <span>
                      <span className="text-3xl font-bold text-blue-600">{plan.price}</span>
                      <span className="text-gray-500 text-sm"> ر.س / شهر</span>
                    </span>
                  )}
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 font-bold mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register/company"
                  className={`block text-center py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Agency Plans */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">خطط وكالات التوظيف</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {agencyPlans.map((plan) => (
              <div
                key={plan.key}
                className={`bg-white rounded-2xl shadow-md p-6 flex flex-col ${
                  plan.highlight ? "ring-2 ring-teal-500 shadow-xl" : ""
                }`}
              >
                {plan.highlight && (
                  <div className="text-center mb-3">
                    <span className="bg-teal-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      الأكثر شيوعاً
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-teal-600">{plan.price}</span>
                  {plan.price !== "0" && (
                    <span className="text-gray-500 text-sm"> ر.س / شهر</span>
                  )}
                  {plan.price === "0" && (
                    <span className="text-gray-500 text-sm"> مجاناً</span>
                  )}
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 font-bold mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register/agency"
                  className={`block text-center py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? "bg-teal-600 text-white hover:bg-teal-700"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
