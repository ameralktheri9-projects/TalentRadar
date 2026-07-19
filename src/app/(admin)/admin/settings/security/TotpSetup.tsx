"use client";

import { useState } from "react";
import Image from "next/image";

export default function TotpSetup({ totpEnabled }: { totpEnabled: boolean }) {
  const [step, setStep] = useState<"idle" | "scan" | "verify" | "done">(
    totpEnabled ? "done" : "idle"
  );
  const [uri, setUri] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function startSetup() {
    setLoading(true);
    const res = await fetch("/api/admin/totp/setup");
    const data = await res.json();
    setUri(data.uri);
    setSecret(data.secret);
    setStep("scan");
    setLoading(false);
  }

  async function verify() {
    if (code.length !== 6) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/totp/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      setStep("done");
    } else {
      const d = await res.json();
      setError(d.error || "رمز غير صحيح");
    }
    setLoading(false);
  }

  if (step === "done") {
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <span className="text-emerald-600 text-xl">✓</span>
        <div>
          <p className="font-semibold text-emerald-800">المصادقة الثنائية مفعّلة</p>
          <p className="text-sm text-emerald-600">حسابك محمي بـ TOTP</p>
        </div>
      </div>
    );
  }

  if (step === "scan") {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`;
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          افتح تطبيق Google Authenticator أو Authy وامسح رمز QR:
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrUrl} alt="QR Code" width={200} height={200} className="rounded-lg border border-gray-200" />
        <p className="text-xs text-gray-400 font-mono break-all">{secret}</p>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-lg font-mono w-32 text-center focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
          <button
            onClick={verify}
            disabled={loading || code.length !== 6}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(90deg, #00FFD1 0%, #7B61FF 100%)" }}
          >
            {loading ? "..." : "تحقق"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        أضف طبقة حماية إضافية باستخدام تطبيق المصادقة.
      </p>
      <button
        onClick={startSetup}
        disabled={loading}
        className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
      >
        {loading ? "جاري التحميل..." : "تفعيل المصادقة الثنائية"}
      </button>
    </div>
  );
}
