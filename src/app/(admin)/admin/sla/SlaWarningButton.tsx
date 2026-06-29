"use client";

import { useState } from "react";

interface Props {
  breachId: string;
  agencyName: string;
}

export default function SlaWarningButton({ breachId, agencyName }: Props) {
  const [sent, setSent] = useState(false);

  function handleSend() {
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <button
      onClick={handleSend}
      disabled={sent}
      className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
        sent
          ? "bg-green-100 text-green-700 cursor-default"
          : "bg-slate-800 hover:bg-slate-900 text-white"
      }`}
    >
      {sent ? "تم الإرسال" : "إرسال تحذير"}
    </button>
  );
}
