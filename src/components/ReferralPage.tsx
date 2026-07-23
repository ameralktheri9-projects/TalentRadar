"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Share2 } from "lucide-react";

interface ReferralData {
  code: string;
  url: string;
  referred: number;
  credits: number;
}

export function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referral/link")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function copyLink() {
    if (!data?.url) return;
    await navigator.clipboard.writeText(data.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    if (!data?.url) return;
    const text = encodeURIComponent(`انضم إلى منصة TalentRadar لتوظيف المواهب: ${data.url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  function shareLinkedIn() {
    if (!data?.url) return;
    const url = encodeURIComponent(data.url);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400">جارٍ التحميل...</div>
    );
  }

  return (
    <div dir="rtl" className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="type-h1 text-gray-950">برنامج الإحالة</h1>
          <p className="type-body text-gray-500 mt-1">شارك المنصة واكسب رصيداً بكل عضو جديد تُحيله</p>
        </div>
      </div>
      <div className="h-px" style={{ background: "linear-gradient(90deg, #00FFD1 0%, #7B61FF 100%)" }} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 relative overflow-hidden">
          <div className="absolute start-0 top-0 bottom-0 w-[3px] rounded-s-xl"
               style={{ background: "linear-gradient(180deg, #00FFD1 0%, #7B61FF 100%)" }} />
          <p className="type-label text-gray-500 ps-3">الأشخاص المُحالون</p>
          <p className="text-[2rem] font-bold text-gray-950 leading-none mt-2 ps-3">{data?.referred ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 relative overflow-hidden">
          <div className="absolute start-0 top-0 bottom-0 w-[3px] rounded-s-xl"
               style={{ background: "linear-gradient(180deg, #00FFD1 0%, #7B61FF 100%)" }} />
          <p className="type-label text-gray-500 ps-3">الرصيد المكتسب</p>
          <p className="text-[2rem] font-bold text-gray-950 leading-none mt-2 ps-3">{data?.credits?.toLocaleString("ar-SA") ?? 0}</p>
          <p className="type-small text-gray-400 ps-3">ريال</p>
        </div>
      </div>

      {/* Referral link */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="type-label text-gray-500 mb-3">رابط الإحالة الخاص بك</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 font-mono text-sm text-gray-700 overflow-hidden text-ellipsis whitespace-nowrap" dir="ltr">
            {data?.url ?? "جارٍ التحميل..."}
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ background: copied ? "#059669" : "#00A88A" }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "تم النسخ" : "نسخ"}
          </button>
        </div>
        {data?.code && (
          <p className="type-small text-gray-400 mt-2">كود الإحالة: <span className="font-mono font-semibold text-gray-600">{data.code}</span></p>
        )}
      </div>

      {/* Share buttons */}
      <div className="flex gap-3">
        <button
          onClick={shareWhatsApp}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#25D366] hover:bg-[#1ebe5c] transition-colors"
        >
          <Share2 className="w-4 h-4" />
          واتساب
        </button>
        <button
          onClick={shareLinkedIn}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#0A66C2] hover:bg-[#0958a8] transition-colors"
        >
          <Share2 className="w-4 h-4" />
          لينكدإن
        </button>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="type-label text-gray-500 mb-4">كيف يعمل البرنامج</p>
        <div className="space-y-4">
          {[
            { step: "1", text: "شارك رابط الإحالة مع زملائك وشركاء الأعمال" },
            { step: "2", text: "يسجلون في المنصة ويكملون أول عملية دفع" },
            { step: "3", text: "تحصل فوراً على 500 ريال رصيد في حسابك" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #00FFD1 0%, #7B61FF 100%)" }}
              >
                {item.step}
              </div>
              <p className="type-body text-gray-700 pt-1">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
