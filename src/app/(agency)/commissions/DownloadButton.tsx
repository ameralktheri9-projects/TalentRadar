"use client";

export default function DownloadButton() {
  return (
    <button
      onClick={() => alert("قريباً")}
      className="text-sm text-blue-600 hover:underline"
    >
      تحميل كشف الحساب
    </button>
  );
}
